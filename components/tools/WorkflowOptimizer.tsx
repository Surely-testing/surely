'use client'

import React from "react";
import { Workflow, Zap, GitBranch, Clock } from "lucide-react";

interface WorkflowOptimizerProps {
  suiteId: string;
}

export const WorkflowOptimizer: React.FC<WorkflowOptimizerProps> = ({ suiteId }) => {
    const features = [
        {
            icon: GitBranch,
            title: "Visual Workflow Builder",
            description: "Design and visualize your test workflows with an intuitive drag-and-drop interface"
        },
        {
            icon: Zap,
            title: "AI-Powered Optimization",
            description: "Get intelligent suggestions to optimize test execution time and resource usage"
        },
        {
            icon: Clock,
            title: "Performance Analytics",
            description: "Track workflow performance over time and identify bottlenecks automatically"
        }
    ];

    return (
        <div className="flex items-center justify-center min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] px-4 py-8 sm:py-12">
            <div className="max-w-3xl text-center space-y-6 sm:space-y-8 w-full">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <Workflow className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                    </div>
                </div>

                {/* Title */}
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-400 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                        Coming Soon
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                        Workflow Optimizer
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
                        Optimize your testing workflows with AI-powered analysis and intelligent automation recommendations
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-blue-500 dark:hover:border-blue-600 transition-all">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="pt-6 sm:pt-8">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Currently in development for Suite: <span className="font-mono text-gray-900 dark:text-gray-100 break-all">{suiteId}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};