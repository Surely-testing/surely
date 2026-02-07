'use client'

import React from 'react';
import { Shield, Calendar, Chrome, Globe } from 'lucide-react';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
  const lastUpdated = "December 27, 2024";

  const sections = [
    {
      title: "Information We Collect",
      content: [
        {
          subtitle: "Information you provide to us",
          text: "When you create an account, we collect your name, email address, company name, and payment information. You may also provide additional information such as profile pictures, team member details, and project configurations."
        },
        {
          subtitle: "Information we collect automatically",
          text: "We automatically collect certain information when you use Surely, including your IP address, browser type, device information, operating system, and usage data such as pages visited, features used, and time spent on the platform."
        },
        {
          subtitle: "Test data and analytics",
          text: "We collect information about your test suites, test cases, test results, and related analytics to provide our services and improve your testing experience."
        }
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "To provide our services",
          text: "We use your information to operate, maintain, and improve Surely's testing platform, process your transactions, and provide customer support."
        },
        {
          subtitle: "To communicate with you",
          text: "We send you service-related emails, notifications about your account, updates about new features, and respond to your inquiries. You can opt out of marketing communications at any time."
        },
        {
          subtitle: "To improve our platform",
          text: "We analyze usage patterns and feedback to enhance our features, develop new capabilities, and optimize the user experience."
        },
        {
          subtitle: "For security and fraud prevention",
          text: "We use your information to protect against unauthorized access, detect and prevent fraud, and ensure the security of our platform and users."
        }
      ]
    },
    {
      title: "Information Sharing and Disclosure",
      content: [
        {
          subtitle: "Service providers",
          text: "We share information with third-party service providers who perform services on our behalf, such as payment processing, data analytics, email delivery, and hosting services. These providers are bound by confidentiality agreements."
        },
        {
          subtitle: "Team members",
          text: "When you invite team members to your workspace, they will have access to shared test data and project information according to their assigned permissions."
        },
        {
          subtitle: "Legal requirements",
          text: "We may disclose your information if required by law, court order, or government regulation, or if we believe such action is necessary to comply with legal obligations or protect our rights."
        },
        {
          subtitle: "Business transfers",
          text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such change in ownership."
        }
      ]
    },
    {
      title: "Data Security",
      content: [
        {
          subtitle: "Security measures",
          text: "We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure data centers, regular security audits, and access controls. We are SOC 2 Type II certified."
        },
        {
          subtitle: "Your responsibility",
          text: "You are responsible for maintaining the confidentiality of your account credentials. Please use a strong password and enable two-factor authentication for enhanced security."
        }
      ]
    },
    {
      title: "Data Retention",
      content: [
        {
          subtitle: "Retention periods",
          text: "We retain your information for as long as your account is active or as needed to provide our services. Test data is retained according to your plan's retention period (7 days for Starter, 30 days for Professional, unlimited for Enterprise)."
        },
        {
          subtitle: "Account deletion",
          text: "If you close your account, we will delete your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes."
        }
      ]
    },
    {
      title: "Your Rights and Choices",
      content: [
        {
          subtitle: "Access and correction",
          text: "You can access, update, or correct your personal information through your account settings at any time."
        },
        {
          subtitle: "Data portability",
          text: "You have the right to export your test data in common formats (CSV, JSON, PDF) through our export features."
        },
        {
          subtitle: "Deletion",
          text: "You can request deletion of your account and associated data by contacting our support team. Some information may be retained for legal compliance."
        },
        {
          subtitle: "Marketing opt-out",
          text: "You can unsubscribe from marketing communications by clicking the unsubscribe link in our emails or updating your notification preferences."
        }
      ]
    },
    {
      title: "Cookies and Tracking Technologies",
      content: [
        {
          subtitle: "How we use cookies",
          text: "We use cookies and similar technologies to authenticate users, remember preferences, analyze usage patterns, and improve our services. You can control cookie settings through your browser."
        },
        {
          subtitle: "Third-party analytics",
          text: "We use third-party analytics services to understand how users interact with our platform. These services may use cookies and similar technologies."
        }
      ]
    },
    {
      title: "International Data Transfers",
      content: [
        {
          subtitle: "Global operations",
          text: "Surely operates globally, and your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers."
        },
        {
          subtitle: "GDPR compliance",
          text: "For users in the European Union, we comply with GDPR requirements and use standard contractual clauses for data transfers."
        }
      ]
    },
    {
      title: "Children's Privacy",
      content: [
        {
          subtitle: "Age restrictions",
          text: "Surely is not intended for users under the age of 18. We do not knowingly collect information from children. If we become aware that we have collected information from a child, we will take steps to delete it."
        }
      ]
    },
    {
      title: "Changes to This Privacy Policy",
      content: [
        {
          subtitle: "Updates",
          text: "We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through a notice on our platform. The 'Last Updated' date at the top reflects when changes were made."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden dark:to-slate-950 py-20">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:32px_32px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              Privacy Policy
            </h1>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Toggle */}
      <section className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-orange-500 text-white shadow-md">
              <Globe className="h-4 w-4" />
              <span>Platform Privacy</span>
            </div>

            <Link
              href="/privacy/extension"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
            >
              <Chrome className="h-4 w-4" />
              <span>Extension Privacy</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            At Surely, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our testing and quality assurance platform. Please read this policy carefully to understand our practices regarding your personal data.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {sections.map((section, index) => (
              <div key={index} className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-foreground mb-8 pb-4 border-b-2 border-orange-500">
                  {index + 1}. {section.title}
                </h2>

                <div className="space-y-6">
                  {section.content.map((item, idx) => (
                    <div key={idx}>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {item.subtitle}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-20 bg-muted/50 border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Email:</strong> privacy@assura.com</p>
              <p><strong className="text-foreground">Address:</strong> 123 Tech Street, San Francisco, CA 94105</p>
              <p><strong className="text-foreground">Phone:</strong> +1 (555) 123-4567</p>
            </div>
            <div className="mt-6">
              <Link href="/contact">
                <span className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors">
                  Contact Support →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 bg-muted/50 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/terms" className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Terms of Service
            </Link>
            <span className="text-border">•</span>
            <Link href="/security" className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Security
            </Link>
            <span className="text-border">•</span>
            <Link href="/help" className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;