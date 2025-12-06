// ============================================
// Test Run Form - Simplified with Asset Linker
// ============================================
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Play, ArrowLeft, Calendar, Settings, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { relationshipsApi } from '@/lib/api/relationships';
import { getTestCases, getSprints, getSprintTestCases } from '@/lib/api/testCases';
import { TestRun, TestCase, Sprint } from '@/types/testRun.types';

interface TestRunFormProps {
  suiteId: string;
  initialData?: TestRun;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TestRunForm({
  suiteId,
  initialData,
  onSuccess,
  onCancel
}: TestRunFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSprints, setSelectedSprints] = useState<string[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [sprintTestCases, setSprintTestCases] = useState<Map<string, TestCase[]>>(new Map());

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: '',
      description: '',
      environment: 'staging',
      test_type: 'manual',
      assigned_to: '',
      scheduled_date: '',
      notes: ''
    }
  });

  useEffect(() => {
    loadData();
  }, [suiteId]);

  useEffect(() => {
    if (initialData?.id) {
      loadExistingRelationships();
    }
  }, [initialData]);

  const loadData = async () => {
    try {
      const [sprintsData, testCasesData] = await Promise.all([
        getSprints(suiteId),
        getTestCases(suiteId)
      ]);
      setSprints(sprintsData);
      setTestCases(testCasesData);

      // Load test cases for each sprint
      const sprintTCMap = new Map<string, TestCase[]>();
      for (const sprint of sprintsData) {
        const cases = await getSprintTestCases(sprint.id);
        sprintTCMap.set(sprint.id, cases);
      }
      setSprintTestCases(sprintTCMap);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load test cases and sprints');
    }
  };

  const loadExistingRelationships = async () => {
    if (!initialData?.id) return;

    try {
      const relationships = await relationshipsApi.getLinkedAssets('test_run' as any, initialData.id);

      const sprintIds: string[] = [];
      const testCaseIds: string[] = [];

      relationships.forEach(rel => {
        if (rel.asset_type === 'sprint') {
          sprintIds.push(rel.asset_id);
        } else if (rel.asset_type === 'test_case') {
          testCaseIds.push(rel.asset_id);
        }
      });

      setSelectedSprints(sprintIds);
      setSelectedTestCases(testCaseIds);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  const handleSprintSelection = (sprintIds: string[]) => {
    setSelectedSprints(sprintIds);

    // Auto-add all test cases from selected sprints
    const allSprintTestCaseIds = new Set<string>();
    sprintIds.forEach(sprintId => {
      const cases = sprintTestCases.get(sprintId) || [];
      cases.forEach(tc => allSprintTestCaseIds.add(tc.id));
    });

    // Keep manually selected test cases that aren't in any sprint
    const orphanedTestCaseIds = selectedTestCases.filter(tcId => {
      return !Array.from(allSprintTestCaseIds).includes(tcId);
    });

    // Combine sprint test cases with orphaned selections
    setSelectedTestCases([...Array.from(allSprintTestCaseIds), ...orphanedTestCaseIds]);
  };

  const handleTestCaseSelection = (testCaseIds: string[]) => {
    setSelectedTestCases(testCaseIds);
  };

  const createRelationships = async (testRunId: string, userId: string) => {
    const relationshipsToCreate = [];

    // Link sprints
    for (const sprintId of selectedSprints) {
      relationshipsToCreate.push({
        source_type: 'test_run' as any,
        source_id: testRunId,
        target_type: 'sprint' as any,
        target_id: sprintId,
        relationship_type: 'related_to' as any,
        created_by: userId,
        suite_id: suiteId
      });
    }

    // Link test cases
    for (const testCaseId of selectedTestCases) {
      relationshipsToCreate.push({
        source_type: 'test_run' as any,
        source_id: testRunId,
        target_type: 'test_case' as any,
        target_id: testCaseId,
        relationship_type: 'tests' as any,
        created_by: userId,
        suite_id: suiteId
      });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('asset_relationships')
      .insert(relationshipsToCreate);

    if (error) throw error;
  };

  const deleteExistingRelationships = async (testRunId: string) => {
    const supabase = createClient();
    await supabase
      .from('asset_relationships')
      .delete()
      .eq('source_type', 'test_run')
      .eq('source_id', testRunId);
  };

  const onSubmit = async (data: any) => {
    if (selectedTestCases.length === 0) {
      toast.error('Please select at least one test case');
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const payload = {
        suite_id: suiteId,
        name: data.name,
        description: data.description || null,
        environment: data.environment,
        test_type: data.test_type,
        assigned_to: data.assigned_to || null,
        scheduled_date: data.scheduled_date || null,
        notes: data.notes || null,
        status: 'pending',
        created_by: user.id
      };

      let testRunId: string;

      if (initialData?.id) {
        const { error } = await supabase
          .from('test_runs')
          .update(payload)
          .eq('id', initialData.id);

        if (error) throw error;
        testRunId = initialData.id;

        await deleteExistingRelationships(testRunId);
      } else {
        const { data: newRun, error } = await supabase
          .from('test_runs')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        testRunId = newRun.id;
      }

      await createRelationships(testRunId, user.id);

      toast.success(
        initialData
          ? 'Test run updated successfully'
          : `Test run created with ${selectedTestCases.length} test case(s)`
      );

      onSuccess();
    } catch (error: any) {
      console.error('Error saving test run:', error);
      toast.error(error.message || 'Failed to save test run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {initialData ? 'Edit Test Run' : 'Create Test Run'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Basic Information
          </h3>

          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className={cn(
                "w-full px-4 py-2.5 border rounded-lg bg-background",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                errors.name ? "border-red-500" : "border-border"
              )}
              placeholder="Sprint 1 Regression"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Brief description..."
            />
          </div>
        </section>

        {/* Configuration */}
        <section className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Environment *</label>
              <select
                {...register('environment')}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="qa">QA</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Test Type</label>
              <select
                {...register('test_type')}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="manual">Manual</option>
                <option value="automated">Automated</option>
                <option value="exploratory">Exploratory</option>
                <option value="regression">Regression</option>
                <option value="smoke">Smoke Test</option>
              </select>
            </div>
          </div>
        </section>

        {/* Execution Details */}
        <section className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Execution
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Assigned To</label>
              <input
                {...register('assigned_to')}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Email or name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Scheduled Date</label>
              <input
                type="datetime-local"
                {...register('scheduled_date')}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* Sprint Selection */}
        <section className="bg-card rounded-lg border border-border p-6">
          <SprintSelector
            sprints={sprints}
            selectedSprints={selectedSprints}
            sprintTestCases={sprintTestCases}
            onSelectionChange={handleSprintSelection}
          />
        </section>

        {/* Test Case Selection */}
        <section className="bg-card rounded-lg border border-border p-6">
          <TestCaseSelector
            testCases={testCases}
            selectedTestCases={selectedTestCases}
            selectedSprints={selectedSprints}
            sprintTestCases={sprintTestCases}
            onSelectionChange={handleTestCaseSelection}
          />
        </section>

        {/* Summary */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium">Total Selected:</span>
          <span className="text-2xl font-bold text-primary">{selectedTestCases.length}</span>
        </div>

        {/* Notes */}
        <section className="bg-card rounded-lg border border-border p-6">
          <label className="block text-sm font-medium mb-2">Additional Notes</label>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Prerequisites, special instructions..."
          />
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedTestCases.length === 0}
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? (
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
                {initialData ? 'Update' : 'Create'} Test Run
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Sprint Selector Component
function SprintSelector({
  sprints,
  selectedSprints,
  sprintTestCases,
  onSelectionChange
}: any) {
  const [showSelector, setShowSelector] = useState(false);

  const toggleSprint = (sprintId: string) => {
    const newSelection = selectedSprints.includes(sprintId)
      ? selectedSprints.filter((id: string) => id !== sprintId)
      : [...selectedSprints, sprintId];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Sprints ({sprints.length})</label>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="text-sm text-primary hover:underline"
        >
          {showSelector ? 'Hide' : 'Browse'}
        </button>
      </div>

      {showSelector && (
        <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
          {sprints.map((sprint: Sprint) => {
            const cases = sprintTestCases.get(sprint.id) || [];
            return (
              <label
                key={sprint.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSprints.includes(sprint.id)}
                  onChange={() => toggleSprint(sprint.id)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <div>
                  <p className="font-medium text-sm">{sprint.name}</p>
                  <p className="text-xs text-muted-foreground">{cases.length} test cases</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {selectedSprints.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedSprints.length} sprint{selectedSprints.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}

// Test Case Selector Component
function TestCaseSelector({
  testCases,
  selectedTestCases,
  selectedSprints,
  sprintTestCases,
  onSelectionChange
}: any) {
  const [showSelector, setShowSelector] = useState(false);

  // Filter out test cases that are already in selected sprints
  const availableTestCases = useMemo(() => {
    const sprintTestCaseIds = new Set<string>();
    selectedSprints.forEach((sprintId: string) => {
      const cases = sprintTestCases.get(sprintId) || [];
      cases.forEach((tc: any) => sprintTestCaseIds.add(tc.id));
    });

    return testCases.filter((tc: any) => !sprintTestCaseIds.has(tc.id));
  }, [testCases, selectedSprints, sprintTestCases]);

  const toggleTestCase = (testCaseId: string) => {
    const newSelection = selectedTestCases.includes(testCaseId)
      ? selectedTestCases.filter((id: string) => id !== testCaseId)
      : [...selectedTestCases, testCaseId];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Additional Test Cases ({availableTestCases.length} available)
        </label>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="text-sm text-primary hover:underline"
          disabled={availableTestCases.length === 0}
        >
          {showSelector ? 'Hide' : 'Browse'}
        </button>
      </div>

      {availableTestCases.length === 0 && selectedSprints.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          All test cases are included in the selected sprint(s)
        </p>
      )}

      {showSelector && availableTestCases.length > 0 && (
        <div className="border border-border rounded-lg max-h-96 overflow-y-auto divide-y divide-border">
          {availableTestCases.map((tc: TestCase) => (
            <label
              key={tc.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTestCases.includes(tc.id)}
                onChange={() => toggleTestCase(tc.id)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              <div>
                <p className="font-medium text-sm">{tc.title}</p>
                {tc.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{tc.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {selectedTestCases.filter((id: string) => 
        availableTestCases.some((tc: any) => tc.id === id)
      ).length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedTestCases.filter((id: string) => 
            availableTestCases.some((tc: any) => tc.id === id)
          ).length} additional test case(s) selected
        </div>
      )}
    </div>
  );
}