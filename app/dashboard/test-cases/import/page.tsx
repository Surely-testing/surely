// ============================================
// FILE: app/dashboard/test-cases/import/page.tsx
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Download, ArrowLeft } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import Link from 'next/link'
import { logger } from '@/lib/utils/logger';

export default function ImportTestCasesPage({ params }: { params: { suiteId: string } }) {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file || !user) {
      toast.error('Please select a file')
      return
    }

    setIsUploading(true)

    try {
      // Parse CSV/Excel file here
      // For now, just showing the flow
      toast.success('Test cases imported successfully')
      router.push(`/dashboard/test-cases`)
    } catch (error: any) {
      logger.log('Import failed:', error)
      toast.error('Failed to import test cases', { description: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Create CSV template
    const template = 'Title,Description,Priority,Steps,Expected Result\n"Sample Test Case","Test description","medium","Step 1; Step 2","Expected outcome"'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'test-cases-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
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
        <h1 className="text-3xl font-bold text-foreground">Import Test Cases</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV or Excel file to import multiple test cases at once
        </p>
      </div>

      {/* Import Card */}
      <div className="bg-card border border-border rounded-xl p-8 space-y-6">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Need a template?</p>
              <p className="text-xs text-muted-foreground">Download our CSV template to get started</p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </button>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Upload File
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                CSV, XLSX, or XLS (MAX. 10MB)
              </p>
            </label>
          </div>
          {file && (
            <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span className="text-muted-foreground">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Import Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Import Options
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm text-foreground">Skip duplicate test cases</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-foreground">Update existing test cases</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isUploading}
            className="flex-1 btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Importing...' : 'Import Test Cases'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-muted/30 rounded-lg">
        <h3 className="text-sm font-semibold text-foreground mb-3">Import Guidelines</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Ensure your file follows the template format</li>
          <li>• Required columns: Title, Priority</li>
          <li>• Optional columns: Description, Steps, Expected Result</li>
          <li>• Maximum 1000 test cases per import</li>
          <li>• Steps should be separated by semicolons (;)</li>
        </ul>
      </div>
    </div>
  )
}