// ============================================
// components/bugs/BugForm.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { useCreateBug } from '@/lib/hooks/useBugs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Plus, Trash } from 'lucide-react';

interface BugFormProps {
  suiteId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    description?: string;
    severity?: string;
    status?: string;
  };
}

interface ReproductionStep {
  id: string;
  order: number;
  description: string;
}

export function BugForm({
  suiteId,
  onSuccess,
  onCancel,
  initialData,
}: BugFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [severity, setSeverity] = useState(initialData?.severity || 'medium');
  const [status, setStatus] = useState(initialData?.status || 'open');
  const [steps, setSteps] = useState<ReproductionStep[]>([
    { id: '1', order: 1, description: '' },
  ]);

  const createMutation = useCreateBug(suiteId);

  const addStep = () => {
    const newStep: ReproductionStep = {
      id: Date.now().toString(),
      order: steps.length + 1,
      description: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const updateStep = (id: string, value: string) => {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, description: value } : step
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        title,
        description,
        severity,
        status,
        steps_to_reproduce: steps.filter(s => s.description.trim()),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create bug:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title *
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the bug"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the bug and its impact"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Severity
          </label>
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)} options={[]}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[]}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Steps to Reproduce
          </label>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="w-4 h-4 mr-1" />
            Add Step
          </Button>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-medium mt-2">
                {index + 1}
              </span>
              <Input
                value={step.description}
                onChange={(e) => updateStep(step.id, e.target.value)}
                placeholder={`Step ${index + 1}`}
                className="flex-1"
              />
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeStep(step.id)}
                  className="mt-2"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Reporting...' : 'Report Bug'}
        </Button>
      </div>
    </form>
  );
}