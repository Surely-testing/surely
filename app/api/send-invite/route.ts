// ============================================
// app/api/send-invite/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { LOGO_URL, APP_NAME, SUPPORT_EMAIL } from '@/config/logo'

const EMAIL_FROM = 'Surely <noreply@testsurely.com>'

// ── Body shapes ───────────────────────────────────────────────────────────────

interface OrgInviteBody {
  type: 'organization'
  email: string
  organizationId: string
  role: 'admin' | 'manager' | 'member'
}

interface SuiteInviteBody {
  type: 'testSuite'
  email: string
  suiteId: string
  role: 'admin' | 'member' | 'viewer'
  /** Optional — if omitted the route resolves it from the suite row */
  organizationId?: string
}

type InviteBody = OrgInviteBody | SuiteInviteBody

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as InviteBody

    // ── Shared validation ──────────────────────────────────────────────────
    if (!body.type || !body.email || !body.role) {
      return NextResponse.json(
        { error: 'type, email, and role are required' },
        { status: 400 }
      )
    }

    if (body.type === 'organization' && !body.organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required for organization invitations' },
        { status: 400 }
      )
    }

    if (body.type === 'testSuite' && !body.suiteId) {
      return NextResponse.json(
        { error: 'suiteId is required for testSuite invitations' },
        { status: 400 }
      )
    }

    // ── Fetch inviter profile ──────────────────────────────────────────────
    const { data: inviter } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const inviterName = inviter?.name || inviter?.email || 'Someone'

    // ── Branch per invite type ─────────────────────────────────────────────
    if (body.type === 'organization') {
      return handleOrgInvite({ supabase, user, body, inviterName })
    } else {
      return handleSuiteInvite({ supabase, user, body, inviterName })
    }
  } catch (error: any) {
    console.error('=== FULL ERROR IN SEND-INVITE ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Error object:', error)
    
    logger.log('Unhandled error in send-invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

// ── Organization invite ───────────────────────────────────────────────────────

async function handleOrgInvite({
  supabase,
  user,
  body,
  inviterName,
}: {
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>
  user: { id: string }
  body: OrgInviteBody
  inviterName: string
}) {
  const { email, organizationId, role } = body

  // Permission check — only owners/admins can invite
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'You do not have permission to invite members to this organization' },
      { status: 403 }
    )
  }

  // Fetch org name for email copy
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Duplicate-invite guard
  const { data: existingInvite, error: checkError } = await supabase
    .from('invitations')
    .select('id')
    .eq('type', 'organization')
    .eq('organization_id', organizationId)
    .eq('invitee_email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (checkError) {
    logger.log('Error checking existing invite:', checkError)
    return NextResponse.json(
      { error: 'Failed to check existing invitations', detail: checkError.message },
      { status: 500 }
    )
  }

  if (existingInvite) {
    return NextResponse.json(
      { error: 'A pending invitation has already been sent to this email' },
      { status: 409 }
    )
  }

  // Check if already a member
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', existingProfile.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member of the organization' },
        { status: 409 }
      )
    }
  }

  // Insert
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .insert({
      type: 'organization',
      organization_id: organizationId,
      suite_id: null,
      invitee_email: email,
      invited_by: user.id,
      role,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (inviteError) {
    logger.log('Org invitation insert error:', inviteError)
    throw inviteError
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const inviteUrl = `${appUrl}/invite/accept?token=${invitation.id}`

  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${org.name} on ${APP_NAME}`,
    html: buildOrgInviteEmail({ orgName: org.name, inviterName, role, inviteUrl }),
    invitationId: invitation.id,
  })
}

// ── Suite invite ──────────────────────────────────────────────────────────────

async function handleSuiteInvite({
  supabase,
  user,
  body,
  inviterName,
}: {
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>
  user: { id: string }
  body: SuiteInviteBody
  inviterName: string
}) {
  const { email, suiteId, role } = body

  // Fetch suite
  const { data: suite, error: suiteError } = await supabase
    .from('test_suites')
    .select('name, description, owner_type, owner_id')
    .eq('id', suiteId)
    .single()

  if (suiteError || !suite) {
    return NextResponse.json({ error: 'Suite not found' }, { status: 404 })
  }

  // Resolve org id properly: get from suite owner's profile if org account
  let resolvedOrgId: string | null = body.organizationId ?? null

  if (!resolvedOrgId && suite.owner_type === 'organization') {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', suite.owner_id)
      .single()
    
    resolvedOrgId = ownerProfile?.organization_id ?? null
  }

  // Duplicate-invite guard
  const { data: existingInvite, error: checkError } = await supabase
    .from('invitations')
    .select('id')
    .eq('type', 'testSuite')
    .eq('suite_id', suiteId)
    .eq('invitee_email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (checkError) {
    logger.log('Error checking existing invite:', checkError)
    return NextResponse.json(
      { error: 'Failed to check existing invitations', detail: checkError.message },
      { status: 500 }
    )
  }

  if (existingInvite) {
    return NextResponse.json(
      { error: 'A pending invitation has already been sent to this email' },
      { status: 409 }
    )
  }

  // Insert
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .insert({
      type: 'testSuite',
      suite_id: suiteId,
      organization_id: resolvedOrgId,
      invitee_email: email,
      invited_by: user.id,
      role,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (inviteError) {
    logger.log('Suite invitation insert error:', inviteError)
    throw inviteError
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const inviteUrl = `${appUrl}/invite/accept?token=${invitation.id}`

  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${suite.name} on ${APP_NAME}`,
    html: buildSuiteInviteEmail({
      suiteName: suite.name,
      suiteDescription: suite.description,
      inviterName,
      role,
      inviteUrl,
    }),
    invitationId: invitation.id,
  })
}

// ── Shared email sender ───────────────────────────────────────────────────────

async function sendEmail({
  to,
  subject,
  html,
  invitationId,
}: {
  to: string
  subject: string
  html: string
  invitationId: string
}): Promise<NextResponse> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    logger.log('RESEND_API_KEY is not set — invitation saved but email not sent')
    return NextResponse.json({
      success: true,
      warning: 'Invitation created but email not sent: RESEND_API_KEY missing',
      invitationId,
    })
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  })

  if (!emailResponse.ok) {
    const errorBody = await emailResponse.text()
    logger.log('Resend API error:', errorBody)
    return NextResponse.json(
      {
        error: 'Invitation saved but email delivery failed',
        detail: errorBody,
        invitationId,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Invitation sent successfully',
    invitationId,
  })
}

// ── Email templates ───────────────────────────────────────────────────────────

function emailShell(bodyContent: string): string {
  // Logo configuration
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

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              ${logoUrl ? `
              <img src="${logoUrl}" alt="${appName}" width="120" style="height:auto;display:block;border:0;max-width:120px;" />
              ` : `
              <span style="font-size:20px;font-weight:800;color:#0d9488;letter-spacing:-0.5px;">${appName}</span>
              `}
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              ${bodyContent}

              <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 24px;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${appName} &nbsp;·&nbsp;
                <a href="https://testsurely.com" style="color:#9ca3af;text-decoration:none;">testsurely.com</a>
              </p>
              <p style="margin:8px 0 0 0;font-size:12px;color:#9ca3af;">
                Questions? <a href="mailto:${supportEmail}" style="color:#0d9488;text-decoration:none;">Contact Support</a>
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
             style="display:inline-block;padding:13px 30px;background:#0d9488;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Or paste this link into your browser:<br/>
      <span style="color:#0d9488;word-break:break-all;">${inviteUrl}</span>
    </p>
  </div>`
}

function rolePill(role: string): string {
  return `<span style="display:inline-block;padding:3px 10px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:999px;font-size:12px;font-weight:600;color:#0d9488;text-transform:capitalize;">${role}</span>`
}

// Organization invite email
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

// Suite invite email
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
      You've been invited to a test suite 🧪
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
        ? `<p style="margin:0 0 20px;padding:14px 16px;background:#f9fafb;border-left:3px solid #0d9488;border-radius:0 6px 6px 0;font-size:14px;color:#6b7280;line-height:1.6;font-style:italic;text-align:left;">${suiteDescription}</p>`
        : ''
    }

    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">You'll be joining as:</p>
    <div style="text-align:center;">${rolePill(role)}</div>

    ${acceptButton(inviteUrl)}
  `)
}