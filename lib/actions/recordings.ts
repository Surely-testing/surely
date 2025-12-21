// ============================================
// lib/actions/recordings.ts - FIXED DELETE
// ============================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { Recording, RecordingFormData, RecordingFilters } from '@/types/recording.types';
import { revalidatePath } from 'next/cache';

export async function getRecordings(
  suiteId: string,
  filters?: RecordingFilters
): Promise<{ data: Recording[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('recordings')
      .select('*')
      .eq('suite_id', suiteId);

    // Apply filters
    if (filters?.sprint_id) {
      query = query.eq('sprint_id', filters.sprint_id);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply sorting
    switch (filters?.sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'duration':
        query = query.order('duration', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    logger.log('Error fetching recordings:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch recordings',
    };
  }
}

export async function getRecording(
  recordingId: string
): Promise<{ data: Recording | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    logger.log('Error fetching recording:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch recording',
    };
  }
}

export async function createRecording(
  formData: RecordingFormData
): Promise<{ data: Recording | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('recordings')
      .insert({
        ...formData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'recording_created',
      resource_type: 'recording',
      resource_id: data.id,
      metadata: { title: data.title },
    });

    revalidatePath('/dashboard/recordings');
    revalidatePath(`/dashboard/suites/${formData.suite_id}`);

    return { data, error: null };
  } catch (error) {
    logger.log('Error creating recording:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create recording',
    };
  }
}

export async function updateRecording(
  recordingId: string,
  updates: Partial<RecordingFormData>
): Promise<{ data: Recording | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('recordings')
      .update(updates)
      .eq('id', recordingId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/recordings');
    revalidatePath(`/dashboard/recordings/${recordingId}`);

    return { data, error: null };
  } catch (error) {
    logger.log('Error updating recording:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update recording',
    };
  }
}

export async function deleteRecording(
  recordingId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get recording details first
    const { data: recording, error: fetchError } = await supabase
      .from('recordings')
      .select('*, test_suites(owner_id, admins)')
      .eq('id', recordingId)
      .single();

    if (fetchError) throw fetchError;

    // Check permissions - only suite owner/admins can delete
    const isOwner = recording.test_suites?.owner_id === user.id;
    const isAdmin = recording.test_suites?.admins?.includes(user.id);

    if (!isOwner && !isAdmin) {
      throw new Error('Permission denied. Only suite owners and admins can delete recordings.');
    }

    // Delete video file from Supabase Storage
    if (recording.metadata && typeof recording.metadata === 'object' && 'fileName' in recording.metadata) {
      const { error: storageError } = await supabase.storage
        .from('recordings')
        .remove([(recording.metadata as Record<string, any>).fileName]);

      if (storageError) {
        logger.log('Storage deletion error:', storageError);
        // Continue anyway - we still want to delete the database record
      }
    }

    // Delete console logs file if exists
    if (recording.metadata && typeof recording.metadata === 'object' && 'consoleLogsUrl' in recording.metadata) {
      const logFileName = `${recording.suite_id}/${recordingId}/console_logs.json`;
      await supabase.storage.from('recordings').remove([logFileName]);
    }

    // Delete network logs file if exists
    if (recording.metadata && typeof recording.metadata === 'object' && 'networkLogsUrl' in recording.metadata) {
      const logFileName = `${recording.suite_id}/${recordingId}/network_logs.json`;
      await supabase.storage.from('recordings').remove([logFileName]);
    }

    // Move to trash before deleting
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase.from('trash').insert({
      suite_id: recording.suite_id,
      asset_type: 'recordings',
      asset_id: recordingId,
      asset_data: recording,
      deleted_by: user.id,
      expires_at: expiresAt.toISOString(),
    });

    // Delete database record
    const { error: deleteError } = await supabase
      .from('recordings')
      .delete()
      .eq('id', recordingId);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'recording_deleted',
      resource_type: 'recording',
      resource_id: recordingId,
      metadata: { title: recording.title },
    });

    revalidatePath('/dashboard/recordings');
    revalidatePath(`/dashboard/suites/${recording.suite_id}`);

    return { success: true, error: null };
  } catch (error) {
    logger.log('Error deleting recording:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete recording',
    };
  }
}

// Upload logs to Supabase Storage
export async function uploadLogs(
  suiteId: string,
  recordingId: string,
  logs: any,
  type: 'console' | 'network'
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Convert logs to JSON blob
    const logsJson = JSON.stringify(logs, null, 2);
    const logsBlob = new Blob([logsJson], { type: 'application/json' });

    // Upload to Supabase Storage
    const fileName = `${suiteId}/${recordingId}/${type}_logs.json`;
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(fileName, logsBlob, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    logger.log('Error uploading logs:', error);
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to upload logs',
    };
  }
}