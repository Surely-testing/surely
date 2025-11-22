'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBug, useUpdateBug, useDeleteBug } from '@/lib/hooks/useBugs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { BugForm } from './BugForm';
import { ArrowLeft, Edit, Trash, Clock, User, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/types/database.types';

type Bug = Tables<'bugs'>;
type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface BugWithCreator extends Bug {
  creator?: {
    name: string;
    avatar_url?: string | null;
  } | null;
}

interface ReproductionStep {
  id: string;
  description: string;
}

interface BugDetailProps {
  suiteId: string;
  bugId: string;
}

export function BugDetail({ suiteId, bugId }: BugDetailProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const { data: bug, isLoading } = useBug(bugId);
  const deleteMutation = useDeleteBug(suiteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Bug not found</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this bug?')) {
      await deleteMutation.mutateAsync(bugId);
      router.push(`/${suiteId}/bugs`);
    }
  };

  const getSeverityColor = (severity: string | null): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusVariant = (status: string | null): 'danger' | 'warning' | 'success' | 'default' => {
    switch (status) {
      case 'open':
        return 'danger';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const bugData = bug as unknown as BugWithCreator;
  const stepsToReproduce = bugData.steps_to_reproduce as ReproductionStep[] | null;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex-shrink-0 mt-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 mb-2 flex-wrap">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-1" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">
                {bugData.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(bugData.severity)}`}>
                {bugData.severity || 'medium'} severity
              </span>
              <Badge variant={getStatusVariant(bugData.status)}>
                {bugData.status || 'open'}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Mobile Responsive */}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Edit className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            className="flex-1 sm:flex-initial"
          >
            <Trash className="w-4 h-4 sm:mr-2 text-red-500" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Meta Info - Mobile Responsive */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Reported by {bugData.creator?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{formatDistanceToNow(new Date(bugData.created_at as string), { addSuffix: true })}</span>
          </div>
        </div>
      </Card>

      {/* Description */}
      {bugData.description && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h2>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
            {bugData.description}
          </p>
        </Card>
      )}

      {/* Steps to Reproduce - Mobile Responsive */}
      {stepsToReproduce && Array.isArray(stepsToReproduce) && stepsToReproduce.length > 0 && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Steps to Reproduce
          </h2>
          <div className="space-y-3">
            {stepsToReproduce.map((step, index) => (
              <div key={step.id || index} className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <p className="flex-1 text-sm sm:text-base text-gray-900 dark:text-white break-words pt-1">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Bug"
      >
        <BugForm
          suiteId={suiteId}
          initialData={{
            title: bugData.title,
            description: bugData.description ?? undefined,
            severity: bugData.severity ?? undefined,
            status: bugData.status ?? undefined,
          }}
          onSuccess={() => setIsEditModalOpen(false)}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
}