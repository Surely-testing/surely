// ============================================
// FILE: components/settings/AISettings.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Sparkles, Check, Key, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AISettingsProps {
  profile: any
}

export default function AISettings({ profile }: AISettingsProps) {
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro')

  const models = [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      badge: 'Recommended',
      badgeVariant: 'default' as const,
      description: 'Best for quick responses and high-volume tasks',
      cost: '$0.00015/1k tokens',
      maxTokens: '8192',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-500'
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Best for complex analysis and detailed insights',
      cost: '$0.00125/1k tokens',
      maxTokens: '8192',
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-500'
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      description: 'Balanced performance for general tasks',
      cost: '$0.0005/1k tokens',
      maxTokens: '4096',
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500'
    },
    {
      id: 'gemini-pro-vision',
      name: 'Gemini Pro Vision',
      description: 'For analyzing screenshots and visual content',
      cost: '$0.00025/1k tokens',
      maxTokens: '4096',
      gradient: 'from-orange-500/10 to-amber-500/10',
      iconColor: 'text-orange-500'
    }
  ]

  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId)
    
    // Save to database
    const response = await fetch('/api/profile/ai-model', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiModel: modelId })
    })

    if (response.ok) {
      toast.success('AI model updated')
    } else {
      toast.error('Failed to update AI model')
    }
  }

  const apiKeyConfigured = process.env.NEXT_PUBLIC_GEMINI_API_KEY ? true : false

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                AI Assistant Settings
              </CardTitle>
              <CardDescription className="mt-2">
                Configure your AI assistant preferences and model selection
              </CardDescription>
            </div>
            <Badge 
              variant={apiKeyConfigured ? 'default' : 'warning'}
              className="self-start sm:self-center"
            >
              <span className="flex items-center gap-1.5">
                {apiKeyConfigured ? (
                  <>
                    <Check className="h-3 w-3" />
                    Connected
                  </>
                ) : (
                  'Not Configured'
                )}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeyConfigured ? (
            <div className="flex items-start gap-3 p-4 bg-background/50 backdrop-blur-sm border border-primary/20 rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm flex items-center gap-2">
                  API Key Configuration
                  <Check className="h-4 w-4 text-green-600" />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your Gemini API key is configured in environment variables. Status: <span className="text-green-600 font-medium">Configured ✓</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive font-medium">
                Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Select Gemini Model
          </CardTitle>
          <CardDescription>
            Choose the AI model that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {models.map((model) => {
              const isActive = selectedModel === model.id
              
              return (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)}
                  disabled={!apiKeyConfigured}
                  className={cn(
                    'group relative p-5 rounded-xl border-2 transition-all duration-200 text-left',
                    'hover:border-primary/50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                    'active:scale-[0.98]',
                    isActive
                      ? 'border-primary bg-gradient-to-br shadow-md ' + model.gradient
                      : 'border-border hover:bg-muted/30'
                  )}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'p-2.5 rounded-lg transition-all duration-200',
                      isActive 
                        ? 'bg-primary/10 ring-2 ring-primary/20' 
                        : 'bg-muted group-hover:bg-muted/80'
                    )}>
                      <Sparkles className={cn(
                        'h-5 w-5 transition-colors',
                        isActive ? model.iconColor : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          'font-semibold text-base transition-colors',
                          isActive ? 'text-primary' : 'text-foreground'
                        )}>
                          {model.name}
                        </h3>
                        {model.badge && (
                          <Badge variant={model.badgeVariant} className="text-xs px-2 py-0">
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {model.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Cost:</span>
                      <span className="text-xs font-semibold text-foreground">{model.cost}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-border" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Max:</span>
                      <span className="text-xs font-semibold text-foreground">{model.maxTokens}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}