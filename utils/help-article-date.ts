// HelpArticles.tsx - Comprehensive help content for Surely

import { JSX } from "react/jsx-runtime";

export interface Article {
  title: string;
  content: string;
  steps?: string[];
  tips?: string[];
}

export interface Category {
  icon: JSX.Element;
  title: string;
  description: string;
  slug: string;
  articles: Article[];
}

export const helpArticles = {
  gettingStarted: [
    {
      title: "Creating your first test suite",
      content: "A test suite is a container that houses the entire testing process for a specific project or application. It includes test cases, bug tracking, test runs, and all related testing assets. Here's how to create one:",
      steps: [
        "Navigate to your Dashboard after logging in",
        "Click the 'New Test Suite' button in the top right corner",
        "Enter a descriptive name for your test suite (e.g., 'Google Maps Project', 'E-commerce Platform')",
        "Add a description of what this project/application does",
        "Click 'Create Suite' to save",
        "You'll be redirected to the suite dashboard where you can start adding test cases, tracking bugs, and managing all testing activities"
      ],
      tips: [
        "Name your suite after the product/project you're testing (e.g., 'Gmail', 'Shopping Cart App')",
        "One suite = one project under test",
        "All test cases, bugs, and test runs for that project live inside this suite",
        "You can create multiple suites for different projects or applications"
      ]
    },
    {
      title: "Understanding test cases",
      content: "Test cases are individual tests that verify specific functionality. Each test case should focus on one specific behavior or feature.",
      steps: [
        "Open your test suite from the Dashboard",
        "Click 'Add Test Case' button",
        "Enter a clear test name describing what you're testing",
        "Define test steps - the actions your test will perform",
        "Set expected results - what should happen if the test passes",
        "Add test data if needed (login credentials, form inputs, etc.)",
        "Save your test case"
      ],
      tips: [
        "Each test case should test only ONE thing",
        "Use the 'Given-When-Then' format: Given a user is logged in, When they click logout, Then they should be redirected to home",
        "Make test names descriptive: 'User can login with valid credentials' not 'Test 1'",
        "Add assertions to verify expected outcomes"
      ]
    },
    {
      title: "Running your first automated test",
      content: "Once you've created test cases, you can run them automatically to validate your application.",
      steps: [
        "Go to your test suite",
        "Click the 'Run Tests' button at the top",
        "Select which tests to run (All, or select specific ones)",
        "Choose your execution environment",
        "Click 'Start Test Run'",
        "Monitor progress in real-time on the test run page",
        "View results once completed"
      ],
      tips: [
        "Run tests after each deployment to catch issues early",
        "Use the 'Run on Schedule' feature to automate testing overnight",
        "Start with a few tests, then expand as you gain confidence",
        "Check the logs if any test fails to understand what went wrong"
      ]
    },
    {
      title: "Interpreting test results",
      content: "Understanding test results helps you quickly identify and fix issues in your application.",
      steps: [
        "Navigate to 'Test Runs' from the sidebar",
        "Click on a completed test run to view details",
        "Review the summary: Passed (green), Failed (red), Skipped (yellow)",
        "Click on failed tests to see detailed error messages",
        "Check screenshots and logs for failed tests",
        "Use the 'Compare' feature to see differences from previous runs",
        "Export results as PDF or share with your team"
      ],
      tips: [
        "Green checkmarks = test passed successfully",
        "Red X = test failed, click to see why",
        "Yellow warning = test was skipped or had warnings",
        "Look at error messages and screenshots to understand failures",
        "Check if failures are due to app bugs or test configuration issues"
      ]
    }
  ],

  featuresTools: [
    {
      title: "Using AI-powered test generation",
      content: "Surely's AI can automatically generate comprehensive test cases based on your descriptions, saving you hours of manual test writing.",
      steps: [
        "Open your test suite",
        "Click 'AI Generate Tests' button",
        "Describe what functionality you want to test (e.g., 'User login with email and password', 'Checkout process with payment')",
        "Be specific about the expected behavior and any edge cases",
        "Click 'Generate' and wait while AI creates your test cases",
        "Review the generated test cases",
        "Edit or customize any tests as needed",
        "Click 'Add to Suite' to save the generated tests"
      ],
      tips: [
        "Be specific and detailed in your description for better AI results",
        "Include expected behaviors: 'User should see error message for invalid email'",
        "Mention edge cases: 'Test with empty fields, special characters, etc.'",
        "Review generated tests before adding them - AI is smart but not perfect",
        "Use AI to create a foundation, then customize for your specific needs"
      ]
    },
    {
      title: "Creating and managing test cases",
      content: "Organize your testing efforts by creating detailed test cases that document exactly how to test each feature.",
      steps: [
        "Navigate to your test suite",
        "Click 'Add Test Case' button",
        "Enter a descriptive test case title",
        "Write clear test steps in the 'Steps' section",
        "Define expected results for each step",
        "Add preconditions if needed (e.g., 'User must be logged in')",
        "Set priority level (High, Medium, Low)",
        "Assign the test case to a team member",
        "Save the test case"
      ],
      tips: [
        "Write test steps clearly so anyone on the team can execute them",
        "Include all necessary test data (URLs, credentials, input values)",
        "Use the 'Given-When-Then' format for clarity",
        "Keep test cases focused on one feature or functionality"
      ]
    },
    {
      title: "Tracking and managing bugs",
      content: "Log, track, and manage bugs found during testing to ensure they get fixed before release.",
      steps: [
        "Navigate to the 'Bugs' section in your test suite",
        "Click 'Report Bug' button",
        "Enter a clear bug title describing the issue",
        "Describe the bug in detail with steps to reproduce",
        "Add screenshots or attachments if helpful",
        "Set bug severity (Critical, High, Medium, Low)",
        "Set bug priority",
        "Assign to a developer or team member",
        "Link to related test cases if applicable",
        "Save the bug report"
      ],
      tips: [
        "Include clear steps to reproduce the bug",
        "Add screenshots or screen recordings when possible",
        "Use descriptive titles: 'Login fails with valid credentials' not 'Bug 1'",
        "Update bug status as it progresses (Open, In Progress, Fixed, Closed)"
      ]
    },
    {
      title: "Test execution and tracking",
      content: "Execute your test cases manually and track which tests pass or fail to monitor your application quality.",
      steps: [
        "Go to your test suite and select 'Test Runs'",
        "Click 'Start New Test Run'",
        "Select which test cases to include in this run",
        "Execute each test case manually following the documented steps",
        "Mark each test as Pass, Fail, or Blocked",
        "If a test fails, add notes explaining why",
        "Create bug reports for any failures",
        "Complete the test run and view the summary"
      ],
      tips: [
        "Execute tests in a consistent environment",
        "Document any deviations or unexpected behavior",
        "Link failed tests to bug reports for tracking",
        "Review test run history to identify trends"
      ]
    }
  ],

  accountManagement: [
    {
      title: "Inviting team members",
      content: "Collaborate with your team by inviting members to your Surely workspace.",
      steps: [
        "Go to Settings > Team Management",
        "Click 'Invite Team Member' button",
        "Enter their email address",
        "Select their role: Admin (full access), Developer (can create/run tests), or Viewer (read-only)",
        "Add a personal message (optional)",
        "Click 'Send Invitation'",
        "They'll receive an email with a link to join",
        "Once they accept, they'll appear in your team list"
      ],
      tips: [
        "Admins can manage billing and invite others",
        "Developers can create and run tests but can't manage billing",
        "Viewers can only view results, perfect for stakeholders",
        "You can change roles anytime from the team management page"
      ]
    },
    {
      title: "Managing user permissions",
      content: "Control what each team member can access and modify in your Surely workspace.",
      steps: [
        "Navigate to Settings > Team Management",
        "Find the team member you want to update",
        "Click the three dots menu next to their name",
        "Select 'Change Role'",
        "Choose the new role: Admin, Developer, or Viewer",
        "Confirm the change",
        "The user's permissions update immediately"
      ],
      tips: [
        "Review permissions regularly, especially when roles change",
        "Use Viewer role for clients or stakeholders who only need to see results",
        "Only give Admin access to trusted team members",
        "You can also remove team members from this page if needed"
      ]
    },
    {
      title: "Updating account information",
      content: "Keep your profile and account details up to date.",
      steps: [
        "Click your profile icon in the top right",
        "Select 'Account Settings'",
        "Update your name, email, or profile picture",
        "Change your password if needed",
        "Update your timezone for accurate test scheduling",
        "Set your notification preferences",
        "Click 'Save Changes' at the bottom"
      ],
      tips: [
        "Use a strong password with at least 12 characters",
        "Enable email notifications for critical test failures",
        "Keep your email updated for important account notifications",
        "Set the correct timezone so scheduled tests run at the right time"
      ]
    },
    {
      title: "Security and privacy settings",
      content: "Protect your account with two-factor authentication and manage your privacy preferences.",
      steps: [
        "Go to Settings > Security",
        "Enable Two-Factor Authentication (2FA) by clicking 'Enable 2FA'",
        "Scan the QR code with your authenticator app (Google Authenticator, Authy)",
        "Enter the 6-digit code to confirm",
        "Save your backup codes in a secure location",
        "Configure session timeout settings",
        "Review connected devices and revoke access to unknown devices",
        "Set up trusted IP addresses for Enterprise plans"
      ],
      tips: [
        "Always enable 2FA for enhanced security",
        "Store backup codes securely - you'll need them if you lose your device",
        "Review active sessions regularly and logout from unused devices",
        "Use a password manager to generate and store strong passwords"
      ]
    }
  ],

  billingPlans: [
    {
      title: "Understanding pricing plans",
      content: "Choose the right Surely plan for your team's testing needs.",
      steps: [
        "Visit the Pricing page from the main menu",
        "Compare features across Starter, Professional, and Enterprise plans",
        "Starter: Best for small teams (up to 5 test suites, 50 cases per suite)",
        "Professional: Best for growing teams (unlimited suites, 500 cases per suite, AI features)",
        "Enterprise: Custom solutions with unlimited everything and dedicated support",
        "Check what's included in each plan",
        "Use the calculator to estimate costs based on your needs"
      ],
      tips: [
        "Start with a 14-day free trial to test all Professional features",
        "You can upgrade or downgrade anytime",
        "Annual billing saves 17% compared to monthly",
        "Contact sales for Enterprise custom pricing and features"
      ]
    },
    {
      title: "Upgrading or downgrading",
      content: "Change your subscription plan as your team's needs evolve.",
      steps: [
        "Go to Settings > Billing & Plans",
        "Click 'Change Plan'",
        "Select your new plan (upgrade or downgrade)",
        "Review the pricing difference",
        "For upgrades: You'll be charged the prorated amount immediately",
        "For downgrades: Changes take effect at the end of your billing cycle",
        "Confirm the change",
        "You'll receive an email confirmation"
      ],
      tips: [
        "Upgrades happen immediately with prorated billing",
        "Downgrades take effect at the end of your current billing period",
        "You keep access to paid features until the downgrade date",
        "If you exceed limits after downgrading, you'll be notified to upgrade or reduce usage"
      ]
    },
    {
      title: "Payment methods",
      content: "Manage your credit cards and payment information securely.",
      steps: [
        "Navigate to Settings > Billing & Plans",
        "Click 'Payment Methods'",
        "To add a card: Click 'Add Payment Method'",
        "Enter your card details (all data is encrypted)",
        "Set it as default if desired",
        "To remove a card: Click the trash icon next to it",
        "Update billing address if needed",
        "Save changes"
      ],
      tips: [
        "We accept Visa, Mastercard, American Express, and Discover",
        "Your card information is securely processed by Stripe",
        "We never store your full card number",
        "Set up auto-pay so you never miss a payment"
      ]
    },
    {
      title: "Billing and invoices",
      content: "Access your billing history and download invoices for accounting purposes.",
      steps: [
        "Go to Settings > Billing & Plans",
        "Click 'Billing History' tab",
        "View all past invoices and payments",
        "Click 'Download' next to any invoice to get a PDF",
        "Use filters to find invoices by date or amount",
        "Update billing email to send invoices to your accounting team",
        "Set up automatic invoice forwarding"
      ],
      tips: [
        "Invoices are emailed automatically on each billing date",
        "Download invoices for expense reports and accounting",
        "Invoices include detailed breakdowns of charges",
        "Contact support if you need a custom invoice format"
      ]
    }
  ]
};