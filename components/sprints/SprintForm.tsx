// ============================================
// components/sprints/SprintForm.tsx
// Enhanced Sprint Form - Full Page Layout
// ============================================
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSprint, useUpdateSprint } from '@/lib/hooks/useSprints';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Target, Calendar, FileText } from 'lucide-react';

interface SprintFormProps {
    suiteId: string;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function SprintForm({ suiteId, initialData, onSuccess, onCancel }: SprintFormProps) {
    const createMutation = useCreateSprint(suiteId);
    const updateMutation = useUpdateSprint(suiteId);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialData || {
            name: '',
            description: '',
            goals: '',
            status: 'planning',
            start_date: '',
            end_date: '',
        }
    });

    const onSubmit = async (data: any) => {
        try {
            if (initialData) {
                await updateMutation.mutateAsync({ id: initialData.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving sprint:', error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={onCancel}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Sprints
            </button>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                    {initialData ? 'Edit Sprint' : 'Create New Sprint'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {initialData ? 'Update the sprint details below' : 'Fill in the details to create a new testing sprint'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information */}
                <section>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Basic Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Sprint Name *
                            </label>
                            <Input
                                {...register('name', { required: 'Sprint name is required' })}
                                placeholder="Sprint 1, Release 2.0, Q1 Testing..."
                                error={errors.name?.message as string | undefined}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Description
                            </label>
                            <Textarea
                                {...register('description')}
                                placeholder="Brief description of what this sprint covers..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Sprint Goals
                            </label>
                            <Textarea
                                {...register('goals')}
                                placeholder="What are the objectives and deliverables for this sprint?"
                                rows={4}
                            />
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Start Date
                            </label>
                            <Input
                                type="date"
                                {...register('start_date')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                End Date
                            </label>
                            <Input
                                type="date"
                                {...register('end_date')}
                            />
                        </div>
                    </div>
                </section>

                {/* Status */}
                <section>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Status
                    </h3>
                    <div className="max-w-md">
                        <Select
                            {...register('status')}
                            options={[
                                { value: 'planning', label: 'Planning' },
                                { value: 'active', label: 'Active' },
                                { value: 'on-hold', label: 'On Hold' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'archived', label: 'Archived' },
                            ]}
                        />
                    </div>
                </section>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : initialData ? 'Update Sprint' : 'Create Sprint'}
                    </Button>
                </div>
            </form>
        </div>
    );
}