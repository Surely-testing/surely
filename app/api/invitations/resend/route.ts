// ============================================
// app/api/invitations/resend/route.ts - FIXED
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { LOGO_URL, APP_NAME, SUPPORT_EMAIL } from '@/config/logo'

const EMAIL_FROM = 'Surely <noreply@testsurely.com>'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId is required' }, { status: 400 })
    }

    // Get invitation with inviter details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Get inviter profile separately
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', invitation.invited_by)
      .single()

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted or cancelled' },
        { status: 400 }
      )
    }

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Verify user has permission to resend
    let hasPermission = invitation.invited_by === user.id

    if (!hasPermission && invitation.organization_id) {
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', invitation.organization_id)
        .eq('user_id', user.id)
        .single()

      hasPermission = !!(orgMember && ['owner', 'admin'].includes(orgMember.role))
    }

    if (!hasPermission && invitation.suite_id) {
      const { data: suite } = await supabase
        .from('test_suites')
        .select('admins')
        .eq('id', invitation.suite_id)
        .single()

      hasPermission = !!(suite && suite.admins && suite.admins.includes(user.id))
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to resend this invitation' },
        { status: 403 }
      )
    }

    // Build email content
    const inviterName = inviterProfile?.name || inviterProfile?.email || 'Someone'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const inviteUrl = `${appUrl}/invite/accept?token=${invitation.id}`

    let subject = ''
    let html = ''

    if (invitation.type === 'organization' && invitation.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', invitation.organization_id)
        .single()

      subject = `${inviterName} invited you to join ${org?.name || 'an organization'} on ${APP_NAME}`
      html = buildOrgInviteEmail({
        orgName: org?.name || 'Organization',
        inviterName,
        role: invitation.role,
        inviteUrl,
      })
    } else if (invitation.type === 'testSuite' && invitation.suite_id) {
      const { data: suite } = await supabase
        .from('test_suites')
        .select('name, description')
        .eq('id', invitation.suite_id)
        .single()

      subject = `${inviterName} invited you to join ${suite?.name || 'a test suite'} on ${APP_NAME}`
      html = buildSuiteInviteEmail({
        suiteName: suite?.name || 'Test Suite',
        suiteDescription: suite?.description ?? null,
        inviterName,
        role: invitation.role,
        inviteUrl,
      })
    }

    // Send email
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 503 }
      )
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: invitation.invitee_email,
          subject,
          html,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text()
        logger.log('Resend API error:', errorBody)
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 502 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation resent successfully',
      })
    } catch (error: any) {
      logger.log('Email send error:', error.message)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 502 }
      )
    }
  } catch (error: any) {
    console.error('Error in resend invitation:', error)
    logger.log('Unhandled error in resend invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resend invitation' },
      { status: 500 }
    )
  }
}

// Email template functions
function emailShell(bodyContent: string): string {
  let logoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL
  if (!logoUrl) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    if (LOGO_URL.startsWith('/')) {
      logoUrl = `${baseUrl}${LOGO_URL}`
    } else {
      logoUrl = LOGO_URL
    }
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || APP_NAME
  const supportEmail = process.env.SUPPORT_EMAIL || SUPPORT_EMAIL

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You've been invited to ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              ${logoUrl ? `
              <img src="${logoUrl}" alt="${appName}" width="120" style="height:auto;display:block;border:0;max-width:120px;" />
              ` : `
              <span style="font-size:20px;font-weight:800;color:#326FF7;letter-spacing:-0.5px;">${appName}</span>
              `}
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              ${bodyContent}
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 24px;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${appName} &nbsp;·&nbsp;
                <a href="https://testsurely.com" style="color:#9ca3af;text-decoration:none;">testsurely.com</a>
              </p>
              <p style="margin:8px 0 0 0;font-size:12px;color:#9ca3af;">
                Questions? <a href="mailto:${supportEmail}" style="color:#326FF7;text-decoration:none;">Contact Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function acceptButton(inviteUrl: string): string {
  return `<div style="text-align:center;">
    <table cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td>
          <a href="${inviteUrl}"
             style="display:inline-block;padding:13px 30px;background:#326FF7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Or paste this link into your browser:<br/>
      <span style="color:#326FF7;word-break:break-all;">${inviteUrl}</span>
    </p>
  </div>`
}

function rolePill(role: string): string {
  return `<span style="display:inline-block;padding:3px 10px;background:#EFF5FF;border:1px solid #93C5FD;border-radius:999px;font-size:12px;font-weight:600;color:#326FF7;text-transform:capitalize;">${role}</span>`
}

interface OrgEmailOptions {
  orgName: string
  inviterName: string
  role: string
  inviteUrl: string
}

function buildOrgInviteEmail({ orgName, inviterName, role, inviteUrl }: OrgEmailOptions): string {
  return emailShell(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;text-align:center;">
      You've been invited to an organization 🎉
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;text-align:center;">
      Join <strong style="color:#111827;">${orgName}</strong> on ${APP_NAME}
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;text-align:center;">
      <strong>${inviterName}</strong> has invited you to join
      <strong>${orgName}</strong> as a team member.
    </p>
    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">You'll be joining as:</p>
    <div style="text-align:center;">${rolePill(role)}</div>
    <p style="margin:16px 0 0;font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
      As a member of <strong>${orgName}</strong>, you'll gain access to the organization's
      test suites, shared resources, and team collaboration tools.
    </p>
    ${acceptButton(inviteUrl)}
  `)
}

interface SuiteEmailOptions {
  suiteName: string
  suiteDescription: string | null
  inviterName: string
  role: string
  inviteUrl: string
}

function buildSuiteInviteEmail({
  suiteName,
  suiteDescription,
  inviterName,
  role,
  inviteUrl,
}: SuiteEmailOptions): string {
  return emailShell(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;text-align:center;">
      You've been invited to a test suite
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;text-align:center;">
      Join <strong style="color:#111827;">${suiteName}</strong> on ${APP_NAME}
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;text-align:center;">
      <strong>${inviterName}</strong> has invited you to collaborate on the
      <strong>${suiteName}</strong> test suite.
    </p>
    ${
      suiteDescription
        ? `<p style="margin:0 0 20px;padding:14px 16px;background:#f9fafb;border-left:3px solid #326FF7;border-radius:0 6px 6px 0;font-size:14px;color:#6b7280;line-height:1.6;font-style:italic;text-align:left;">${suiteDescription}</p>`
        : ''
    }
    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">You'll be joining as:</p>
    <div style="text-align:center;">${rolePill(role)}</div>
    ${acceptButton(inviteUrl)}
  `)
}