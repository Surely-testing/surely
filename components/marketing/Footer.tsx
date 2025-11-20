'use client'

import React from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import { LOGO_URL } from "@/config/logo";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-muted py-8 sm:py-12 md:py-16 transition-colors duration-200">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand Section - Full Width on Mobile */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        {/* Logo */}
                        <div className="flex items-center mb-4 sm:mb-6">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
                                <Image 
                                    src={LOGO_URL} 
                                    alt="Assura Logo" 
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md leading-relaxed">
                            Empowering teams to deliver exceptional software through intelligent quality assurance and testing automation.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            <a 
                                href="mailto:contact@example.com"
                                className="bg-background hover:bg-orange-50 dark:hover:bg-orange-900/20 p-2.5 sm:p-3 rounded-lg transition-all duration-200 border border-orange-200 dark:border-orange-600 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-md touch-manipulation active:scale-95"
                                aria-label="Email us"
                            >
                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="min-w-0">
                        <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                            Product
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                            {['Features', 'Pricing', 'Integrations', 'API'].map((item) => (
                                <li key={item}>
                                    <a 
                                        href="#" 
                                        className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className="min-w-0">
                        <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                            Support
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                            {['Documentation', 'Help Center', 'Contact', 'Status'].map((item) => (
                                <li key={item}>
                                    <a 
                                        href="#" 
                                        className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block py-1 touch-manipulation"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                        {/* Copyright */}
                        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                            © {currentYear} Assura. All rights reserved.
                        </p>

                        {/* Legal Links */}
                        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-4 sm:gap-6">
                            {['Privacy', 'Terms', 'Security'].map((item, index) => (
                                <a 
                                    key={item}
                                    href="#" 
                                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap touch-manipulation py-1"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;