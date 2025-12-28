'use client'

import React, { useEffect, useState } from "react";
import { AlertCircle, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { aiService } from '@/lib/ai/ai-service';

interface AIErrorExplainerProps {
  error: {
    status: number;
    statusText: string;
    message?: string;
    url: string;
    method: string;
  };
}

interface ErrorExplanation {
  explanation: string;
  possibleCauses: string[];
  solutions: Array<{
    solution: string;
    steps: string[];
    difficulty: string;
  }>;
  prevention?: string;
}

export const AIErrorExplainer: React.FC<AIErrorExplainerProps> = ({ error }) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ErrorExplanation | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasExplained, setHasExplained] = useState(false);

  useEffect(() => {
    if (error.status >= 400 || error.status === 0) {
      if (!hasExplained) {
        explainError();
        setHasExplained(true);
      }
    }
  }, [error.status]);

  const explainError = async () => {
    setLoading(true);
    setExplanation(null);

    try {
      // Use the callAI method directly instead of explainError
      const prompt = `Explain this API error and provide solutions:

Error: ${error.status} ${error.statusText}
Method: ${error.method}
URL: ${error.url}

Provide a JSON response with:
{
  "explanation": "brief explanation of what this error means",
  "possibleCauses": ["cause 1", "cause 2", "cause 3"],
  "solutions": [
    {
      "solution": "solution title",
      "steps": ["step 1", "step 2"],
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

      const result = await aiService.callAI(prompt, {
        temperature: 0.5,
        maxTokens: 800
      });

      if (result.success && result.data?.content) {
        try {
          // Try to parse JSON from content
          const content = result.data.content.trim();
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setExplanation(parsed);
          } else {
            // If no JSON, use fallback
            setExplanation(getFallbackExplanation(error.status));
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          setExplanation(getFallbackExplanation(error.status));
        }
      } else {
        setExplanation(getFallbackExplanation(error.status));
      }
    } catch (err) {
      console.error('Failed to explain error:', err);
      setExplanation(getFallbackExplanation(error.status));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackExplanation = (status: number): ErrorExplanation => {
    return {
      explanation: getBasicExplanation(status),
      possibleCauses: getBasicCauses(status),
      solutions: getBasicSolutions(status),
      prevention: "Ensure proper request configuration and valid endpoints."
    };
  };

  const getBasicExplanation = (status: number): string => {
    const explanations: Record<number, string> = {
      0: "The request couldn't reach the server. This usually means a network error or CORS issue.",
      400: "The server rejected the request because it was malformed or invalid.",
      401: "Authentication is required. You need to provide valid credentials.",
      403: "You don't have permission to access this resource.",
      404: "The requested resource doesn't exist on the server.",
      405: "The HTTP method you're using is not allowed for this endpoint.",
      429: "You've sent too many requests in a short time. Rate limit exceeded.",
      500: "The server encountered an internal error while processing your request.",
      502: "The server received an invalid response from an upstream server.",
      503: "The service is temporarily unavailable."
    };
    return explanations[status] || `HTTP ${status} error occurred.`;
  };

  const getBasicCauses = (status: number): string[] => {
    const causes: Record<number, string[]> = {
      0: ["Network connectivity issues", "CORS policy blocking the request", "Server is down"],
      400: ["Missing required fields", "Invalid data format", "Incorrect parameter types"],
      401: ["Missing authentication token", "Expired credentials", "Invalid API key"],
      403: ["Insufficient permissions", "Account not authorized", "IP blocked"],
      404: ["Wrong URL or endpoint", "Resource was deleted", "Typo in the path"],
      405: ["Using POST instead of GET (or vice versa)", "Endpoint doesn't support this method"],
      429: ["Too many requests in short time", "Rate limit exceeded"],
      500: ["Server-side bug", "Database connection issue", "Unhandled exception"],
      503: ["Server maintenance", "Overloaded server", "Temporary outage"]
    };
    return causes[status] || ["Unknown server error"];
  };

  const getBasicSolutions = (status: number): Array<{solution: string, steps: string[], difficulty: string}> => {
    const solutions: Record<number, Array<{solution: string, steps: string[], difficulty: string}>> = {
      0: [{
        solution: "Check network and CORS",
        steps: ["Verify internet connection", "Check if API allows cross-origin requests", "Try using a CORS proxy for testing"],
        difficulty: "medium"
      }],
      400: [{
        solution: "Validate request data",
        steps: ["Check all required fields are present", "Verify data types match API expectations", "Review API documentation"],
        difficulty: "easy"
      }],
      401: [{
        solution: "Add authentication",
        steps: ["Add Authorization header with valid token", "Check if credentials are expired", "Regenerate API key if needed"],
        difficulty: "easy"
      }],
      404: [{
        solution: "Check the URL",
        steps: ["Verify the endpoint URL is correct", "Check for typos in the path", "Confirm the resource exists"],
        difficulty: "easy"
      }],
      405: [{
        solution: "Change HTTP method",
        steps: ["Check API documentation for correct method", "Try GET instead of POST or vice versa", "Verify endpoint supports this method"],
        difficulty: "easy"
      }]
    };
    return solutions[status] || [{
      solution: "Review and retry",
      steps: ["Check error details carefully", "Review API documentation", "Contact support if issue persists"],
      difficulty: "medium"
    }];
  };

  if (error.status >= 200 && error.status < 400) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
              Request Failed: {error.status} {error.statusText}
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-red-700 dark:text-red-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-red-700 dark:text-red-300" />
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Getting AI explanation...</span>
                </div>
              ) : explanation ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="font-medium text-red-900 dark:text-red-100">
                        What happened:
                      </span>
                    </div>
                    <p className="text-red-800 dark:text-red-200">
                      {explanation.explanation}
                    </p>
                  </div>

                  {explanation.possibleCauses.length > 0 && (
                    <div>
                      <div className="font-medium text-red-900 dark:text-red-100 mb-1">
                        Possible causes:
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200 ml-2">
                        {explanation.possibleCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {explanation.solutions.length > 0 && (
                    <div>
                      <div className="font-medium text-red-900 dark:text-red-100 mb-2">
                        How to fix:
                      </div>
                      <div className="space-y-2">
                        {explanation.solutions.map((sol, i) => (
                          <div key={i} className="bg-red-100 dark:bg-red-900/30 rounded p-3">
                            <div className="font-medium text-red-900 dark:text-red-100 text-xs mb-1 flex items-center gap-2">
                              <span>{sol.solution}</span>
                              <span className="px-1.5 py-0.5 bg-red-200 dark:bg-red-800 rounded text-xs">
                                {sol.difficulty}
                              </span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1 text-red-800 dark:text-red-200 text-xs ml-2">
                              {sol.steps.map((step, j) => (
                                <li key={j}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};