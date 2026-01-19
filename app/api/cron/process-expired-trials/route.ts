// ============================================
// FILE: app/api/cron/process-expired-trials/route.ts
// Cron job to check for expired trials and send notifications
// Runs daily at midnight (0 0 * * *)
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { jsx } from 'react/jsx-runtime';
import { TrialExpiredEmail, getEmailSubject } from '@/lib/emails/trial-notifications';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();

    // Get all subscriptions where:
    // 1. Trial has ended (trial_end is in the past)
    // 2. Status is 'trialing' (hasn't been updated to expired yet)
    // 3. Had a paid tier before
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        trial_end,
        status,
        previous_tier_id,
        had_paid_plan,
        tier:subscription_tiers!subscriptions_previous_tier_id_fkey (
          name
        ),
        user:profiles!subscriptions_user_id_fkey (
          name,
          email
        )
      `)
      .eq('status', 'trialing')
      .not('trial_end', 'is', null)
      .lt('trial_end', now.toISOString())
      .eq('had_paid_plan', true);

    if (fetchError) {
      logger.error('Error fetching expired trials:', fetchError);
      throw fetchError;
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      logger.log('No expired trials to process');
      return NextResponse.json({
        success: true,
        message: 'No expired trials found',
        processed: 0,
      });
    }

    logger.log(`Found ${expiredTrials.length} expired trials to process`);

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Process each expired trial
    const results = await Promise.allSettled(
      expiredTrials.map(async (subscription) => {
        try {
          const user = subscription.user as any;
          const tier = subscription.tier as any;

          if (!user || !user.email) {
            throw new Error('User or email not found');
          }

          // Send trial expired email
          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
            to: user.email,
            subject: getEmailSubject('trial-expired'),
            react: jsx(TrialExpiredEmail, {
              name: user.name || 'there',
              previousTier: tier?.name || 'Pro',
              upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
            }),
          });

          if (error) {
            logger.error(`Failed to send email to ${user.email}:`, error);
            throw error;
          }

          // Update subscription status to 'expired'
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'expired',
              updated_at: now.toISOString()
            })
            .eq('id', subscription.id);

          logger.log(`✅ Trial expired email sent to ${user.email}`);

          return { 
            success: true, 
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            email: user.email,
            emailId: data?.id 
          };
        } catch (error: any) {
          logger.error(`Error processing subscription ${subscription.id}:`, error);
          return { 
            success: false, 
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            error: error.message 
          };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - successful;

    logger.log(`Processed ${results.length} expired trials: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} expired trials`,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false }),
    });

  } catch (error: any) {
    logger.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process expired trials' },
      { status: 500 }
    );
  }
}