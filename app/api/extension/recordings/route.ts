// ============================================
// app/api/extension/recordings/route.ts
// FIXED: Proper large file handling for App Router
// ============================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Route configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
    console.log('[API] Extension recording upload started');
    console.log('[API] Content-Type:', request.headers.get('content-type'));
    console.log('[API] Content-Length:', request.headers.get('content-length'));

    try {
        // Get auth token from header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Create Supabase client
        const supabase = await createClient();

        // Verify user token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('[API] Auth error:', authError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        console.log('[API] Authenticated user:', user.id);

        // Parse FormData with better error handling
        let formData: FormData;
        try {
            formData = await request.formData();
            console.log('[API] FormData parsed successfully');

            // Log all form data keys for debugging
            const keys = Array.from(formData.keys());
            console.log('[API] FormData keys:', keys);
        } catch (parseError: any) {
            console.error('[API] FormData parse error:', parseError);
            console.error('[API] Error details:', parseError.message);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to parse upload data. The file may be too large or corrupted.',
                    details: parseError.message
                },
                { status: 400 }
            );
        }

        // Extract and validate fields
        const videoFile = formData.get('video') as File | null;
        const title = formData.get('title') as string | null;
        const comment = formData.get('comment') as string | null;
        const durationStr = formData.get('duration') as string | null;
        const suiteId = formData.get('suite_id') as string | null;
        const sprintId = formData.get('sprint_id') as string | null;
        const metadataStr = formData.get('metadata') as string | null;
        const consoleLogsFile = formData.get('console_logs') as File | null;
        const networkLogsFile = formData.get('network_logs') as File | null;

        console.log('[API] Extracted fields:', {
            hasVideo: !!videoFile,
            videoSize: videoFile?.size,
            title,
            suiteId,
            hasConsoleLogs: !!consoleLogsFile,
            hasNetworkLogs: !!networkLogsFile
        });

        // Validate required fields
        if (!videoFile) {
            return NextResponse.json(
                { success: false, error: 'Missing video file' },
                { status: 400 }
            );
        }

        if (!title) {
            return NextResponse.json(
                { success: false, error: 'Missing recording title' },
                { status: 400 }
            );
        }

        if (!suiteId) {
            return NextResponse.json(
                { success: false, error: 'Missing suite_id' },
                { status: 400 }
            );
        }

        // Check file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (videoFile.size > maxSize) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Video file too large. Maximum size is 100MB, your file is ${(videoFile.size / 1024 / 1024).toFixed(2)}MB`
                },
                { status: 400 }
            );
        }

        const duration = durationStr ? parseFloat(durationStr) : 0;
        let metadata = {};

        if (metadataStr) {
            try {
                metadata = JSON.parse(metadataStr);
            } catch (e) {
                console.warn('[API] Failed to parse metadata JSON:', e);
            }
        }

        console.log('[API] Processing upload:', {
            title,
            suiteId,
            videoSize: `${(videoFile.size / 1024 / 1024).toFixed(2)}MB`,
            videoType: videoFile.type,
            duration
        });

        // Verify user has access to this suite
        const { data: suiteAccess, error: suiteError } = await supabase
            .from('test_suites')
            .select('owner_id, admins, members')
            .eq('id', suiteId)
            .single();

        if (suiteError || !suiteAccess) {
            console.error('[API] Suite access error:', suiteError);
            return NextResponse.json(
                { success: false, error: 'Suite not found or access denied' },
                { status: 403 }
            );
        }

        // Check if user has write access
        const hasAccess =
            suiteAccess.owner_id === user.id ||
            suiteAccess.admins?.includes(user.id) ||
            suiteAccess.members?.includes(user.id);

        if (!hasAccess) {
            console.error('[API] User does not have access to suite');
            return NextResponse.json(
                { success: false, error: 'You do not have access to this test suite' },
                { status: 403 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const videoFileName = `${suiteId}/${timestamp}.webm`;

        // Convert File to Buffer for Supabase upload
        console.log('[API] Converting video file to buffer...');
        const videoArrayBuffer = await videoFile.arrayBuffer();
        const videoBuffer = Buffer.from(videoArrayBuffer);
        console.log('[API] Video buffer created, size:', videoBuffer.length);

        // Upload video to Supabase Storage
        console.log('[API] Uploading video to storage...');
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('recordings')
            .upload(videoFileName, videoBuffer, {
                contentType: 'video/webm',  // Force simple MIME type
                cacheControl: '3600',
                upsert: false
            });;

        if (uploadError) {
            console.error('[API] Video upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('recordings')
            .getPublicUrl(videoFileName);

        console.log('[API] Video uploaded successfully:', urlData.publicUrl);

        // Upload console logs if provided
        let consoleLogsUrl = null;
        if (consoleLogsFile && consoleLogsFile.size > 0) {
            console.log('[API] Uploading console logs...');
            const logsFileName = `${suiteId}/${timestamp}_console_logs.json`;
            const logsArrayBuffer = await consoleLogsFile.arrayBuffer();
            const logsBuffer = Buffer.from(logsArrayBuffer);

            const { error: logsError } = await supabase.storage
                .from('recordings')
                .upload(logsFileName, logsBuffer, {
                    contentType: 'application/json',
                    cacheControl: '3600'
                });

            if (!logsError) {
                const { data: logsUrlData } = supabase.storage
                    .from('recordings')
                    .getPublicUrl(logsFileName);
                consoleLogsUrl = logsUrlData.publicUrl;
                console.log('[API] Console logs uploaded');
            } else {
                console.warn('[API] Console logs upload failed:', logsError);
            }
        }

        // Upload network logs if provided
        let networkLogsUrl = null;
        if (networkLogsFile && networkLogsFile.size > 0) {
            console.log('[API] Uploading network logs...');
            const logsFileName = `${suiteId}/${timestamp}_network_logs.json`;
            const logsArrayBuffer = await networkLogsFile.arrayBuffer();
            const logsBuffer = Buffer.from(logsArrayBuffer);

            const { error: logsError } = await supabase.storage
                .from('recordings')
                .upload(logsFileName, logsBuffer, {
                    contentType: 'application/json',
                    cacheControl: '3600'
                });

            if (!logsError) {
                const { data: logsUrlData } = supabase.storage
                    .from('recordings')
                    .getPublicUrl(logsFileName);
                networkLogsUrl = logsUrlData.publicUrl;
                console.log('[API] Network logs uploaded');
            } else {
                console.warn('[API] Network logs upload failed:', logsError);
            }
        }

        // Create database record
        const recordingRecord = {
            suite_id: suiteId,
            sprint_id: sprintId || null,
            title: title,
            url: urlData.publicUrl,
            duration: duration,
            created_by: user.id,
            archived: false,
            metadata: {
                ...metadata,
                fileName: videoFileName,
                consoleLogsUrl: consoleLogsUrl,
                networkLogsUrl: networkLogsUrl,
                comment: comment || null,
                source: 'extension'
            }
        };

        console.log('[API] Creating database record...');
        const { data: dbData, error: dbError } = await supabase
            .from('recordings')
            .insert(recordingRecord)
            .select()
            .single();

        if (dbError) {
            console.error('[API] Database insert error:', dbError);
            throw new Error(`Database insert failed: ${dbError.message}`);
        }

        console.log('[API] Recording saved successfully:', dbData.id);

        // Log activity
        await supabase.from('activity_logs').insert({
            user_id: user.id,
            action: 'recording_created',
            resource_type: 'recording',
            resource_id: dbData.id,
            metadata: {
                title: dbData.title,
                source: 'extension',
                duration: dbData.duration
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                id: dbData.id,
                title: dbData.title,
                url: dbData.url,
                created_at: dbData.created_at
            },
            message: 'Recording saved successfully'
        });

    } catch (error: any) {
        console.error('[API] Error saving recording:', error);
        console.error('[API] Error stack:', error.stack);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to save recording',
                details: error.stack
            },
            { status: 500 }
        );
    }
}