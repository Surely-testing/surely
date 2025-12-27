'use client'

import React from 'react';
import { Shield, Lock, Server, Eye, CheckCircle, FileCheck, Users, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const SecurityPage = () => {
  const securityFeatures = [
    {
      icon: <Lock className="h-8 w-8" />,
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Your test data and sensitive information are always protected."
    },
    {
      icon: <Server className="h-8 w-8" />,
      title: "Secure Infrastructure",
      description: "Our platform is hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLA. Data centers are SOC 2 Type II certified and ISO 27001 compliant."
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Access Controls",
      description: "Role-based access control (RBAC) ensures team members only see what they need. Multi-factor authentication (MFA) and SSO options available."
    },
    {
      icon: <FileCheck className="h-8 w-8" />,
      title: "Regular Audits",
      description: "We conduct regular security audits, penetration testing, and vulnerability assessments by third-party security firms to ensure the highest standards."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Data Privacy",
      description: "We are GDPR and CCPA compliant. Your data is never shared with third parties without your consent. You maintain full ownership of your test data."
    },
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: "Incident Response",
      description: "24/7 security monitoring with automated threat detection. Dedicated incident response team ready to address any security concerns immediately."
    }
  ];

  const certifications = [
    {
      name: "SOC 2 Type II",
      description: "Certified for security, availability, and confidentiality"
    },
    {
      name: "ISO 27001",
      description: "International standard for information security management"
    },
    {
      name: "GDPR Compliant",
      description: "Full compliance with EU data protection regulations"
    },
    {
      name: "CCPA Compliant",
      description: "California Consumer Privacy Act compliance"
    }
  ];

  const securityPractices = [
    {
      category: "Data Protection",
      practices: [
        "AES-256 encryption for data at rest",
        "TLS 1.3 encryption for data in transit",
        "Encrypted database backups every 24 hours",
        "Geographic redundancy across multiple regions",
        "Automatic backup retention for 30 days"
      ]
    },
    {
      category: "Access Management",
      practices: [
        "Multi-factor authentication (MFA) support",
        "Single Sign-On (SSO) with SAML 2.0",
        "Role-based access control (RBAC)",
        "IP whitelisting for Enterprise plans",
        "Session timeout and automatic logout"
      ]
    },
    {
      category: "Application Security",
      practices: [
        "Regular security patches and updates",
        "Web Application Firewall (WAF) protection",
        "DDoS protection and rate limiting",
        "SQL injection and XSS prevention",
        "Secure API with OAuth 2.0 authentication"
      ]
    },
    {
      category: "Monitoring & Response",
      practices: [
        "24/7 automated security monitoring",
        "Real-time threat detection and alerts",
        "Intrusion detection systems (IDS)",
        "Regular penetration testing",
        "Dedicated incident response team"
      ]
    }
  ];

  const complianceItems = [
    "GDPR (General Data Protection Regulation)",
    "CCPA (California Consumer Privacy Act)",
    "SOC 2 Type II",
    "ISO 27001:2013",
    "HIPAA compliant infrastructure available",
    "PCI DSS Level 1 for payment processing"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Your security is our top priority
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Enterprise-grade security measures to protect your data and ensure compliance
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button size="lg" className='btn-primary'>
                  Request Security Audit
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                View Compliance Docs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built with security in mind
            </h2>
            <p className="text-lg text-muted-foreground">
              Multiple layers of protection to keep your data safe and secure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all"
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 border-t border-border bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Certifications & Compliance
            </h2>
            <p className="text-lg text-muted-foreground">
              We maintain the highest industry standards for security and compliance
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="bg-card border-2 border-accent rounded-lg p-6 text-center"
              >
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {cert.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our security practices
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive security measures across all layers of our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {securityPractices.map((section, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {section.category}
                </h3>
                <ul className="space-y-3">
                  {section.practices.map((practice, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm">{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-20 border-t border-border bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Compliance standards we meet
            </h2>
            <p className="text-lg text-muted-foreground">
              We adhere to international security and privacy regulations
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {complianceItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                  <span className="text-foreground font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vulnerability Disclosure */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-accent/5 border-2 border-accent/20 rounded-lg p-8">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Responsible Disclosure
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We take security vulnerabilities seriously. If you discover a security issue, please report it to our security team immediately. We appreciate responsible disclosure and work quickly to address any concerns.
                </p>
                <div className="space-y-2 text-muted-foreground mb-6 text-sm">
                  <p><strong className="text-foreground">Security Email:</strong> security@surely.com</p>
                  <p><strong className="text-foreground">PGP Key:</strong> Available upon request</p>
                  <p><strong className="text-foreground">Response Time:</strong> Within 24 hours</p>
                </div>
                <Link href="/contact">
                  <Button variant="outline">
                    Report a Security Issue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Have security questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our security team is here to answer any questions you may have
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact">
              <Button size="lg" className='btn-primary'>
                Contact Security Team
              </Button>
            </Link>
            <Link href="/help">
              <Button size="lg" variant="outline">
                Visit Help Center
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">•</span>
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span className="text-border">•</span>
            <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SecurityPage;