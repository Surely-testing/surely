// ============================================
// FILE: app/(auth)/layout.tsx
// ============================================
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { LOGO_URL } from '@/config/logo'

export const metadata: Metadata = {
    title: 'Authentication',
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Left Side - Auth Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-md">
                    {/* Logo */}
                    <Link href="/" className="flex items-center justify-center lg:justify-start mb-8">
                        <div className="w-12 h-12 relative">
                            <Image
                                src={LOGO_URL}
                                alt="Surely Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="ml-3 text-2xl font-bold text-foreground">
                            Surely
                        </span>
                    </Link>

                    {/* Main Content */}
                    {children}
                </div>
            </div>

            {/* Right Side - Decorative Section (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-primary relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20 text-white">
                    <div className="space-y-8">
                        <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
                            Transform Your QA Process
                        </h2>
                        <p className="text-xl text-white/90 leading-relaxed">
                            Join thousands of teams using Surely to ship better software faster with AI-powered testing.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-4 pt-8">
                            {[
                                'AI-powered test generation',
                                'Real-time collaboration',
                                'Advanced analytics & reporting',
                                'Seamless integrations',
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-lg text-white/90">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Testimonial */}
                        <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                            <p className="text-white/90 mb-4 italic">
                                &quot;Surely has completely transformed how we handle QA. Our release cycles are 50% faster.&quot;
                            </p>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
                                    SC
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Sarah Chen</p>
                                    <p className="text-sm text-white/70">QA Director, TechFlow</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}