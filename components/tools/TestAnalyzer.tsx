'use client'

import React from "react";
import { BarChart3, Brain, AlertTriangle, TrendingUp } from "lucide-react";

interface TestAnalyzerProps {
  suiteId: string;
}

export const TestAnalyzer: React.FC<TestAnalyzerProps> = ({ suiteId }) => {
    const features = [
        {
            icon: Brain,
            title: "AI-Powered Analysis",
            description: "Get intelligent insights and recommendations based on your test results using advanced AI"
        },
        {
            icon: AlertTriangle,
            title: "Flaky Test Detection",
            description: "Automatically identify and track flaky tests that intermittently fail across test runs"
        },
        {
            icon: TrendingUp,
            title: "Trend Analysis",
            description: "Visualize test performance trends over time and identify patterns in your test suite"
        }
    ];

    return (
        <div className="flex items-center justify-center min-h-[600px]">
            <div className="max-w-3xl text-center space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                        <BarChart3 className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* Title */}
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-800/30 text-primary rounded-full text-sm font-semibold mb-4">
                        Coming Soon
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">
                        Test Result Analyzer
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Analyze test results with AI-powered insights to identify issues, detect patterns, and improve test quality
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="bg-card border border-border rounded-xl p-6 text-center hover:border-orange-500 dark:hover:border-orange-600 transition-all">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="pt-8">
                    <p className="text-sm text-muted-foreground">
                        Currently in development for Suite: <span className="font-mono text-foreground">{suiteId}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};