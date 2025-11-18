#!/bin/bash

# Surely App - Directory and File Structure Generator
# Run this script from your project root: bash create-structure.sh

echo "Ì∫Ä Creating Surely app structure..."

# Create root directories
mkdir -p app
mkdir -p components
mkdir -p lib
mkdir -p providers
mkdir -p types
mkdir -p config
mkdir -p public

# ============================================
# APP DIRECTORY
# ============================================
echo "Ì≥Å Creating app directory structure..."

# Root app files
touch app/layout.tsx
touch app/globals.css
touch app/page.tsx
touch app/error.tsx
touch app/loading.tsx
touch app/not-found.tsx

# (auth) route group
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/register
mkdir -p app/\(auth\)/forgot-password
mkdir -p app/\(auth\)/verify-email

touch app/\(auth\)/layout.tsx
touch app/\(auth\)/login/page.tsx
touch app/\(auth\)/register/page.tsx
touch app/\(auth\)/forgot-password/page.tsx
touch app/\(auth\)/verify-email/page.tsx

# (dashboard) route group
mkdir -p app/\(dashboard\)/dashboard
mkdir -p app/\(dashboard\)/test-suites/new
mkdir -p app/\(dashboard\)/test-suites/\[suiteId\]/test-cases/\[caseId\]
mkdir -p app/\(dashboard\)/test-suites/\[suiteId\]/bugs/\[bugId\]
mkdir -p app/\(dashboard\)/test-suites/\[suiteId\]/sprints/\[sprintId\]
mkdir -p app/\(dashboard\)/test-suites/\[suiteId\]/reports
mkdir -p app/\(dashboard\)/test-suites/\[suiteId\]/settings
mkdir -p app/\(dashboard\)/test-suites/\[suiteId\]/members
mkdir -p app/\(dashboard\)/organizations/new
mkdir -p app/\(dashboard\)/organizations/\[orgId\]/members
mkdir -p app/\(dashboard\)/organizations/\[orgId\]/settings
mkdir -p app/\(dashboard\)/organizations/\[orgId\]/billing
mkdir -p app/\(dashboard\)/settings/profile
mkdir -p app/\(dashboard\)/settings/account
mkdir -p app/\(dashboard\)/settings/subscription
mkdir -p app/\(dashboard\)/settings/notifications
mkdir -p app/\(dashboard\)/settings/security

touch app/\(dashboard\)/layout.tsx
touch app/\(dashboard\)/dashboard/page.tsx
touch app/\(dashboard\)/dashboard/loading.tsx
touch app/\(dashboard\)/dashboard/error.tsx

touch app/\(dashboard\)/test-suites/page.tsx
touch app/\(dashboard\)/test-suites/new/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/layout.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/test-cases/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/test-cases/\[caseId\]/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/bugs/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/bugs/\[bugId\]/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/sprints/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/sprints/\[sprintId\]/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/reports/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/settings/page.tsx
touch app/\(dashboard\)/test-suites/\[suiteId\]/members/page.tsx

touch app/\(dashboard\)/organizations/page.tsx
touch app/\(dashboard\)/organizations/new/page.tsx
touch app/\(dashboard\)/organizations/\[orgId\]/page.tsx
touch app/\(dashboard\)/organizations/\[orgId\]/members/page.tsx
touch app/\(dashboard\)/organizations/\[orgId\]/settings/page.tsx
touch app/\(dashboard\)/organizations/\[orgId\]/billing/page.tsx

touch app/\(dashboard\)/settings/page.tsx
touch app/\(dashboard\)/settings/layout.tsx
touch app/\(dashboard\)/settings/profile/page.tsx
touch app/\(dashboard\)/settings/account/page.tsx
touch app/\(dashboard\)/settings/subscription/page.tsx
touch app/\(dashboard\)/settings/notifications/page.tsx
touch app/\(dashboard\)/settings/security/page.tsx

# (marketing) route group
mkdir -p app/\(marketing\)/pricing
mkdir -p app/\(marketing\)/features
mkdir -p app/\(marketing\)/about
mkdir -p app/\(marketing\)/contact
mkdir -p app/\(marketing\)/blog/\[slug\]

touch app/\(marketing\)/layout.tsx
touch app/\(marketing\)/pricing/page.tsx
touch app/\(marketing\)/features/page.tsx
touch app/\(marketing\)/about/page.tsx
touch app/\(marketing\)/contact/page.tsx
touch app/\(marketing\)/blog/page.tsx
touch app/\(marketing\)/blog/\[slug\]/page.tsx

# API routes
mkdir -p app/api/auth/callback
mkdir -p app/api/webhooks/stripe
mkdir -p app/api/webhooks/supabase
mkdir -p app/api/test-suites/\[id\]
mkdir -p app/api/organizations/\[id\]

touch app/api/auth/callback/route.ts
touch app/api/webhooks/stripe/route.ts
touch app/api/webhooks/supabase/route.ts
touch app/api/test-suites/route.ts
touch app/api/test-suites/\[id\]/route.ts
touch app/api/organizations/route.ts
touch app/api/organizations/\[id\]/route.ts

# ============================================
# COMPONENTS DIRECTORY
# ============================================
echo "Ì≥Å Creating components directory structure..."

# Auth components
mkdir -p components/auth
touch components/auth/LoginForm.tsx
touch components/auth/RegisterForm.tsx
touch components/auth/ForgotPasswordForm.tsx
touch components/auth/SocialAuthButtons.tsx

# Dashboard components
mkdir -p components/dashboard
touch components/dashboard/DashboardLayout.tsx
touch components/dashboard/Sidebar.tsx
touch components/dashboard/Header.tsx
touch components/dashboard/StatsCard.tsx
touch components/dashboard/RecentActivity.tsx
touch components/dashboard/QuickActions.tsx

# Test suites components
mkdir -p components/test-suites
touch components/test-suites/TestSuiteCard.tsx
touch components/test-suites/TestSuiteList.tsx
touch components/test-suites/CreateSuiteForm.tsx
touch components/test-suites/TestCaseTable.tsx
touch components/test-suites/TestCaseForm.tsx
touch components/test-suites/BugList.tsx
touch components/test-suites/BugForm.tsx
touch components/test-suites/SprintBoard.tsx
touch components/test-suites/SprintForm.tsx

# Organizations components
mkdir -p components/organizations
touch components/organizations/OrgCard.tsx
touch components/organizations/OrgList.tsx
touch components/organizations/CreateOrgForm.tsx
touch components/organizations/MembersList.tsx
touch components/organizations/InviteMemberForm.tsx
touch components/organizations/RoleSelector.tsx

# Settings components
mkdir -p components/settings
touch components/settings/SettingsSidebar.tsx
touch components/settings/ProfileForm.tsx
touch components/settings/PasswordForm.tsx
touch components/settings/SubscriptionCard.tsx
touch components/settings/DangerZone.tsx

# Marketing components
mkdir -p components/marketing
touch components/marketing/Navbar.tsx
touch components/marketing/Footer.tsx
touch components/marketing/Hero.tsx
touch components/marketing/Features.tsx
touch components/marketing/Pricing.tsx
touch components/marketing/Testimonials.tsx
touch components/marketing/CTA.tsx

# UI components
mkdir -p components/ui
touch components/ui/Button.tsx
touch components/ui/Input.tsx
touch components/ui/Select.tsx
touch components/ui/Textarea.tsx
touch components/ui/Modal.tsx
touch components/ui/Card.tsx
touch components/ui/Badge.tsx
touch components/ui/Tabs.tsx
touch components/ui/Table.tsx
touch components/ui/Dropdown.tsx
touch components/ui/Toast.tsx
touch components/ui/Skeleton.tsx
touch components/ui/EmptyState.tsx
touch components/ui/ThemeToggle.tsx

# Shared components
mkdir -p components/shared
touch components/shared/LoadingSpinner.tsx
touch components/shared/ErrorBoundary.tsx
touch components/shared/Pagination.tsx
touch components/shared/SearchBar.tsx

# ============================================
# LIB DIRECTORY
# ============================================
echo "Ì≥Å Creating lib directory structure..."

# Supabase
mkdir -p lib/supabase
touch lib/supabase/client.ts
touch lib/supabase/server.ts
touch lib/supabase/middleware.ts
touch lib/supabase/queries.ts

# Stripe
mkdir -p lib/stripe
touch lib/stripe/client.ts
touch lib/stripe/server.ts
touch lib/stripe/webhooks.ts

# Utils
mkdir -p lib/utils
touch lib/utils/cn.ts
touch lib/utils/formatters.ts
touch lib/utils/validators.ts
touch lib/utils/constants.ts

# Hooks
mkdir -p lib/hooks
touch lib/hooks/useUser.ts
touch lib/hooks/useSubscription.ts
touch lib/hooks/useTestSuites.ts
touch lib/hooks/useOrganization.ts
touch lib/hooks/useDebounce.ts

# Actions (Server Actions)
mkdir -p lib/actions
touch lib/actions/auth.ts
touch lib/actions/test-suites.ts
touch lib/actions/organizations.ts
touch lib/actions/subscriptions.ts

# ============================================
# PROVIDERS DIRECTORY
# ============================================
echo "Ì≥Å Creating providers directory structure..."

touch providers/GlobalThemeProvider.tsx
touch providers/SupabaseProvider.tsx
touch providers/QueryProvider.tsx

# ============================================
# TYPES DIRECTORY
# ============================================
echo "Ì≥Å Creating types directory structure..."

touch types/database.types.ts
touch types/auth.types.ts
touch types/suite.types.ts
touch types/organization.types.ts
touch types/api.types.ts

# ============================================
# CONFIG DIRECTORY
# ============================================
echo "Ì≥Å Creating config directory structure..."

touch config/site.ts
touch config/navigation.ts
touch config/features.ts

# ============================================
# ROOT FILES
# ============================================
echo "Ì≥Å Creating root configuration files..."

touch middleware.ts
touch .env.local
touch .env.example
touch .gitignore
touch README.md

# ============================================
# PUBLIC DIRECTORY
# ============================================
echo "Ì≥Å Creating public directory structure..."

touch public/logo.svg
touch public/icon-192.png
touch public/icon-512.png
touch public/manifest.json
touch public/robots.txt

# ============================================
# GITIGNORE
# ============================================
echo "Ì≥ù Creating .gitignore..."

cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# Supabase
supabase/.branches
supabase/.temp
EOF

# ============================================
# ENV EXAMPLE
# ============================================
echo "Ì≥ù Creating .env.example..."

cat > .env.example << 'EOF'
# App Configuration
NEXT_PUBLIC_APP_URL=https://surely.app
NEXT_PUBLIC_APP_NAME=Surely

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_LOGO_URL=https://res.cloudinary.com/your-cloud-name/image/upload/surely-logo.png
NEXT_PUBLIC_CLOUDINARY_OG_IMAGE=https://res.cloudinary.com/your-cloud-name/image/upload/surely-og-banner.png

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...

# SEO & Verification
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code

# External URLs
NEXT_PUBLIC_LEARN_URL=https://learn.surely.app
EOF

# ============================================
# README
# ============================================
echo "Ì≥ù Creating README.md..."

cat > README.md << 'EOF'
# Surely - AI-Powered Quality Assurance Platform

## Ì∫Ä Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd surely
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. Run database migrations
```bash
# Run the SQL files in Supabase dashboard
# 1. supabase_schema.sql
# 2. supabase_rls_policies.sql
```

5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Ì≥Å Project Structure

See full structure documentation in `/docs/structure.md`

## Ì¥ß Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **State:** React Query
- **UI:** Custom components

## Ì≥ñ Documentation

- [Architecture Overview](./docs/architecture.md)
- [Database Schema](./docs/schema.md)
- [API Documentation](./docs/api.md)

## Ì¥ù Contributing

Contributions welcome! Please read our contributing guidelines.

## Ì≥Ñ License

MIT License - see LICENSE file for details
EOF

# ============================================
# COMPLETION MESSAGE
# ============================================
echo ""
echo "‚úÖ Structure created successfully!"
echo ""
echo "Ì≥ä Summary:"
echo "   - $(find app -type f | wc -l) files in app/"
echo "   - $(find components -type f | wc -l) files in components/"
echo "   - $(find lib -type f | wc -l) files in lib/"
echo ""
echo "ÌæØ Next steps:"
echo "   1. Copy code into the generated files"
echo "   2. Run: npm install"
echo "   3. Set up .env.local with your credentials"
echo "   4. Run: npm run dev"
echo ""
echo "Happy coding! Ì∫Ä"
