'use client'

import React from 'react';
import { FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

const TermsOfServicePage = () => {
  const lastUpdated = "December 27, 2024";

  const sections = [
    {
      title: "Acceptance of Terms",
      content: [
        {
          subtitle: "Agreement to Terms",
          text: "By accessing or using Assura's testing and quality assurance platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services."
        },
        {
          subtitle: "Changes to Terms",
          text: "We reserve the right to modify these terms at any time. We will notify you of any material changes via email or through our platform. Your continued use of Assura after such modifications constitutes acceptance of the updated terms."
        }
      ]
    },
    {
      title: "Account Registration and Security",
      content: [
        {
          subtitle: "Account Creation",
          text: "To use Assura, you must create an account by providing accurate, complete, and current information. You must be at least 18 years old to create an account. Each account is for individual or organizational use only."
        },
        {
          subtitle: "Account Responsibilities",
          text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized access or security breach."
        },
        {
          subtitle: "Multiple Accounts",
          text: "You may not create multiple accounts to circumvent plan limitations or engage in fraudulent activities. We reserve the right to terminate duplicate accounts."
        }
      ]
    },
    {
      title: "Subscription and Payment",
      content: [
        {
          subtitle: "Free Trial",
          text: "We offer a 14-day free trial for new users. No credit card is required to start the trial. After the trial period, you must subscribe to a paid plan to continue using our services."
        },
        {
          subtitle: "Billing",
          text: "Subscription fees are billed in advance on a monthly or annual basis, depending on your selected plan. All fees are in U.S. dollars and are non-refundable except as required by law or as specified in our refund policy."
        },
        {
          subtitle: "Payment Methods",
          text: "You agree to provide current, complete, and accurate payment information. You authorize us to charge your payment method for all fees incurred under your account."
        },
        {
          subtitle: "Price Changes",
          text: "We may change our pricing at any time. For existing customers, price changes will take effect at the start of your next billing cycle. We will provide at least 30 days notice of any price increases."
        },
        {
          subtitle: "Refunds",
          text: "We offer a 30-day money-back guarantee for first-time subscribers. Refund requests must be submitted within 30 days of your initial payment. No refunds will be provided for renewals or partial months."
        }
      ]
    },
    {
      title: "Service Usage and Limitations",
      content: [
        {
          subtitle: "Acceptable Use",
          text: "You agree to use Assura only for lawful purposes and in accordance with these terms. You may not use our services to test or interact with systems you do not own or have explicit permission to test."
        },
        {
          subtitle: "Plan Limitations",
          text: "Your use of Assura is subject to the limitations of your subscription plan, including test suite limits, test case limits, and data retention periods. Exceeding these limits may result in service restrictions."
        },
        {
          subtitle: "Prohibited Activities",
          text: "You may not: (a) reverse engineer, decompile, or disassemble our software; (b) use automated means to access our services without permission; (c) interfere with or disrupt our services; (d) attempt to gain unauthorized access to our systems; (e) use our services to transmit malicious code or conduct security testing on third-party systems without authorization."
        }
      ]
    },
    {
      title: "Intellectual Property Rights",
      content: [
        {
          subtitle: "Our Intellectual Property",
          text: "Assura and all related trademarks, logos, and service marks are owned by us or our licensors. All software, content, and materials provided through our platform are protected by intellectual property laws."
        },
        {
          subtitle: "Your Content",
          text: "You retain ownership of all test data, test cases, and other content you upload to Assura. By using our services, you grant us a limited license to use, store, and process your content solely to provide and improve our services."
        },
        {
          subtitle: "Feedback",
          text: "If you provide feedback, suggestions, or ideas about our services, you grant us a perpetual, royalty-free license to use and incorporate such feedback without compensation or attribution."
        }
      ]
    },
    {
      title: "Data Privacy and Security",
      content: [
        {
          subtitle: "Data Protection",
          text: "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. You acknowledge and accept the inherent security risks of electronic data transmission."
        },
        {
          subtitle: "Privacy Policy",
          text: "Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these terms by reference."
        },
        {
          subtitle: "Data Backup",
          text: "While we perform regular backups, you are responsible for maintaining your own backup copies of critical data. We are not liable for any data loss."
        }
      ]
    },
    {
      title: "Service Availability and Modifications",
      content: [
        {
          subtitle: "Service Availability",
          text: "We strive to maintain high availability of our services but do not guarantee uninterrupted access. We may perform scheduled maintenance with advance notice when possible."
        },
        {
          subtitle: "Service Modifications",
          text: "We reserve the right to modify, suspend, or discontinue any aspect of our services at any time, with or without notice. We are not liable for any modifications, suspensions, or discontinuations."
        },
        {
          subtitle: "Beta Features",
          text: "We may offer beta or experimental features that are provided 'as-is' without warranties. Beta features may be modified or discontinued at any time."
        }
      ]
    },
    {
      title: "Termination",
      content: [
        {
          subtitle: "Termination by You",
          text: "You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period. You will retain access to your account until that time."
        },
        {
          subtitle: "Termination by Us",
          text: "We may suspend or terminate your account immediately if: (a) you breach these terms; (b) your payment fails; (c) we are required to do so by law; or (d) your use of our services poses a security risk or violates our acceptable use policies."
        },
        {
          subtitle: "Effect of Termination",
          text: "Upon termination, your right to access and use Assura immediately ceases. We will delete your data within 30 days of termination unless retention is required by law. You may request data export before termination."
        }
      ]
    },
    {
      title: "Warranties and Disclaimers",
      content: [
        {
          subtitle: "Service 'As-Is'",
          text: "ASSURA IS PROVIDED 'AS-IS' AND 'AS AVAILABLE' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT."
        },
        {
          subtitle: "No Guarantee of Results",
          text: "We do not guarantee that our services will meet your specific requirements, that they will be error-free, or that defects will be corrected. You use our services at your own risk."
        }
      ]
    },
    {
      title: "Limitation of Liability",
      content: [
        {
          subtitle: "Liability Cap",
          text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF ASSURA SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM."
        },
        {
          subtitle: "Excluded Damages",
          text: "WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, OR GOODWILL, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES."
        },
        {
          subtitle: "Exceptions",
          text: "Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In such cases, our liability will be limited to the maximum extent permitted by law."
        }
      ]
    },
    {
      title: "Indemnification",
      content: [
        {
          subtitle: "Your Indemnification Obligations",
          text: "You agree to indemnify, defend, and hold harmless Assura and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from: (a) your use of our services; (b) your violation of these terms; (c) your violation of any third-party rights; or (d) any content you submit to our platform."
        }
      ]
    },
    {
      title: "Dispute Resolution",
      content: [
        {
          subtitle: "Governing Law",
          text: "These terms are governed by the laws of the State of California, United States, without regard to conflict of law principles."
        },
        {
          subtitle: "Arbitration",
          text: "Any dispute arising from these terms or your use of Assura shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except where prohibited by law."
        },
        {
          subtitle: "Class Action Waiver",
          text: "You agree to resolve disputes with us on an individual basis and waive your right to participate in class actions or class arbitrations, except where prohibited by law."
        }
      ]
    },
    {
      title: "General Provisions",
      content: [
        {
          subtitle: "Entire Agreement",
          text: "These terms, together with our Privacy Policy and any other legal notices published on our platform, constitute the entire agreement between you and Assura."
        },
        {
          subtitle: "Severability",
          text: "If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect."
        },
        {
          subtitle: "Waiver",
          text: "Our failure to enforce any right or provision of these terms will not constitute a waiver of such right or provision."
        },
        {
          subtitle: "Assignment",
          text: "You may not assign or transfer these terms or your account without our prior written consent. We may assign these terms without restriction."
        },
        {
          subtitle: "Contact Information",
          text: "For questions about these terms, please contact us at legal@assura.com."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-20">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:32px_32px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/30 rounded-full px-4 py-2 mb-6">
              <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-300">Legal</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              Terms of Service
            </h1>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome to Assura. These Terms of Service govern your access to and use of our testing and quality assurance platform. By using Assura, you agree to comply with and be bound by these terms. Please read them carefully before using our services.
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
              Questions About These Terms?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Email:</strong> legal@assura.com</p>
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
            <Link href="/privacy" className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Privacy Policy
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

export default TermsOfServicePage;