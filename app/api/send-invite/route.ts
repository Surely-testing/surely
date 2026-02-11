// ============================================
// app/api/send-invite/route.ts - COMPLETE & CORRECT
// Blocks all existing users to prevent login conflicts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { LOGO_URL, APP_NAME, SUPPORT_EMAIL } from '@/config/logo'
import { extractDomain, isCommonEmailProvider } from '@/utils/domainValidator'

const EMAIL_FROM = 'Surely <noreply@testsurely.com>'

interface OrgInviteBody {
  type: 'organization'
  email: string
  organizationId: string
  role: 'admin' | 'manager' | 'member' | 'viewer'
}

interface SuiteInviteBody {
  type: 'testSuite'
  email: string
  suiteId: string
  role: 'admin' | 'member' | 'viewer'
  organizationId?: string
}

type InviteBody = OrgInviteBody | SuiteInviteBody

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

    const { data: inviter } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const inviterName = inviter?.name || inviter?.email || 'Someone'

    if (body.type === 'organization') {
      return handleOrgInvite({ supabase, user, body, inviterName })
    } else {
      return handleSuiteInvite({ supabase, user, body, inviterName })
    }
  } catch (error: any) {
    console.error('=== FULL ERROR IN SEND-INVITE ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    logger.log('Unhandled error in send-invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

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

  // Check permissions
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'You do not have permission to invite members to this organization' },
      { status: 403 }
    )
  }

  // Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('name, owner_id, domain')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Get organization domain (from org table or owner email)
  let orgDomain = org.domain

  if (!orgDomain) {
    const { data: orgOwner } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', org.owner_id)
      .single()

    if (!orgOwner?.email) {
      return NextResponse.json(
        { error: 'Organization domain not found' },
        { status: 500 }
      )
    }

    orgDomain = extractDomain(orgOwner.email)
  }

  if (!orgDomain) {
    return NextResponse.json(
      { error: 'Could not determine organization domain' },
      { status: 500 }
    )
  }

  const inviteeDomain = extractDomain(email)

  if (!inviteeDomain) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    )
  }

  // VALIDATION 1: Block common email providers
  if (isCommonEmailProvider(email)) {
    return NextResponse.json(
      {
        error: `Cannot invite ${email}. Organization members must use the company email domain (@${orgDomain}). Personal email providers are not allowed.`
      },
      { status: 400 }
    )
  }

  // VALIDATION 2: Check domain matching based on role
  const domainMatches = inviteeDomain === orgDomain.toLowerCase()

  if (!domainMatches && role !== 'viewer') {
    // Admin/Manager/Member roles MUST match domain
    return NextResponse.json(
      {
        error: `${role === 'admin' ? 'Admins' : role === 'manager' ? 'Managers' : 'Members'} must use the organization's email domain (@${orgDomain}). To invite external users, assign them the "Viewer" role.`
      },
      { status: 400 }
    )
  }

  // VALIDATION 3: Block ALL existing users (prevents login conflicts)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, account_type, organization_id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    // User already exists - ALWAYS BLOCK
    if (existingProfile.account_type === 'individual') {
      return NextResponse.json(
        {
          error: `${email} already has an individual account. They need to use a different email address to join your organization.`
        },
        { status: 409 }
      )
    } else if (existingProfile.organization_id === organizationId) {
      return NextResponse.json(
        {
          error: `${email} is already a member of this organization.`
        },
        { status: 409 }
      )
    } else if (existingProfile.organization_id) {
      return NextResponse.json(
        {
          error: `${email} is already a member of another organization. They need to use a different email address to join your organization.`
        },
        { status: 409 }
      )
    } else {
      // Has an org account but no org_id set (edge case)
      return NextResponse.json(
        {
          error: `${email} already has an account. They need to use a different email address.`
        },
        { status: 409 }
      )
    }
  }

  // Check for existing pending invitation
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('type', 'organization')
    .eq('organization_id', organizationId)
    .eq('invitee_email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInvite) {
    return NextResponse.json(
      { error: 'A pending invitation has already been sent to this email' },
      { status: 409 }
    )
  }

  // Create invitation
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
    html: buildOrgInviteEmail({
      orgName: org.name,
      inviterName,
      role,
      inviteUrl,
      isExternalViewer: !domainMatches && role === 'viewer'
    }),
    invitationId: invitation.id,
    supabase,
  })
}

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

  // Get suite details
  const { data: suite, error: suiteError } = await supabase
    .from('test_suites')
    .select('name, description, owner_type, owner_id, admins, members, viewers')
    .eq('id', suiteId)
    .single()

  if (suiteError || !suite) {
    return NextResponse.json({ error: 'Suite not found' }, { status: 404 })
  }

  // Individual accounts can't invite
  if (suite.owner_type === 'individual') {
    return NextResponse.json(
      { error: 'Individual accounts cannot invite team members. Upgrade to an organization account to enable team collaboration.' },
      { status: 403 }
    )
  }

  // ============ FIXED: Get organization ID - check owned orgs FIRST ============
  let resolvedOrgId: string | null = null

  console.log('🔍 Starting organization resolution for user:', user.id)

  // 1. FIRST: Check if user owns an organization (most direct)
  const { data: userOwnedOrg, error: userOwnedOrgError } = await supabase
    .from('organizations')
    .select('id, name, owner_id, status')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  console.log('1️⃣ User-owned org query:', { 
    userOwnedOrg, 
    userOwnedOrgError,
    userId: user.id 
  })

  if (userOwnedOrg?.id) {
    resolvedOrgId = userOwnedOrg.id
    console.log('✅ Found org via user ownership:', resolvedOrgId)
  }

  // 2. FALLBACK: Check if suite owner owns an organization (if different user)
  if (!resolvedOrgId && suite.owner_id && suite.owner_id !== user.id) {
    const { data: ownerOwnedOrg, error: ownerOwnedOrgError } = await supabase
      .from('organizations')
      .select('id, name, owner_id, status')
      .eq('owner_id', suite.owner_id)
      .eq('status', 'active')
      .maybeSingle()

    console.log('2️⃣ Suite owner org query:', { 
      ownerOwnedOrg, 
      ownerOwnedOrgError,
      suiteOwnerId: suite.owner_id 
    })

    if (ownerOwnedOrg?.id) {
      resolvedOrgId = ownerOwnedOrg.id
      console.log('✅ Found org via suite owner:', resolvedOrgId)
    }
  }

  // 3. FALLBACK: Check inviter's organization membership
  if (!resolvedOrgId) {
    const { data: inviterMembership, error: inviterMembershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    console.log('3️⃣ Inviter membership query:', { 
      inviterMembership, 
      inviterMembershipError,
      userId: user.id 
    })

    if (inviterMembership?.organization_id) {
      resolvedOrgId = inviterMembership.organization_id
      console.log('✅ Found org via inviter membership:', resolvedOrgId)
    }
  }

  // 4. FALLBACK: Check suite owner's organization membership
  if (!resolvedOrgId && suite.owner_id && suite.owner_id !== user.id) {
    const { data: ownerMembership, error: ownerMembershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', suite.owner_id)
      .eq('status', 'active')
      .maybeSingle()

    console.log('4️⃣ Suite owner membership query:', { 
      ownerMembership, 
      ownerMembershipError,
      suiteOwnerId: suite.owner_id 
    })

    if (ownerMembership?.organization_id) {
      resolvedOrgId = ownerMembership.organization_id
      console.log('✅ Found org via suite owner membership:', resolvedOrgId)
    }
  }

  // 5. FALLBACK: Try profiles table
  if (!resolvedOrgId) {
    const { data: inviterProfile, error: inviterProfileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    console.log('5️⃣ Inviter profile query:', { 
      inviterProfile, 
      inviterProfileError,
      userId: user.id 
    })

    if (inviterProfile?.organization_id) {
      resolvedOrgId = inviterProfile.organization_id
      console.log('✅ Found org via inviter profile:', resolvedOrgId)
    }
  }

  // 6. FALLBACK: Try suite owner's profile
  if (!resolvedOrgId && suite.owner_id && suite.owner_id !== user.id) {
    const { data: ownerProfile, error: ownerProfileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', suite.owner_id)
      .maybeSingle()

    console.log('6️⃣ Suite owner profile query:', { 
      ownerProfile, 
      ownerProfileError,
      suiteOwnerId: suite.owner_id 
    })

    if (ownerProfile?.organization_id) {
      resolvedOrgId = ownerProfile.organization_id
      console.log('✅ Found org via suite owner profile:', resolvedOrgId)
    }
  }

  // 7. LAST RESORT: Use from body if provided
  if (!resolvedOrgId && body.organizationId) {
    resolvedOrgId = body.organizationId
    console.log('✅ Using org from request body:', resolvedOrgId)
  }

  // DATA INTEGRITY CHECK
  if (!resolvedOrgId) {
    console.error('❌ DATA INTEGRITY ERROR - Suite marked as organization-owned but no organization found:', {
      suiteId,
      suiteName: suite.name,
      ownerType: suite.owner_type,
      ownerId: suite.owner_id,
      inviterId: user.id,
      hint: 'User owns no organization and is not in organization_members table'
    })
    
    return NextResponse.json(
      { 
        error: 'This test suite is marked as organization-owned, but no organization could be found. Please ensure you have created an organization first.',
        technicalDetails: 'No organization found for user'
      },
      { status: 500 }
    )
  }

  console.log('✅ RESOLVED ORGANIZATION ID:', resolvedOrgId)
  // ============ END FIX ============

  // Get organization domain
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id, domain')
    .eq('id', resolvedOrgId)
    .single()

  if (!org) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    )
  }

  let orgDomain = org.domain

  if (!orgDomain) {
    const { data: orgOwner } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', org.owner_id)
      .single()

    if (!orgOwner?.email) {
      return NextResponse.json(
        { error: 'Organization domain not found' },
        { status: 500 }
      )
    }

    orgDomain = extractDomain(orgOwner.email)
  }

  if (!orgDomain) {
    return NextResponse.json(
      { error: 'Could not determine organization domain' },
      { status: 500 }
    )
  }

  const inviteeDomain = extractDomain(email)

  if (!inviteeDomain) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    )
  }

  // VALIDATION 1: Block common email providers
  if (isCommonEmailProvider(email)) {
    return NextResponse.json(
      {
        error: `Cannot invite ${email}. Team members must use the company email domain (@${orgDomain}). Personal email providers are not allowed.`
      },
      { status: 400 }
    )
  }

  // VALIDATION 2: Check domain matching based on role
  const domainMatches = inviteeDomain === orgDomain.toLowerCase()

  if (!domainMatches && role !== 'viewer') {
    // Admin/Member roles MUST match domain
    return NextResponse.json(
      {
        error: `${role === 'admin' ? 'Admins' : 'Members'} must use the organization's email domain (@${orgDomain}). To invite external users, assign them the "Viewer" role.`
      },
      { status: 400 }
    )
  }

  // VALIDATION 3: Block ALL existing users
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, account_type, organization_id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    // User already exists - ALWAYS BLOCK
    if (existingProfile.account_type === 'individual') {
      return NextResponse.json(
        {
          error: `${email} already has an individual account. They need to use a different email address to join your team.`
        },
        { status: 409 }
      )
    } else if (existingProfile.organization_id === resolvedOrgId) {
      // Check if already has suite access
      const allMembers = [
        ...(suite.admins || []),
        ...(suite.members || []),
        ...(suite.viewers || [])
      ]

      if (allMembers.includes(existingProfile.id)) {
        return NextResponse.json(
          { error: `${email} already has access to this test suite` },
          { status: 409 }
        )
      } else {
        return NextResponse.json(
          { error: `${email} is already a member of this organization` },
          { status: 409 }
        )
      }
    } else if (existingProfile.organization_id) {
      return NextResponse.json(
        {
          error: `${email} is already a member of another organization. They need to use a different email address.`
        },
        { status: 409 }
      )
    } else {
      return NextResponse.json(
        {
          error: `${email} already has an account. They need to use a different email address.`
        },
        { status: 409 }
      )
    }
  }

  // Check for existing pending invitation
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('type', 'testSuite')
    .eq('suite_id', suiteId)
    .eq('invitee_email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInvite) {
    return NextResponse.json(
      { error: 'A pending invitation has already been sent to this email' },
      { status: 409 }
    )
  }

  // Create invitation
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
      isExternalViewer: !domainMatches && role === 'viewer'
    }),
    invitationId: invitation.id,
    supabase,
  })
}

async function sendEmail({
  to,
  subject,
  html,
  invitationId,
  supabase,
}: {
  to: string
  subject: string
  html: string
  invitationId: string
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>
}): Promise<NextResponse> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    await supabase.from('invitations').delete().eq('id', invitationId)
    logger.log('RESEND_API_KEY is not set — invitation deleted')
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
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text()
      logger.log('Resend API error:', errorBody)

      await supabase.from('invitations').delete().eq('id', invitationId)

      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitationId,
    })
  } catch (error: any) {
    logger.log('Email send error:', error.message)

    await supabase.from('invitations').delete().eq('id', invitationId)

    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 502 }
    )
  }
}

// Email templates
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
  isExternalViewer: boolean
}

function buildOrgInviteEmail({ orgName, inviterName, role, inviteUrl, isExternalViewer }: OrgEmailOptions): string {
  const externalNotice = isExternalViewer ? `
    <div style="margin:20px 0;padding:12px 16px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>External Viewer:</strong> You're being added as an external viewer with limited access.
      </p>
    </div>
  ` : ''

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
    ${externalNotice}
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
  isExternalViewer: boolean
}

function buildSuiteInviteEmail({
  suiteName,
  suiteDescription,
  inviterName,
  role,
  inviteUrl,
  isExternalViewer
}: SuiteEmailOptions): string {
  const externalNotice = isExternalViewer ? `
    <div style="margin:20px 0;padding:12px 16px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>External Viewer:</strong> You're being added as an external viewer with limited access.
      </p>
    </div>
  ` : ''

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
    ${suiteDescription
      ? `<p style="margin:0 0 20px;padding:14px 16px;background:#f9fafb;border-left:3px solid #326FF7;border-radius:0 6px 6px 0;font-size:14px;color:#6b7280;line-height:1.6;font-style:italic;text-align:left;">${suiteDescription}</p>`
      : ''
    }
    ${externalNotice}
    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">You'll be joining as:</p>
    <div style="text-align:center;">${rolePill(role)}</div>
    ${acceptButton(inviteUrl)}
  `)
}