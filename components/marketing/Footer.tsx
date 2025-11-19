// ============================================
// FILE: components/marketing/Footer.tsx
// ============================================
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Github, Twitter, Linkedin } from 'lucide-react'

const Footer = () => {
  const footerLinks = {
    product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'API', href: '/api' },
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    support: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Help Center', href: '/help' },
      { label: 'Status', href: '/status' },
      { label: 'Community', href: '/community' },
    ],
    legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Cookies', href: '/cookies' },
    ],
  }

  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 relative">
                <Image
                  src={process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || '/logo.svg'}
                  alt="Surely Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="ml-2 text-xl font-bold text-foreground">
                Surely
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Empowering teams to deliver exceptional software through intelligent quality assurance and testing automation.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-background hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-border transition-colors"
              >
                <Twitter className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-background hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-border transition-colors"
              >
                <Github className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-background hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-border transition-colors"
              >
                <Linkedin className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </a>
              <a
                href="mailto:contact@surely.app"
                className="p-2 rounded-lg bg-background hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-border transition-colors"
              >
                <Mail className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4 capitalize">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Surely. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer }