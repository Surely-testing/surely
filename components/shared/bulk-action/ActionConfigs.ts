// ============================================
// FILE: components/shared/BulkActionBar/actionConfigs.ts
// All action configurations for different asset types
// ============================================

import type { AssetType, ActionGroup, ActionOption } from './types';

// Helper to create options
const createOptions = (items: any[], labelKey = 'name') => 
    items.map(item => ({
        id: item.id,
        value: item.id,
        label: item[labelKey] || item.displayName || item.email,
        data: item
    }));

// Common option sets
const groupingOptions: ActionOption[] = [
    { id: 'sprint', value: 'sprint', label: 'Group by Sprint' },
    { id: 'module', value: 'module', label: 'Group by Module/Feature' },
    { id: 'date', value: 'date', label: 'Group by Date' },
    { id: 'status', value: 'status', label: 'Group by Status' },
    { id: 'priority', value: 'priority', label: 'Group by Priority' }
];

const priorityOptions: ActionOption[] = [
    { id: 'critical', value: 'critical', label: 'Critical' },
    { id: 'high', value: 'high', label: 'High' },
    { id: 'medium', value: 'medium', label: 'Medium' },
    { id: 'low', value: 'low', label: 'Low' }
];

export const generateAssetActionConfig = (
    assetType: AssetType,
    sprints: any[] = [],
    users: any[] = [],
    modules: any[] = [],
    bugs: any[] = []
): { groups: ActionGroup[] } => {
    const sprintOpts = createOptions(sprints);
    const userOpts = createOptions(users, 'displayName');
    const moduleOpts = createOptions(modules);
    const bugOpts = createOptions(bugs, 'title');

    const configs: Record<AssetType, { groups: ActionGroup[] }> = {
        testCases: {
            groups: [
                {
                    name: 'execution',
                    actions: [
                        { id: 'pass', label: 'Pass', icon: 'CheckCircle' },
                        { id: 'fail', label: 'Fail', icon: 'XCircle' },
                        { id: 'block', label: 'Block', icon: 'Shield' }
                    ]
                },
                {
                    name: 'test',
                    actions: [
                        { id: 'run', label: 'Run', icon: 'Play' },
                        { id: 'reset', label: 'Reset', icon: 'RefreshCw' }
                    ]
                },
                {
                    name: 'organization',
                    actions: [
                        ...(sprintOpts.length > 0 ? [{ id: 'add-to-sprint', label: 'Add to Sprint', icon: 'Target', type: 'select' as const, options: sprintOpts }] : []),
                        ...(moduleOpts.length > 0 ? [{ id: 'add-to-module', label: 'Add to Module', icon: 'FolderOpen', type: 'select' as const, options: moduleOpts }] : []),
                        ...(userOpts.length > 0 ? [{ id: 'assign', label: 'Assign', icon: 'Users', type: 'select' as const, options: userOpts }] : []),
                        { id: 'group', label: 'Group Items', icon: 'Layers', type: 'select' as const, options: groupingOptions }
                    ]
                },
                {
                    name: 'status',
                    actions: [
                        { id: 'activate', label: 'Activate', icon: 'Eye' },
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected test cases?' }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected test cases?' }
                    ]
                }
            ]
        },

        bugs: {
            groups: [
                {
                    name: 'status',
                    actions: [
                        { id: 'open', label: 'Reopen', icon: 'RotateCcw' },
                        { id: 'resolve', label: 'Resolve', icon: 'CheckCircle' },
                        { id: 'close', label: 'Close', icon: 'XCircle' }
                    ]
                },
                {
                    name: 'assignment',
                    actions: [
                        ...(userOpts.length > 0 ? [{ id: 'assign', label: 'Assign', icon: 'Users', type: 'select' as const, options: userOpts }] : []),
                        { id: 'severity', label: 'Set Severity', icon: 'Flag', type: 'select' as const, options: priorityOptions }
                    ]
                },
                {
                    name: 'organization',
                    actions: [
                        ...(sprintOpts.length > 0 ? [{ id: 'add-to-sprint', label: 'Add to Sprint', icon: 'Target', type: 'select' as const, options: sprintOpts }] : []),
                        { id: 'group', label: 'Group Items', icon: 'Layers', type: 'select' as const, options: groupingOptions }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected bugs?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected bugs?' }
                    ]
                }
            ]
        },

        documents: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'share', label: 'Share', icon: 'Link2' },
                        { id: 'duplicate', label: 'Duplicate', icon: 'Copy' },
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected documents?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected documents?' }
                    ]
                }
            ]
        },

        recordings: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'download', label: 'Download', icon: 'Download' },
                        { id: 'share', label: 'Share', icon: 'Link2' },
                        ...(bugOpts.length > 0 ? [{ id: 'link-to-bug', label: 'Link to Bug', icon: 'Link2', type: 'select' as const, options: bugOpts }] : []),
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected recordings?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected recordings?' }
                    ]
                }
            ]
        },

        recommendations: {
            groups: [
                {
                    name: 'status',
                    actions: [
                        { id: 'approve', label: 'Approve', icon: 'CheckCircle' },
                        { id: 'reject', label: 'Reject', icon: 'XCircle' }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        ...(sprintOpts.length > 0 ? [{ id: 'add-to-sprint', label: 'Add to Sprint', icon: 'Target', type: 'select' as const, options: sprintOpts }] : []),
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected recommendations?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected recommendations?' }
                    ]
                }
            ]
        },

        sprints: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'complete', label: 'Complete', icon: 'CheckCircle' },
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected sprints?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected sprints?' }
                    ]
                }
            ]
        },

        archive: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'restore', label: 'Restore', icon: 'RotateCcw' },
                        { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', destructive: true, confirmMessage: 'Permanently delete? This cannot be undone.' }
                    ]
                }
            ]
        },

        testRuns: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'execute', label: 'Execute', icon: 'Play' },
                        { id: 'abort', label: 'Abort', icon: 'XCircle', requiresConfirm: true },
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true }
                    ]
                }
            ]
        },

        trash: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'restore', label: 'Restore', icon: 'RotateCcw' },
                        { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', destructive: true }
                    ]
                }
            ]
        },

        testData: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete test data? This cannot be undone.' }
                    ]
                }
            ]
        },

        reports: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'regenerate', label: 'Regenerate', icon: 'RefreshCw' },
                        { id: 'download', label: 'Download', icon: 'Download' },
                        { id: 'share', label: 'Share', icon: 'Link2' },
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true }
                    ]
                }
            ]
        },

        schedules: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        { id: 'enable', label: 'Enable', icon: 'CheckCircle' },
                        { id: 'disable', label: 'Disable', icon: 'XCircle' },
                        { id: 'run-now', label: 'Run Now', icon: 'Play' },
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true }
                    ]
                }
            ]
        }
    };

    return configs[assetType] || { groups: [] };
};