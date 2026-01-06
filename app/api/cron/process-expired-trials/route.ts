// ==============================================
// File: app/api/webhooks/trial-expired/route.ts
// Webhook to send "trial expired" email after downgrade
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { jsx } from 'react/jsx-runtime';
import { TrialExpiredEmail, getEmailSubject } from '@/lib/emails/trial-notifications';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

interface TrialExpiredPayload {
  user_id: string;
  user_email: string;
  user_name: string;
  previous_tier: string;
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      logger.warn('Unauthorized webhook attempt');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: TrialExpiredPayload = await request.json();
    const { user_email, user_name, previous_tier } = payload;

    if (!user_email || !user_name || !previous_tier) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: user_email,
      subject: getEmailSubject('trial-expired'),
      react: jsx(TrialExpiredEmail, {
        name: user_name,
        previousTier: previous_tier,
        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
      }),
    });

    if (error) {
      logger.error('Failed to send trial expired email:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    logger.log(`✅ Trial expired email sent to ${user_email}`);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      email_id: data?.id,
    });

  } catch (error: any) {
    logger.error('Error in trial expired webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}