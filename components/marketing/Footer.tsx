'use client'

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Linkedin } from "lucide-react";
import { LOGO_URL } from "@/config/logo";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    // Configuration - easily enable/disable social links
    const SOCIAL_LINKS = {
        linkedin: {
            enabled: true,
            url: "https://linkedin.com/company/surely",
            label: "LinkedIn"
        },
        twitter: {
            enabled: false, // Enable when you have active presence
            url: "https://twitter.com/surelyqa",
            label: "Twitter"
        },
        github: {
            enabled: false, // Enable when you have public repos
            url: "https://github.com/surely-testing",
            label: "GitHub"
        },
        email: {
            enabled: true,
            url: "/contact",
            label: "Email us"
        }
    };

    return (
        <footer className="bg-muted py-8 sm:py-12 md:py-16 transition-colors duration-200">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12">
                    {/* Brand Section */}
                    <div className="md:col-span-2 lg:col-span-3">
                        {/* Logo */}
                        <div className="flex items-center mb-4 sm:mb-6">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
                                <Image 
                                    src={LOGO_URL} 
                                    alt="Surely Logo" 
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md leading-relaxed">
                            Empowering teams to deliver exceptional software through intelligent quality assurance and testing automation.
                        </p>

                        {/* Social Links - Only show enabled ones */}
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.linkedin.enabled && (
                                <Link 
                                    href={SOCIAL_LINKS.linkedin.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-background hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2.5 sm:p-3 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md touch-manipulation active:scale-95"
                                    aria-label={SOCIAL_LINKS.linkedin.label}
                                >
                                    <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400" />
                                </Link>
                            )}
                            
                            {SOCIAL_LINKS.email.enabled && (
                                <Link 
                                    href={SOCIAL_LINKS.email.url}
                                    className="bg-background hover:bg-orange-50 dark:hover:bg-orange-900/20 p-2.5 sm:p-3 rounded-lg transition-all duration-200 border border-orange-200 dark:border-orange-600 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-md touch-manipulation active:scale-95"
                                    aria-label={SOCIAL_LINKS.email.label}
                                >
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="min-w-0">
                        <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                            Product
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <Link 
                                    href="/features" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/pricing" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/demo" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Demo
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/how-to" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    How-To Guides
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="min-w-0">
                        <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                            Company
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <Link 
                                    href="/events" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Events
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/careers" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/blog" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className="min-w-0">
                        <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                            Support
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <Link 
                                    href="/help" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/contact" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/reviews/submit" 
                                    className="text-sm sm:text-base text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                >
                                    Write a Review
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                        {/* Copyright */}
                        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                            © {currentYear} Surely. All rights reserved.
                        </p>

                        {/* Legal Links */}
                        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-4 sm:gap-6">
                            <Link 
                                href="/privacy"
                                className="text-xs sm:text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap touch-manipulation py-1"
                            >
                                Privacy
                            </Link>
                            <Link 
                                href="/terms"
                                className="text-xs sm:text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap touch-manipulation py-1"
                            >
                                Terms
                            </Link>
                            <Link 
                                href="/security"
                                className="text-xs sm:text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap touch-manipulation py-1"
                            >
                                Security
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;