// ============================================
// components/sprints/SprintForm.tsx
// ============================================
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSprint, useUpdateSprint } from '@/lib/hooks/useSprints';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

interface SprintFormProps {
    suiteId: string;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function SprintForm({ suiteId, initialData, onSuccess, onCancel }: SprintFormProps) {
    const createMutation = useCreateSprint(suiteId);
    const updateMutation = useUpdateSprint(suiteId);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            name: '',
            description: '',
            status: 'planning',
            start_date: '',
            end_date: '',
        }
    });

    const onSubmit = async (data: any) => {
        if (initialData) {
            await updateMutation.mutateAsync({ id: initialData.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Sprint Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message as string | undefined}
            />

            <Textarea
                label="Description"
                {...register('description')}
            />

            <Select
                label="Status"
                {...register('status')}
                options={[
                    { value: 'planning', label: 'Planning' },
                    { value: 'active', label: 'Active' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'archived', label: 'Archived' },
                ]}
            />

            <Input
                label="Start Date"
                type="date"
                {...register('start_date')}
            />

            <Input
                label="End Date"
                type="date"
                {...register('end_date')}
            />

            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    {initialData ? 'Update' : 'Create'} Sprint
                </Button>
            </div>
        </form>
    );
}