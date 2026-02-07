// ============================================
// app/api/extension/screenshots/route.ts
// FIXED: Proper CORS + screenshot upload
// ============================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    console.log('[API] Extension screenshot upload started');

    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid authorization header' },
                { status: 401, headers: corsHeaders }
            );
        }

        const token = authHeader.substring(7);
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('[API] Auth error:', authError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401, headers: corsHeaders }
            );
        }

        console.log('[API] Authenticated user:', user.id);

        let formData: FormData;
        try {
            formData = await request.formData();
            const keys = Array.from(formData.keys());
            console.log('[API] FormData keys:', keys);
        } catch (parseError: any) {
            return NextResponse.json(
                { success: false, error: 'Failed to parse upload data' },
                { status: 400, headers: corsHeaders }
            );
        }

        const imageFile = formData.get('image') as File | null;
        const title = formData.get('title') as string | null;
        const description = formData.get('description') as string | null;
        const metadataStr = formData.get('metadata') as string | null;

        if (!imageFile) {
            return NextResponse.json(
                { success: false, error: 'Missing image file' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!title) {
            return NextResponse.json(
                { success: false, error: 'Missing screenshot title' },
                { status: 400, headers: corsHeaders }
            );
        }

        let metadata: any = {};
        if (metadataStr) {
            try {
                metadata = JSON.parse(metadataStr);
            } catch (e) {
                console.warn('[API] Failed to parse metadata JSON:', e);
            }
        }

        const suiteId = metadata.suite_id;
        if (!suiteId) {
            return NextResponse.json(
                { success: false, error: 'Missing suite_id in metadata' },
                { status: 400, headers: corsHeaders }
            );
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (imageFile.size > maxSize) {
            return NextResponse.json(
                { success: false, error: `Image too large. Max 10MB` },
                { status: 400, headers: corsHeaders }
            );
        }

        const { data: suiteAccess, error: suiteError } = await supabase
            .from('test_suites')
            .select('owner_id, admins, members')
            .eq('id', suiteId)
            .single();

        if (suiteError || !suiteAccess) {
            return NextResponse.json(
                { success: false, error: 'Suite not found or access denied' },
                { status: 403, headers: corsHeaders }
            );
        }

        const hasAccess =
            suiteAccess.owner_id === user.id ||
            suiteAccess.admins?.includes(user.id) ||
            suiteAccess.members?.includes(user.id);

        if (!hasAccess) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403, headers: corsHeaders }
            );
        }

        const timestamp = Date.now();
        const imageFileName = `${suiteId}/${timestamp}.png`;

        const imageArrayBuffer = await imageFile.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from('recordings')
            .upload(imageFileName, imageBuffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from('recordings')
            .getPublicUrl(imageFileName);

        const screenshotRecord = {
            suite_id: suiteId,
            title: title,
            description: description || null,
            file_url: urlData.publicUrl,
            file_path: imageFileName,
            file_size: imageFile.size,
            created_by: user.id,
            metadata: {
                ...metadata,
                source: 'extension',
                fileName: imageFileName
            }
        };

        const { data: dbData, error: dbError } = await supabase
            .from('screenshots')
            .insert(screenshotRecord)
            .select()
            .single();

        if (dbError) {
            await supabase.storage.from('recordings').remove([imageFileName]);
            throw new Error(`Database insert failed: ${dbError.message}`);
        }

        await supabase.from('activity_logs').insert({
            user_id: user.id,
            action: 'screenshot_created',
            resource_type: 'screenshot',
            resource_id: dbData.id,
            metadata: {
                title: dbData.title,
                source: 'extension',
                suite_id: suiteId
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                id: dbData.id,
                title: dbData.title,
                file_url: dbData.file_url,
                created_at: dbData.created_at
            },
            message: 'Screenshot saved successfully'
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('[API] Error saving screenshot:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to save screenshot' },
            { status: 500, headers: corsHeaders }
        );
    }
}