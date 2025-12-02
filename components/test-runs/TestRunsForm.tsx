// ============================================
// Fixed Test Run Form - Displays All Test Cases
// ============================================
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTestRun, useUpdateTestRun } from '@/lib/hooks/useTestRuns';
import {
  Play, Calendar, FileText, Settings, ArrowLeft,
  Search, X, Plus, Package, CheckSquare, AlertCircle, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface Sprint {
  id: string;
  name: string;
  description?: string;
  test_case_ids?: string[];
}

interface TestCase {
  id: string;
  title: string;
  description?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  sprint_id?: string; // Test case might have sprint_id
}

interface TestRunFormProps {
  suiteId: string;
  testCases: TestCase[];
  sprints: Sprint[];
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TestRunForm({
  suiteId,
  testCases,
  sprints,
  initialData,
  onSuccess,
  onCancel
}: TestRunFormProps) {
  const createTestRun = useCreateTestRun(suiteId);
  const updateTestRun = useUpdateTestRun(suiteId);

  const [selectedSprints, setSelectedSprints] = useState<string[]>(
    initialData?.metadata?.sprint_ids || []
  );

  const [selectedTestCases, setSelectedTestCases] = useState<string[]>(
    initialData?.test_case_ids || []
  );

  const [sprintSearch, setSprintSearch] = useState('');
  const [caseSearch, setCaseSearch] = useState('');
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [showCaseSelector, setShowCaseSelector] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: initialData || {
      name: '',
      description: '',
      environment: 'staging',
      test_type: 'manual',
      assigned_to: '',
      scheduled_date: '',
      notes: '',
    }
  });

  // Debug logging
  useEffect(() => {
    console.log('=== TEST RUN FORM DATA ===');
    console.log('Sprints:', sprints);
    console.log('Test Cases:', testCases);
    console.log('Selected Sprints:', selectedSprints);
    console.log('Selected Test Cases:', selectedTestCases);
    console.log('========================');
  }, [sprints, testCases, selectedSprints, selectedTestCases]);

  // Get test cases for a sprint (using BOTH sprint.test_case_ids AND testCase.sprint_id)
  const getSprintTestCases = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return [];

    // Method 1: If sprint has test_case_ids array
    if (sprint.test_case_ids && sprint.test_case_ids.length > 0) {
      return testCases.filter(tc => sprint.test_case_ids!.includes(tc.id));
    }

    // Method 2: If test cases have sprint_id field
    return testCases.filter(tc => tc.sprint_id === sprintId);
  };

  // Get test cases NOT in any selected sprint
  const independentTestCases = useMemo(() => {
    // Get all test case IDs that are in selected sprints
    const sprintCaseIds = new Set<string>();
    
    selectedSprints.forEach(sprintId => {
      const sprintCases = getSprintTestCases(sprintId);
      sprintCases.forEach(tc => sprintCaseIds.add(tc.id));
    });

    // Return test cases not in any selected sprint
    return testCases.filter(tc => !sprintCaseIds.has(tc.id));
  }, [testCases, selectedSprints, sprints]);

  // Filtered sprints
  const filteredSprints = useMemo(() => {
    if (!sprintSearch) return sprints;
    const search = sprintSearch.toLowerCase();
    return sprints.filter(sprint =>
      sprint.name.toLowerCase().includes(search) ||
      sprint.description?.toLowerCase().includes(search)
    );
  }, [sprints, sprintSearch]);

  // Filtered independent cases
  const filteredIndependentCases = useMemo(() => {
    if (!caseSearch) return independentTestCases;
    const search = caseSearch.toLowerCase();
    return independentTestCases.filter(tc =>
      tc.title.toLowerCase().includes(search) ||
      tc.description?.toLowerCase().includes(search)
    );
  }, [independentTestCases, caseSearch]);

  // Handle sprint selection
  const toggleSprint = (sprintId: string) => {
    const sprintCases = getSprintTestCases(sprintId);

    if (selectedSprints.includes(sprintId)) {
      // Deselecting sprint
      setSelectedSprints(prev => prev.filter(id => id !== sprintId));
      setSelectedTestCases(prev =>
        prev.filter(caseId => !sprintCases.find(tc => tc.id === caseId))
      );
    } else {
      // Selecting sprint
      setSelectedSprints(prev => [...prev, sprintId]);
      setSelectedTestCases(prev => [
        ...prev,
        ...sprintCases.map(tc => tc.id).filter(id => !prev.includes(id))
      ]);
    }
  };

  // Toggle individual test case
  const toggleTestCase = (caseId: string) => {
    setSelectedTestCases(prev =>
      prev.includes(caseId)
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  // Remove entire sprint
  const removeSprint = (sprintId: string) => {
    const sprintCases = getSprintTestCases(sprintId);

    setSelectedSprints(prev => prev.filter(id => id !== sprintId));
    setSelectedTestCases(prev =>
      prev.filter(caseId => !sprintCases.find(tc => tc.id === caseId))
    );
  };

  // Select all cases from a sprint
  const selectAllSprintCases = (sprintId: string) => {
    const sprintCases = getSprintTestCases(sprintId);

    setSelectedTestCases(prev => [
      ...prev,
      ...sprintCases.map(tc => tc.id).filter(id => !prev.includes(id))
    ]);
  };

  // Deselect all cases from a sprint
  const deselectAllSprintCases = (sprintId: string) => {
    const sprintCases = getSprintTestCases(sprintId);

    setSelectedTestCases(prev =>
      prev.filter(caseId => !sprintCases.find(tc => tc.id === caseId))
    );
  };

  const onSubmit = async (data: any) => {
    if (selectedTestCases.length === 0) {
      toast.error('Please select at least one test case');
      return;
    }

    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        environment: data.environment,
        test_type: data.test_type,
        assigned_to: data.assigned_to || undefined,
        scheduled_date: data.scheduled_date || undefined,
        notes: data.notes || undefined,
        test_case_ids: selectedTestCases,
      };

      console.log('Submitting payload:', payload);

      if (initialData?.id) {
        await updateTestRun.mutateAsync({
          id: initialData.id,
          data: payload
        });
      } else {
        await createTestRun.mutateAsync(payload);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving test run:', error);
      toast.error(error.message || 'Failed to save test run');
    }
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Test Runs
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {initialData ? 'Edit Test Run' : 'Create New Test Run'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select test cases for execution (Total available: {testCases.length})
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Test Run Name *
              </label>
              <input
                {...register('name', { required: 'Test run name is required' })}
                placeholder="Sprint 1 Regression, Release 2.0 Testing..."
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg bg-background text-foreground",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                  errors.name ? "border-red-500" : "border-border"
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="Brief description of this test run..."
                rows={3}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              />
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Test Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Environment *
              </label>
              <select
                {...register('environment', { required: 'Environment is required' })}
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg bg-background text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                  errors.environment ? "border-red-500" : "border-border"
                )}
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="qa">QA</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Test Type
              </label>
              <select
                {...register('test_type')}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="manual">Manual Testing</option>
                <option value="automated">Automated</option>
                <option value="exploratory">Exploratory</option>
                <option value="regression">Regression</option>
                <option value="smoke">Smoke Test</option>
              </select>
            </div>
          </div>
        </section>

        {/* Execution Details */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Execution Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Assigned To
              </label>
              <input
                {...register('assigned_to')}
                placeholder="Enter email or name"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Scheduled Date
              </label>
              <input
                type="datetime-local"
                {...register('scheduled_date')}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Sprint Selection */}
        {sprints.length > 0 && (
          <section className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5" />
                Select from Sprints ({sprints.length} available)
              </h3>
              <button
                type="button"
                onClick={() => setShowSprintSelector(!showSprintSelector)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {showSprintSelector ? 'Hide' : 'Browse Sprints'}
              </button>
            </div>

            {/* Sprint Selector */}
            {showSprintSelector && (
              <div className="border border-border rounded-lg overflow-hidden mb-4">
                <div className="p-3 bg-muted border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search sprints..."
                      value={sprintSearch}
                      onChange={(e) => setSprintSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {filteredSprints.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No sprints found
                    </div>
                  ) : (
                    filteredSprints.map(sprint => {
                      const sprintCases = getSprintTestCases(sprint.id);
                      return (
                        <label
                          key={sprint.id}
                          className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSprints.includes(sprint.id)}
                            onChange={() => toggleSprint(sprint.id)}
                            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{sprint.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {sprintCases.length} test cases
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Selected Sprints */}
            {selectedSprints.map(sprintId => {
              const sprint = sprints.find(s => s.id === sprintId);
              if (!sprint) return null;

              const sprintCases = getSprintTestCases(sprintId);
              const selectedCount = sprintCases.filter(tc =>
                selectedTestCases.includes(tc.id)
              ).length;

              return (
                <div key={sprint.id} className="mb-4 border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-primary/5">
                    <div className="flex items-center gap-3 flex-1">
                      <Layers className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{sprint.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCount} of {sprintCases.length} selected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllSprintCases(sprint.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() => deselectAllSprintCases(sprint.id)}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Deselect All
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSprint(sprint.id)}
                        className="ml-2 p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {sprintCases.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No test cases in this sprint
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {sprintCases.map(tc => (
                        <label
                          key={tc.id}
                          className="flex items-start gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTestCases.includes(tc.id)}
                            onChange={() => toggleTestCase(tc.id)}
                            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground text-sm">{tc.title}</p>
                              {tc.priority && (
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  getPriorityColor(tc.priority)
                                )}>
                                  {tc.priority}
                                </span>
                              )}
                            </div>
                            {tc.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {tc.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Individual Test Cases */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Select Individual Test Cases ({independentTestCases.length} available)
            </h3>
            <button
              type="button"
              onClick={() => setShowCaseSelector(!showCaseSelector)}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {showCaseSelector ? 'Hide' : 'Browse Cases'}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Select test cases not in any sprint, or add more cases individually.
              </p>
            </div>
          </div>

          {showCaseSelector && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="p-3 bg-muted border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search test cases..."
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {filteredIndependentCases.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {independentTestCases.length === 0
                      ? 'All test cases are in selected sprints'
                      : 'No test cases found'}
                  </div>
                ) : (
                  filteredIndependentCases.map(tc => (
                    <label
                      key={tc.id}
                      className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTestCases.includes(tc.id)}
                        onChange={() => toggleTestCase(tc.id)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{tc.title}</p>
                          {tc.priority && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              getPriorityColor(tc.priority)
                            )}>
                              {tc.priority}
                            </span>
                          )}
                        </div>
                        {tc.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {tc.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Summary */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Selected Test Cases:</span>
            <span className="text-2xl font-bold text-primary">{selectedTestCases.length}</span>
          </div>
          {selectedTestCases.length === 0 && (
            <p className="text-xs text-destructive mt-2">⚠️ Please select at least one test case</p>
          )}
        </div>

        {/* Notes */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Additional Notes
          </h3>
          <textarea
            {...register('notes')}
            placeholder="Any additional information, prerequisites, or special instructions..."
            rows={4}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
          />
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={createTestRun.isPending || updateTestRun.isPending}
            className="px-6 py-2.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              createTestRun.isPending ||
              updateTestRun.isPending ||
              selectedTestCases.length === 0
            }
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all disabled:opacity-50"
          >
            {(createTestRun.isPending || updateTestRun.isPending) ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {initialData ? 'Update Test Run' : 'Create Test Run'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}