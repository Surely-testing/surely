// ==============================================
// File: app/api/webhooks/trial-expired/route.ts
// Webhook to send "trial expired" email after downgrade
// ==============================================

import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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
    
    const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: user_email,
      subject: 'Your trial has ended',
      html: getTrialExpiredEmail(user_name, previous_tier, upgradeUrl),
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

function getTrialExpiredEmail(name: string, previousTier: string, upgradeUrl: string): string {
  const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f6f6f6; margin: 0; padding: 40px 20px; }
    .container { background-color: #ffffff; border-radius: 8px; padding: 40px; max-width: 600px; margin: 0 auto; }
    h1 { color: #333; font-size: 24px; margin-top: 0; }
    p { color: #555; font-size: 16px; line-height: 24px; }
    .button { background-color: #0070f3; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <h1>Your trial has ended</h1>
          <p>Hi ${name},</p>
          <p>Your <strong>${previousTier}</strong> trial has ended and your account has been moved to our Free plan.</p>
          <p>You can still access basic features, but to unlock everything again, upgrade anytime!</p>
          <a href="${upgradeUrl}" class="button">Upgrade Now</a>
          <p style="color: #777; font-size: 14px; margin-top: 30px;">We're here whenever you're ready to upgrade!</p>
        </div>
        <div class="footer">Questions? Visit our Help Center</div>
      </body>
    </html>
  `;
}