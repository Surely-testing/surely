'use client'

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LOGO_URL } from "@/config/logo";
import { SystemThemeToggle } from "../ui/ThemeToggle";

interface NavbarProps {
    activeSection: string;
    scrollToSection: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection, scrollToSection }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const handleSignIn = () => {
        window.location.href = '/login';
    };

    const handleStartTrial = () => {
        window.location.href = '/register';
    };

    // Handle navigation - scroll if on home page, otherwise navigate to home first
    const handleNavigation = (sectionId: string, isPage?: boolean) => {
        if (isPage) {
            // Navigate to a separate page
            router.push(`/${sectionId}`);
            return;
        }
        
        const isHomePage = pathname === '/' || pathname === '';
        
        if (isHomePage) {
            // Already on home page, just scroll
            scrollToSection(sectionId);
        } else {
            // Navigate to home page with hash
            router.push(`/#${sectionId}`);
        }
    };

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'features', label: 'Features' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'testimonials', label: 'Reviews' },
        { id: 'about', label: 'About', isPage: true }
    ];

    return (
        <>
            <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50 transition-colors duration-200">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Logo - Mobile First - Clickable to go home */}
                        <button 
                            onClick={() => {
                                router.push('/');
                                setMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-2 flex-shrink-0 min-w-0 hover:opacity-80 transition-opacity"
                        >
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                <Image
                                    src={LOGO_URL}
                                    alt="Surely Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 select-none truncate">
                                Surely
                            </span>
                        </button>

                        {/* Desktop Navigation - Hidden on Mobile */}
                        <div className="hidden lg:flex items-center justify-center flex-1 px-4">
                            <div className="flex items-center gap-4 xl:gap-6">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavigation(item.id, item.isPage)}
                                        className={`relative font-medium transition-all duration-300 px-3 py-2 text-sm xl:text-base whitespace-nowrap ${
                                            activeSection === item.id || (item.isPage && pathname === `/${item.id}`)
                                                ? 'text-primary font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {(activeSection === item.id || (item.isPage && pathname === `/${item.id}`)) && (
                                            <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full"></span>
                                        )}
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Actions - Hidden on Mobile & Tablet */}
                        <div className="hidden lg:flex items-center gap-3 xl:gap-4 flex-shrink-0">
                            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                                <SystemThemeToggle />
                            </div>
                            <button
                                onClick={handleSignIn}
                                className="text-muted-foreground hover:text-foreground font-medium transition-colors px-3 xl:px-4 py-2 rounded hover:bg-muted text-sm xl:text-base whitespace-nowrap"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={handleStartTrial}
                                className="btn-primary text-sm xl:text-base whitespace-nowrap"
                            >
                                Start Free Trial
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0 touch-manipulation relative z-50"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6 text-foreground" />
                            ) : (
                                <Menu className="h-6 w-6 text-foreground" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Full Screen Overlay - OUTSIDE nav element */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-background z-40 overflow-y-auto" style={{ paddingTop: '64px' }}>
                    <div className="px-4 sm:px-6 py-6 space-y-4">
                        {/* Navigation Items */}
                        <div className="space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        handleNavigation(item.id, item.isPage);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`relative flex items-center w-full text-left font-medium py-3 px-4 rounded-lg transition-all duration-300 touch-manipulation ${
                                        activeSection === item.id || (item.isPage && pathname === `/${item.id}`)
                                            ? 'text-primary font-semibold bg-accent/10 border border-accent'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80'
                                    }`}
                                >
                                    {(activeSection === item.id || (item.isPage && pathname === `/${item.id}`)) && (
                                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full"></span>
                                    )}
                                    <span className={(activeSection === item.id || (item.isPage && pathname === `/${item.id}`)) ? 'ml-4' : ''}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border my-4"></div>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50">
                            <span className="text-sm font-medium text-muted-foreground">Theme</span>
                            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                                <SystemThemeToggle />
                            </div>
                        </div>

                        {/* Auth Buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => {
                                    handleSignIn();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full font-medium text-muted-foreground hover:text-foreground py-3 px-4 rounded-lg hover:bg-muted transition-colors touch-manipulation active:bg-muted/80"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => {
                                    handleStartTrial();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full btn-primary py-4 border border-accent hover:border-accent/80 touch-manipulation active:scale-95"
                            >
                                Start Free Trial
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;