// ============================================
// components/documents/DocumentsView.tsx
// ============================================
'use client';

import React, { useState } from 'react';
// import { useDocuments } from '@/lib/hooks/useDocuments';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { DocumentsList } from './DocumentsList';
import { Plus, Search, Upload } from 'lucide-react';

interface DocumentsViewProps {
  suiteId: string;
}

export function DocumentsView({ suiteId }: DocumentsViewProps) {
  const [search, setSearch] = useState('');
  
  // Temporary: Mock the hook until it's implemented
  const documents = [] as any[];
  const isLoading = false;
  
  // Once useDocuments is fixed, uncomment this:
  // const { data: documents, isLoading } = useDocuments(suiteId, { search });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage test documentation and files
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {documents && documents.length > 0 ? (
        <DocumentsList documents={documents} suiteId={suiteId} />
      ) : (
        <EmptyState
          icon="📁"
          title="No Documents Yet"
          description="Upload your first document to start organizing your test documentation"
          action={
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          }
        />
      )}
    </div>
  );
}