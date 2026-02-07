'use client'

import React from 'react';
import { Shield, Calendar, Lock, Eye, Database, Chrome, Globe } from 'lucide-react';
import Link from 'next/link';

const ExtensionPrivacyPage = () => {
    const lastUpdated = "February 7, 2026";

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden dark:to-slate-950 py-20">
                <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:32px_32px]" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
                            Extension Privacy Policy
                        </h1>

                        <p className="text-xl text-muted-foreground mb-6">
                            Surely Recorder Pro - Chrome Extension
                        </p>

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
                        <Link
                            href="/privacy"
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                        >
                            <Globe className="h-4 w-4" />
                            <span>Platform Privacy</span>
                        </Link>

                        <div className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-orange-500 text-white shadow-md">
                            <Chrome className="h-4 w-4" />
                            <span>Extension Privacy</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Points */}
            <section className="py-12 bg-muted/30 border-y border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-background border border-border rounded-xl p-6">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Only When Recording
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Data collection starts only when you click "Start Recording". No background tracking.
                            </p>
                        </div>

                        <div className="bg-background border border-border rounded-xl p-6">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Auto-Redaction
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Passwords, API keys, and tokens are automatically sanitized before storage.
                            </p>
                        </div>

                        <div className="bg-background border border-border rounded-xl p-6">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                You Control Storage
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Data stays local until you save. Discard anytime without uploading.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Overview */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-6">
                            Overview
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Surely Recorder Pro is a screen recording extension for developers and QA teams.
                            This privacy policy explains what data the extension collects, when it collects it,
                            and how we protect your privacy.
                        </p>
                    </div>

                    {/* What We Collect */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b-2 border-orange-500">
                            What We Collect (Only During Active Recording)
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    Screen Recordings
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Video and optional audio capture of your browser tab.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    Console Logs
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    JavaScript errors, warnings, and info messages from the browser console.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    Network Activity
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Request URLs, HTTP methods, response status codes. We do NOT capture request/response bodies.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    User Annotations
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Drawings, text annotations, and screenshots you manually create.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What We Don't Collect */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b-2 border-orange-500">
                            What We DON'T Collect
                        </h2>

                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                        <strong className="text-foreground">Passwords:</strong> Automatically redacted
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                        <strong className="text-foreground">Auth tokens & API keys:</strong> Sanitized before storage
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                        <strong className="text-foreground">Credit cards:</strong> Pattern-matched and removed
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                        <strong className="text-foreground">Background data:</strong> Zero collection when not recording
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Storage */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b-2 border-orange-500">
                            Data Storage & Retention
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    Local Storage
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Recordings stored in your browser until you save or discard them.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    Server Upload
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Only uploaded when you click "Save". Encrypted via HTTPS. Auto-deleted after 30 days.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b-2 border-orange-500">
                            Chrome Permissions Explained
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-mono text-sm text-orange-600 dark:text-orange-400 mb-2">
                                    &lt;all_urls&gt;
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Record on any website you're testing. Controls persist across navigation.
                                </p>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-mono text-sm text-orange-600 dark:text-orange-400 mb-2">
                                    offscreen
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Required for Chrome's screen recording API.
                                </p>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-mono text-sm text-orange-600 dark:text-orange-400 mb-2">
                                    storage
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Temporarily store recordings. Auto-cleanup after 30 days.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-muted/50 border border-border rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            Questions?
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Contact us about extension privacy:
                        </p>
                        <p className="text-muted-foreground">
                            <strong className="text-foreground">Email:</strong>{' '}
                            <a href="mailto:privacy@assura.com" className="text-orange-600 dark:text-orange-400 hover:underline">
                                privacy@assura.com
                            </a>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ExtensionPrivacyPage;