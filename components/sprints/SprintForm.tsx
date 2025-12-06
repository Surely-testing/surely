// ============================================
// components/sprints/SprintForm.tsx
// Enhanced Sprint Form with Asset Selection
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useCreateSprint, useUpdateSprint } from '@/lib/hooks/useSprints';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Target, Calendar, FileText, CheckSquare, Bug, Lightbulb, X, Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SprintFormProps {
    suiteId: string;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

interface Asset {
    id: string;
    title: string;
    status: string | null;
    sprint_id: string | null;  // Add this line
    type: 'test_case' | 'bug' | 'suggestion';
}

export default function SprintForm({ suiteId, initialData, onSuccess, onCancel }: SprintFormProps) {
    const createMutation = useCreateSprint(suiteId);
    const updateMutation = useUpdateSprint(suiteId);

    const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
    const [availableTestCases, setAvailableTestCases] = useState<Asset[]>([]);
    const [availableBugs, setAvailableBugs] = useState<Asset[]>([]);
    const [availableSuggestions, setAvailableSuggestions] = useState<Asset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(true);
    const [activeTab, setActiveTab] = useState<'test_case' | 'bug' | 'suggestion'>('test_case');
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialData || {
            name: '',
            description: '',
            goals: '',
            status: 'planning',
            start_date: '',
            end_date: '',
        }
    });

    useEffect(() => {
        fetchAvailableAssets();
    }, [suiteId]);

    const fetchAvailableAssets = async () => {
        try {
            setLoadingAssets(true);
            const supabase = createClient();

            // Fetch test cases - exclude completed/archived ones
            const { data: testCases } = await supabase
                .from('test_cases')
                .select('id, title, status, sprint_id')
                .eq('suite_id', suiteId)
                .not('status', 'in', '(passed, completed, archived)')
                .order('title');

            // Fetch bugs - exclude resolved/closed ones
            const { data: bugs } = await supabase
                .from('bugs')
                .select('id, title, status, sprint_id')
                .eq('suite_id', suiteId)
                .not('status', 'in', '(resolved, closed, archived)')
                .order('title');

            // Fetch suggestions - exclude rejected/implemented/archived ones
            const { data: suggestions } = await supabase
                .from('suggestions')
                .select('id, title, status, sprint_id')
                .eq('suite_id', suiteId)
                .not('status', 'in', '(rejected, implemented, archived)')
                .order('title');

            console.log('Fetched assets counts:', {
                testCases: testCases?.length || 0,
                bugs: bugs?.length || 0,
                suggestions: suggestions?.length || 0
            });

            setAvailableTestCases(
                (testCases || []).map(tc => ({
                    id: tc.id,
                    title: tc.title,
                    status: tc.status,
                    sprint_id: tc.sprint_id,
                    type: 'test_case' as const
                }))
            );

            setAvailableBugs(
                (bugs || []).map(b => ({
                    id: b.id,
                    title: b.title,
                    status: b.status,
                    sprint_id: b.sprint_id,
                    type: 'bug' as const
                }))
            );

            setAvailableSuggestions(
                (suggestions || []).map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    status: s.status,
                    sprint_id: s.sprint_id,
                    type: 'suggestion' as const
                }))
            );
        } catch (error) {
            console.error('Error fetching assets:', error);
            toast.error('Failed to load available assets');
        } finally {
            setLoadingAssets(false);
        }
    };

    const handleAssetToggle = (asset: Asset) => {
        setSelectedAssets(prev => {
            const exists = prev.find(a => a.id === asset.id && a.type === asset.type);
            if (exists) {
                return prev.filter(a => !(a.id === asset.id && a.type === asset.type));
            }
            return [...prev, asset];
        });
    };

    const isAssetSelected = (asset: Asset) => {
        return selectedAssets.some(a => a.id === asset.id && a.type === asset.type);
    };

    const removeAsset = (asset: Asset) => {
        setSelectedAssets(prev => prev.filter(a => !(a.id === asset.id && a.type === asset.type)));
    };

    const getFilteredAssets = (assets: Asset[]) => {
        if (!searchTerm) return assets;
        return assets.filter(asset =>
            asset.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const linkAssetsToSprint = async (sprintId: string) => {
        if (selectedAssets.length === 0) return;

        const supabase = createClient();
        const updates = selectedAssets.map(asset => {
            const tableName = asset.type === 'test_case' ? 'test_cases'
                : asset.type === 'bug' ? 'bugs'
                    : 'suggestions';

            return supabase
                .from(tableName as any)
                .update({ sprint_id: sprintId })
                .eq('id', asset.id);
        });

        await Promise.all(updates);
    };

    const onSubmit = async (data: any) => {
        try {
            let sprintId: string;

            if (initialData) {
                const result = await updateMutation.mutateAsync({ id: initialData.id, data });
                sprintId = initialData.id;
            } else {
                const result = await createMutation.mutateAsync(data);
                sprintId = result.id;
            }

            // Link selected assets to the sprint
            await linkAssetsToSprint(sprintId);

            toast.success(
                initialData
                    ? 'Sprint updated successfully'
                    : `Sprint created with ${selectedAssets.length} asset(s)`
            );
            onSuccess();
        } catch (error) {
            console.error('Error saving sprint:', error);
            toast.error('Failed to save sprint');
        }
    };

    const getAssetIcon = (type: Asset['type']) => {
        switch (type) {
            case 'test_case': return <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
            case 'bug': return <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />;
            case 'suggestion': return <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
        }
    };

    const getAssetBadgeColor = (type: Asset['type']) => {
        switch (type) {
            case 'test_case': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'suggestion': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
        }
    };

    const getStatusBadgeColor = (status: string | null) => {
        if (!status) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

        const colors: Record<string, string> = {
            'pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'blocked': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            'open': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            'under-review': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            'approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    };

    const currentAssets = activeTab === 'test_case' ? availableTestCases
        : activeTab === 'bug' ? availableBugs
            : availableSuggestions;

    const filteredAssets = getFilteredAssets(currentAssets);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                type="button"
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
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="planning">Planning</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on-hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </section>

                {/* Asset Selection */}
                <section>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add Assets to Sprint
                    </h3>

                    {/* Selected Assets Summary */}
                    {selectedAssets.length > 0 && (
                        <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">
                                    Selected Assets ({selectedAssets.length})
                                </span>
                                <div className="flex items-center gap-4 text-sm">
                                    {selectedAssets.filter(a => a.type === 'test_case').length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-foreground">
                                                Test Cases: {selectedAssets.filter(a => a.type === 'test_case').length}
                                            </span>
                                        </div>
                                    )}
                                    {selectedAssets.filter(a => a.type === 'bug').length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            <span className="text-foreground">
                                                Bugs: {selectedAssets.filter(a => a.type === 'bug').length}
                                            </span>
                                        </div>
                                    )}
                                    {selectedAssets.filter(a => a.type === 'suggestion').length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                            <span className="text-foreground">
                                                Suggestions: {selectedAssets.filter(a => a.type === 'suggestion').length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Asset Type Tabs */}
                    <div className="border border-border rounded-lg overflow-hidden">
                        <div className="flex border-b border-border bg-muted/30">
                            <button
                                type="button"
                                onClick={() => setActiveTab('test_case')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'test_case'
                                    ? 'bg-background text-foreground border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <CheckSquare className="w-4 h-4" />
                                    <span>Test Cases</span>
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                        {availableTestCases.length}
                                    </span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('bug')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'bug'
                                    ? 'bg-background text-foreground border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Bug className="w-4 h-4" />
                                    <span>Bugs</span>
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                        {availableBugs.length}
                                    </span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('suggestion')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'suggestion'
                                    ? 'bg-background text-foreground border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Lightbulb className="w-4 h-4" />
                                    <span>Suggestions</span>
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                        {availableSuggestions.length}
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-3 border-b border-border bg-muted/20">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab === 'test_case' ? 'test cases' : activeTab === 'bug' ? 'bugs' : 'suggestions'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>

                        {/* Asset List */}
                        <div className="p-3 max-h-[400px] overflow-y-auto">
                            {loadingAssets ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                    <p className="text-sm">Loading assets...</p>
                                </div>
                            ) : filteredAssets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">
                                        {searchTerm
                                            ? 'No assets found matching your search'
                                            : `No available ${activeTab === 'test_case' ? 'test cases' : activeTab === 'bug' ? 'bugs' : 'suggestions'}`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredAssets.map(asset => {
                                        const selected = isAssetSelected(asset);
                                        return (
                                            <button
                                                key={asset.id}
                                                type="button"
                                                onClick={() => handleAssetToggle(asset)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selected
                                                    ? 'bg-primary/10 border-primary'
                                                    : 'bg-background border-border hover:bg-muted/50 hover:border-muted-foreground/30'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected
                                                    ? 'bg-primary border-primary'
                                                    : 'border-border'
                                                    }`}>
                                                    {selected && (
                                                        <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {getAssetIcon(asset.type)}
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {asset.title}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(asset.status)}`}>
                                                    {asset.status}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
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