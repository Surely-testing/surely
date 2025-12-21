// ============================================
// 1. API Route: app/api/send-invite/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, suiteId, role, organizationId, organizationDomain } = body

    // Get suite details
    const { data: suite } = await supabase
      .from('test_suites')
      .select('name, description')
      .eq('id', suiteId)
      .single()

    if (!suite) {
      return NextResponse.json({ error: 'Suite not found' }, { status: 404 })
    }

    // Get inviter details
    const { data: inviter } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('suite_id', suiteId)
      .eq('invitee_email', email)
      .eq('type', 'testSuite')
      .maybeSingle()

    if (existingInvite?.status === 'pending') {
      return NextResponse.json(
        { error: 'Invitation already sent' },
        { status: 409 }
      )
    }

    // Create invitation token
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        type: 'testSuite',
        suite_id: suiteId,
        organization_id: organizationId || null,
        invitee_email: email,
        invited_by: user.id,
        role: role,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // Send email using your email service (Resend, SendGrid, etc.)
    // Example with Resend:
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitation.id}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0d9488; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>You've been invited to join ${suite.name}!</h2>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${inviter?.name || inviter?.email}</strong> has invited you to join the test suite <strong>${suite.name}</strong>.</p>
              ${suite.description ? `<p><em>${suite.description}</em></p>` : ''}
              <p>Click the button below to accept the invitation:</p>
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
              <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${inviteUrl}</p>
              <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email (replace with your email service)
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
          to: email,
          subject: `You've been invited to join ${suite.name}`,
          html: emailHtml,
        }),
      })

      if (!emailResponse.ok) {
        logger.log('Failed to send email:', await emailResponse.text())
      }
    } catch (emailError) {
      logger.log('Email sending error:', emailError)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitationId: invitation.id,
    })

  } catch (error: any) {
    logger.log('Error sending invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}