'use client'

import React from "react";
import { Sparkles } from "lucide-react";
import { useAI } from '@/components/ai/AIAssistantProvider';

interface AIRequestHelperProps {
  currentConfig: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  onApplySuggestion?: (config: Partial<{
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  }>) => void;
}

export const AIRequestHelper: React.FC<AIRequestHelperProps> = ({
  currentConfig
}) => {
  const { setIsOpen, sendMessage } = useAI();

  const getHelpFromAI = () => {
    // Build context message about the current API request
    const contextMessage = `I'm building an API request and need help. Here's what I have:

Method: ${currentConfig.method}
URL: ${currentConfig.url || 'Not set yet'}
Headers: ${JSON.stringify(currentConfig.headers, null, 2)}
Body: ${currentConfig.body || 'Empty'}

Can you help me:
1. Check if the URL and method are correct
2. Suggest appropriate headers for this request
3. Validate the request body format (if needed)
4. Point out any common mistakes`;

    // Open AI Assistant and send the message
    setIsOpen(true);
    
    // Small delay to ensure the assistant is fully opened
    setTimeout(() => {
      sendMessage(contextMessage);
    }, 100);
  };

  return (
    <button
      onClick={getHelpFromAI}
      className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors group"
      title="Get AI help"
    >
      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:animate-pulse" />
    </button>
  );
};