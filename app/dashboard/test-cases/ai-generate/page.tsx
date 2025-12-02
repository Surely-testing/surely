// ============================================
// FILE: app/dashboard/test-cases/ai-generate/page.tsx
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft, Wand2 } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AIGeneratePage({ params }: { params: { suiteId: string } }) {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [testType, setTestType] = useState('functional')
  const [count, setCount] = useState('5')

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) {
      toast.error('Please enter a description')
      return
    }

    setIsGenerating(true)

    try {
      // TODO: Call AI service to generate test cases
      // For now, simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Test cases generated successfully')
      router.push(`/dashboard/${params.suiteId}/test-cases`)
    } catch (error: any) {
      console.error('Generation failed:', error)
      toast.error('Failed to generate test cases', { description: error.message })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/test-cases`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Cases
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-accent rounded-lg">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Test Case Generator</h1>
            <p className="text-muted-foreground mt-1">
              Let AI help you create comprehensive test cases
            </p>
          </div>
        </div>
      </div>

      {/* Generator Card */}
      <div className="bg-card border border-border rounded-xl p-8 space-y-6">
        {/* Feature Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Feature Description *
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the feature you want to test. For example: 'User authentication with email and password, including forgot password functionality'"
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Be specific about the feature, user flows, and edge cases you want to cover
          </p>
        </div>

        {/* Test Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Test Type
          </label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
          >
            <option value="functional">Functional Testing</option>
            <option value="integration">Integration Testing</option>
            <option value="e2e">End-to-End Testing</option>
            <option value="regression">Regression Testing</option>
            <option value="smoke">Smoke Testing</option>
          </select>
        </div>

        {/* Number of Test Cases */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Number of Test Cases
          </label>
          <select
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
          >
            <option value="3">3 test cases</option>
            <option value="5">5 test cases</option>
            <option value="10">10 test cases</option>
            <option value="15">15 test cases</option>
          </select>
        </div>

        {/* Generation Options */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium text-foreground">Generation Options</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm text-foreground">Include edge cases</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm text-foreground">Include negative scenarios</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-foreground">Generate test data examples</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => router.back()}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex-1 px-4 py-2 text-sm font-semibold text-primary-foreground bg-gradient-accent rounded-lg hover:shadow-glow-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Test Cases
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Info */}
      <div className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">How AI Generation Works</h3>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your feature description and generates comprehensive test cases including:
              test steps, expected results, edge cases, and negative scenarios. The generated test cases
              follow industry best practices and can be edited after generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}