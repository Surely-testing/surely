'use client'

import React, { useState } from "react";
import { Code, Workflow, Gauge, BarChart3, ChevronDown } from "lucide-react";
import { APITester } from "./APITester";
import { WorkflowOptimizer } from "./WorkflowOptimizer";
import { PerformanceBenchmarker } from "./PerformanceBenchmarker";
import { TestAnalyzer } from "./TestAnalyzer";

type ToolType = 'api-tester' | 'workflow-optimizer' | 'performance-benchmarker' | 'test-analyzer';

interface ToolsViewProps {
  suiteId: string;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ suiteId }) => {
    const [selectedTool, setSelectedTool] = useState<ToolType>('api-tester');

    const tools = [
        { 
            id: 'api-tester' as ToolType, 
            name: 'API Tester', 
            icon: Code,
            description: 'Test individual APIs or create automated workflows'
        },
        { 
            id: 'workflow-optimizer' as ToolType, 
            name: 'Workflow Optimizer', 
            icon: Workflow,
            description: 'Optimize and analyze your API workflows'
        },
        { 
            id: 'performance-benchmarker' as ToolType, 
            name: 'Performance Benchmarker', 
            icon: Gauge,
            description: 'Benchmark API performance and response times'
        },
        { 
            id: 'test-analyzer' as ToolType, 
            name: 'Test Result Analyzer', 
            icon: BarChart3,
            description: 'Analyze and visualize test results'
        }
    ];

    const renderTool = () => {
        switch(selectedTool) {
            case 'api-tester':
                return <APITester suiteId={suiteId} />;
            case 'workflow-optimizer':
                return <WorkflowOptimizer suiteId={suiteId} />;
            case 'performance-benchmarker':
                return <PerformanceBenchmarker suiteId={suiteId} />;
            case 'test-analyzer':
                return <TestAnalyzer suiteId={suiteId} />;
            default:
                return <APITester suiteId={suiteId} />;
        }
    };

    const currentTool = tools.find(t => t.id === selectedTool);
    const CurrentIcon = currentTool?.icon || Code;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header with Tool Selector */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:px-6 lg:py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full max-w-full lg:max-w-7xl lg:mx-auto">
                    {/* Tool Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                            <CurrentIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                {currentTool?.name}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {currentTool?.description}
                            </p>
                        </div>
                    </div>
                    
                    {/* Tool Selector Dropdown */}
                    <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                        <select 
                            value={selectedTool}
                            onChange={(e) => setSelectedTool(e.target.value as ToolType)}
                            className="w-full appearance-none px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors pr-10"
                        >
                            {tools.map((tool) => (
                                <option key={tool.id} value={tool.id}>
                                    {tool.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Tool Content */}
            <div className="flex-1 overflow-auto">
                {renderTool()}
            </div>
        </div>
    );
};