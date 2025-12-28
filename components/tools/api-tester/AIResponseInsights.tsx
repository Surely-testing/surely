'use client'

import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

interface AIResponseInsightsProps {
  response: {
    status: number;
    statusText: string;
    data: any;
    time: number;
    size: number;
  };
}

export const AIResponseInsights: React.FC<AIResponseInsightsProps> = ({ response }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string>('');

  const generateInsights = useCallback(async () => {
    setLoading(true);
    setInsights('');
    setError('');

    const dataPreview = typeof response.data === 'string' 
      ? response.data.substring(0, 500)
      : JSON.stringify(response.data, null, 2).substring(0, 500);

    const prompt = `Analyze this API response and provide brief insights (2-3 sentences max):

Status: ${response.status} ${response.statusText}
Response Time: ${response.time}ms
Data Size: ${response.size} bytes
Data Preview: ${dataPreview}

Provide insights on:
1. What type of data is this?
2. Is the response time good/acceptable?
3. Any notable patterns or fields in the data?

Be concise and actionable.`;

    try {
      // Call the API route instead of direct AI service
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      const result = await response.json();

      if (result.success && result.content) {
        setInsights(result.content);
        setIsExpanded(true);
      } else {
        setError(result.error || 'No insights generated');
      }
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  }, [response.status, response.statusText, response.time, response.size, response.data]);

  // Auto-generate on successful response
  useEffect(() => {
    if (response.status >= 200 && response.status < 300 && !insights && !loading) {
      generateInsights();
    }
  }, [response.status, generateInsights, insights, loading]);

  if (response.status < 200 || response.status >= 300) {
    return null;
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-green-700 dark:text-green-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-green-700 dark:text-green-300" />
              )}
            </button>
          </div>

          {isExpanded && (
            <div>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing response...</span>
                </div>
              ) : error ? (
                <div className="space-y-2">
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                  <button
                    onClick={generateInsights}
                    className="text-sm text-green-700 dark:text-green-300 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    Try again
                  </button>
                </div>
              ) : insights ? (
                <div className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                  {insights}
                </div>
              ) : (
                <button
                  onClick={generateInsights}
                  className="text-sm text-green-700 dark:text-green-300 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate insights
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};