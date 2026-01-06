// ==============================================
// File: lib/emails/trial-notifications.tsx
// React Email Templates for Trial Notifications
// ==============================================

import React from 'react';

// ==============================================
// Email Template Components
// ==============================================

interface TrialEndingTodayProps {
  name: string;
  tier: string;
  upgradeUrl: string;
}

export const TrialEndingTodayEmail: React.FC<TrialEndingTodayProps> = ({
  name,
  tier,
  upgradeUrl,
}) => (
  <div style={styles.container}>
    <div style={styles.header}>
      <h1 style={styles.logo}>Surely</h1>
    </div>
    
    <div style={styles.content}>
      <h2 style={styles.heading}>Your trial ends today 😔</h2>
      
      <p style={styles.text}>Hi {name},</p>
      
      <p style={styles.text}>
        Your <strong>{tier}</strong> trial ends today. To continue enjoying premium features, 
        upgrade your account now.
      </p>
      
      <div style={styles.features}>
        <p style={styles.featuresTitle}>You'll keep access to:</p>
        <ul style={styles.list}>
          <li>All premium features</li>
          <li>Priority support</li>
          <li>Advanced analytics</li>
          <li>Team collaboration</li>
        </ul>
      </div>
      
      <a href={upgradeUrl} style={styles.button}>
        Upgrade Now
      </a>
      
      <p style={styles.textSmall}>
        If you don't upgrade, your account will automatically switch to our Free plan.
      </p>
    </div>
    
    <div style={styles.footer}>
      <p style={styles.footerText}>
        Questions? Reply to this email or visit our <a href="https://testsurely.com/help">Help Center</a>
      </p>
    </div>
  </div>
);

interface TrialEndingTomorrowProps {
  name: string;
  tier: string;
  upgradeUrl: string;
}

export const TrialEndingTomorrowEmail: React.FC<TrialEndingTomorrowProps> = ({
  name,
  tier,
  upgradeUrl,
}) => (
  <div style={styles.container}>
    <div style={styles.header}>
      <h1 style={styles.logo}>YourApp</h1>
    </div>
    
    <div style={styles.content}>
      <h2 style={styles.heading}>Your trial ends tomorrow ⏰</h2>
      
      <p style={styles.text}>Hi {name},</p>
      
      <p style={styles.text}>
        Just a friendly reminder that your <strong>{tier}</strong> trial ends tomorrow.
      </p>
      
      <p style={styles.text}>
        Don't lose access to your premium features! Upgrade now and continue where you left off.
      </p>
      
      <a href={upgradeUrl} style={styles.button}>
        Upgrade to {tier}
      </a>
      
      <p style={styles.textSmall}>
        Need more time to decide? Your account will automatically switch to our Free plan if you don't upgrade.
      </p>
    </div>
    
    <div style={styles.footer}>
      <p style={styles.footerText}>
        Questions? Reply to this email or visit our <a href="https://testsurely.com/help">Help Center</a>
      </p>
    </div>
  </div>
);

interface TrialEndingSoonProps {
  name: string;
  tier: string;
  daysRemaining: number;
  upgradeUrl: string;
  trialEndDate: string;
}

export const TrialEndingSoonEmail: React.FC<TrialEndingSoonProps> = ({
  name,
  tier,
  daysRemaining,
  upgradeUrl,
  trialEndDate,
}) => (
  <div style={styles.container}>
    <div style={styles.header}>
      <h1 style={styles.logo}>YourApp</h1>
    </div>
    
    <div style={styles.content}>
      <h2 style={styles.heading}>Your trial ends in {daysRemaining} days</h2>
      
      <p style={styles.text}>Hi {name},</p>
      
      <p style={styles.text}>
        Your <strong>{tier}</strong> trial ends on <strong>{trialEndDate}</strong>.
      </p>
      
      <p style={styles.text}>
        Upgrade now to continue enjoying all premium features without interruption.
      </p>
      
      <a href={upgradeUrl} style={styles.button}>
        Upgrade to {tier}
      </a>
    </div>
    
    <div style={styles.footer}>
      <p style={styles.footerText}>
        Questions? Reply to this email or visit our <a href="https://yourdomain.com/help">Help Center</a>
      </p>
    </div>
  </div>
);

interface TrialExpiredProps {
  name: string;
  previousTier: string;
  upgradeUrl: string;
}

export const TrialExpiredEmail: React.FC<TrialExpiredProps> = ({
  name,
  previousTier,
  upgradeUrl,
}) => (
  <div style={styles.container}>
    <div style={styles.header}>
      <h1 style={styles.logo}>YourApp</h1>
    </div>
    
    <div style={styles.content}>
      <h2 style={styles.heading}>Your trial has ended</h2>
      
      <p style={styles.text}>Hi {name},</p>
      
      <p style={styles.text}>
        Your <strong>{previousTier}</strong> trial has ended and your account has been moved to our Free plan.
      </p>
      
      <p style={styles.text}>
        You can still access basic features, but to unlock everything again, upgrade anytime!
      </p>
      
      <div style={styles.comparison}>
        <div style={styles.planBox}>
          <h3 style={styles.planTitle}>Free Plan</h3>
          <p style={styles.planPrice}>$0/month</p>
          <ul style={styles.list}>
            <li>Basic features</li>
            <li>Community support</li>
            <li>5 projects</li>
          </ul>
        </div>
        
        <div style={styles.planBoxHighlight}>
          <h3 style={styles.planTitle}>{previousTier}</h3>
          <p style={styles.planPrice}>From $29/month</p>
          <ul style={styles.list}>
            <li>All premium features</li>
            <li>Priority support</li>
            <li>Unlimited projects</li>
            <li>Advanced analytics</li>
          </ul>
        </div>
      </div>
      
      <a href={upgradeUrl} style={styles.button}>
        Upgrade Now
      </a>
      
      <p style={styles.textSmall}>
        We're here whenever you're ready to upgrade!
      </p>
    </div>
    
    <div style={styles.footer}>
      <p style={styles.footerText}>
        Questions? Reply to this email or visit our <a href="https://yourdomain.com/help">Help Center</a>
      </p>
    </div>
  </div>
);

// ==============================================
// Email Styles (Inline CSS for email compatibility)
// ==============================================

const styles = {
  container: {
    backgroundColor: '#f6f6f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  logo: {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  heading: {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: '20px',
  },
  text: {
    color: '#555',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
  },
  textSmall: {
    color: '#777',
    fontSize: '14px',
    lineHeight: '20px',
    marginTop: '20px',
    marginBottom: 0,
  },
  features: {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    padding: '20px',
    marginBottom: '24px',
  },
  featuresTitle: {
    color: '#333',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '12px',
  },
  list: {
    color: '#555',
    fontSize: '15px',
    lineHeight: '24px',
    marginTop: 0,
    marginBottom: 0,
    paddingLeft: '20px',
  },
  button: {
    backgroundColor: '#0070f3',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    padding: '14px 32px',
    borderRadius: '6px',
    display: 'inline-block',
    marginTop: '20px',
    marginBottom: '20px',
  },
  comparison: {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  planBox: {
    border: '2px solid #e5e5e5',
    borderRadius: '8px',
    padding: '20px',
    flex: 1,
  },
  planBoxHighlight: {
    border: '2px solid #0070f3',
    borderRadius: '8px',
    padding: '20px',
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  planTitle: {
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: '8px',
  },
  planPrice: {
    color: '#0070f3',
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: '16px',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '30px',
  },
  footerText: {
    color: '#999',
    fontSize: '14px',
    lineHeight: '20px',
  },
};

// ==============================================
// Helper Functions
// ==============================================

export function getEmailTemplate(template: string): React.FC<any> | null {
  const templates: Record<string, React.FC<any>> = {
    'trial-ending-today': TrialEndingTodayEmail,
    'trial-ending-tomorrow': TrialEndingTomorrowEmail,
    'trial-ending-soon': TrialEndingSoonEmail,
    'trial-expired': TrialExpiredEmail,
  };
  
  return templates[template] || null;
}

export function getEmailSubject(template: string, data?: any): string {
  const subjects: Record<string, string> = {
    'trial-ending-today': '⏰ Your trial ends today',
    'trial-ending-tomorrow': 'Your trial ends tomorrow',
    'trial-ending-soon': `Your trial ends in ${data?.daysRemaining || 'a few'} days`,
    'trial-expired': 'Your trial has ended',
  };
  
  return subjects[template] || 'Update from YourApp';
}