// ============================================
// app/(dashboard)/[suiteId]/bugs/[bugId]/page.tsx
// ============================================
import { notFound } from 'next/navigation';
import { Bug } from '@/types/bug.types';

interface BugDetailPageProps {
  params: {
    suiteId: string;
    bugId: string;
  };
}

// Fetch bug data from your API
async function getBug(suiteId: string, bugId: string): Promise<Bug | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/suites/${suiteId}/bugs/${bugId}`, {
      cache: 'no-store', // Use 'force-cache' for static data
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching bug:', error);
    return null;
  }
}

export default async function BugDetailPage({ params }: BugDetailPageProps) {
  const { suiteId, bugId } = params;
  
  // Fetch the bug data
  const bug = await getBug(suiteId, bugId);
  
  // Handle not found
  if (!bug) {
    notFound();
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {bug.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Bug ID: {bug.id}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              bug.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              bug.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              bug.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {bug.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              bug.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              bug.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
              bug.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {bug.severity}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Description
        </h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {bug.description}
        </p>
      </div>

      {/* Steps to Reproduce */}
      {bug.stepsToReproduce && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Steps to Reproduce
          </h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {bug.stepsToReproduce}
          </p>
        </div>
      )}

      {/* Expected vs Actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bug.expectedBehavior && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Expected Behavior
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {bug.expectedBehavior}
            </p>
          </div>
        )}
        {bug.actualBehavior && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Actual Behavior
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {bug.actualBehavior}
            </p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Additional Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bug.environment && (
            <>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Environment
              </dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {bug.environment}
              </dd>
            </>
          )}
          {bug.assignedTo && (
            <>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Assigned To
              </dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {bug.assignedTo}
              </dd>
            </>
          )}
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Created
          </dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {new Date(bug.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </dd>
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Last Updated
          </dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {new Date(bug.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </dd>
        </dl>
      </div>
    </div>
  );
}