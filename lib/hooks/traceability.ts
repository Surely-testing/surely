// ============================================
// lib/utils/traceability.ts
// Helper functions for managing traceability relationships
// ============================================

import { createClient } from '@/lib/supabase/client';
import { logger } from '../utils/logger';

/**
 * Link a bug to a test case
 */
export async function linkBugToTestCase(bugId: string, testCaseId: string, userId?: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('bug_test_cases')
      .insert({
        bug_id: bugId,
        test_case_id: testCaseId,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate error (unique constraint violation)
      if (error.code === '23505') {
        logger.log('Relationship already exists');
        return { success: true, data: null, message: 'Relationship already exists' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    logger.log('Error linking bug to test case:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Link a bug to a recording
 */
export async function linkBugToRecording(bugId: string, recordingId: string, userId?: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('bug_recordings')
      .insert({
        bug_id: bugId,
        recording_id: recordingId,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        logger.log('Relationship already exists');
        return { success: true, data: null, message: 'Relationship already exists' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    logger.log('Error linking bug to recording:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unlink a bug from a test case
 */
export async function unlinkBugFromTestCase(bugId: string, testCaseId: string) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('bug_test_cases')
      .delete()
      .eq('bug_id', bugId)
      .eq('test_case_id', testCaseId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    logger.log('Error unlinking bug from test case:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unlink a bug from a recording
 */
export async function unlinkBugFromRecording(bugId: string, recordingId: string) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('bug_recordings')
      .delete()
      .eq('bug_id', bugId)
      .eq('test_case_id', recordingId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    logger.log('Error unlinking bug from recording:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all test cases linked to a bug
 */
export async function getBugTestCases(bugId: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('bug_test_cases')
      .select(`
        test_case_id,
        test_cases (
          id,
          title,
          status,
          priority,
          created_at
        )
      `)
      .eq('bug_id', bugId);

    if (error) throw error;

    return { 
      success: true, 
      data: data?.map(d => d.test_cases).filter(Boolean) || [] 
    };
  } catch (error: any) {
    logger.log('Error fetching bug test cases:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get all recordings linked to a bug
 */
export async function getBugRecordings(bugId: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('bug_recordings')
      .select(`
        recording_id,
        recordings (
          id,
          title,
          duration,
          created_at
        )
      `)
      .eq('bug_id', bugId);

    if (error) throw error;

    return { 
      success: true, 
      data: data?.map(d => d.recordings).filter(Boolean) || [] 
    };
  } catch (error: any) {
    logger.log('Error fetching bug recordings:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get all bugs linked to a test case
 */
export async function getTestCaseBugs(testCaseId: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('bug_test_cases')
      .select(`
        bug_id,
        bugs (
          id,
          title,
          status,
          severity,
          priority,
          created_at
        )
      `)
      .eq('test_case_id', testCaseId);

    if (error) throw error;

    return { 
      success: true, 
      data: data?.map(d => d.bugs).filter(Boolean) || [] 
    };
  } catch (error: any) {
    logger.log('Error fetching test case bugs:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get all bugs linked to a recording
 */
export async function getRecordingBugs(recordingId: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('bug_recordings')
      .select(`
        bug_id,
        bugs (
          id,
          title,
          status,
          severity,
          priority,
          created_at
        )
      `)
      .eq('recording_id', recordingId);

    if (error) throw error;

    return { 
      success: true, 
      data: data?.map(d => d.bugs).filter(Boolean) || [] 
    };
  } catch (error: any) {
    logger.log('Error fetching recording bugs:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Bulk link multiple test cases to a bug
 */
export async function bulkLinkTestCases(bugId: string, testCaseIds: string[], userId?: string) {
  const supabase = createClient();
  
  try {
    const inserts = testCaseIds.map(testCaseId => ({
      bug_id: bugId,
      test_case_id: testCaseId,
      created_by: userId
    }));

    const { data, error } = await supabase
      .from('bug_test_cases')
      .insert(inserts)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    logger.log('Error bulk linking test cases:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get traceability stats for a suite
 */
export async function getTraceabilityStats(suiteId: string) {
  const supabase = createClient();
  
  try {
    // Get bugs count
    const { count: bugsCount } = await supabase
      .from('bugs')
      .select('*', { count: 'exact', head: true })
      .eq('suite_id', suiteId);

    // Get test cases count
    const { count: testCasesCount } = await supabase
      .from('test_cases')
      .select('*', { count: 'exact', head: true })
      .eq('suite_id', suiteId);

    // Get recordings count
    const { count: recordingsCount } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('suite_id', suiteId);

    // Get bugs with relationships
    const { data: linkedBugs } = await supabase
      .from('bugs')
      .select(`
        id,
        bug_test_cases!left(test_case_id),
        bug_recordings!left(recording_id)
      `)
      .eq('suite_id', suiteId);

    const bugsWithRelationships = linkedBugs?.filter(bug => 
      (bug.bug_test_cases && bug.bug_test_cases.length > 0) ||
      (bug.bug_recordings && bug.bug_recordings.length > 0)
    ).length || 0;

    return {
      success: true,
      stats: {
        bugs: bugsCount || 0,
        testCases: testCasesCount || 0,
        recordings: recordingsCount || 0,
        linkedBugs: bugsWithRelationships,
        coveragePercentage: bugsCount ? Math.round((bugsWithRelationships / bugsCount) * 100) : 0
      }
    };
  } catch (error: any) {
    logger.log('Error fetching traceability stats:', error);
    return { 
      success: false, 
      error: error.message,
      stats: {
        bugs: 0,
        testCases: 0,
        recordings: 0,
        linkedBugs: 0,
        coveragePercentage: 0
      }
    };
  }
}