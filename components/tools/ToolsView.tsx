'use client'

import React, { useState } from "react";
import { Code, Workflow, Gauge, BarChart3 } from "lucide-react";
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
        { id: 'api-tester' as ToolType, name: 'API Tester', icon: Code },
        { id: 'workflow-optimizer' as ToolType, name: 'Workflow Optimizer', icon: Workflow },
        { id: 'performance-benchmarker' as ToolType, name: 'Performance Benchmarker', icon: Gauge },
        { id: 'test-analyzer' as ToolType, name: 'Test Result Analyzer', icon: BarChart3 }
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
        <div className="h-full flex flex-col">
            {/* Header with Dropdown */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                        <CurrentIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{currentTool?.name}</h2>
                        <p className="text-sm text-muted-foreground">Suite: {suiteId}</p>
                    </div>
                </div>
                
                {/* Tool Selector Dropdown */}
                <select 
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value as ToolType)}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:border-primary transition-colors"
                >
                    {tools.map((tool) => (
                        <option key={tool.id} value={tool.id}>
                            {tool.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tool Content */}
            <div className="flex-1 overflow-auto">
                {renderTool()}
            </div>
        </div>
    );
};