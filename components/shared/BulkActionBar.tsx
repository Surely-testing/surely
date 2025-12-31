// ============================================
// FILE: components/shared/BulkActionBar.tsx
// Modern, type-safe bulk actions with theme system
// ============================================
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Trash2, Archive, Download, Play, CheckCircle, XCircle, RotateCcw,
    FileText, TestTube, Video, BarChart3, Lightbulb,
    Shield, RefreshCw, Eye, Users, Database, FolderOpen,
    GitBranch, Move, Copy, Star, Lock, Unlock, Mail, Bell,
    Calendar, Clock, Flag, Target, Link2, Bookmark, ChevronDown, X,
    AlertTriangle, Layers, type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================
// Types - EXPORTED
// ============================================
export type ActionOption = {
    value: any;
    id: string;
    label: string;
    data?: any;
};

export type BulkAction = {
    id: string;
    label: string;
    icon: string;
    color?: string;
    type?: 'button' | 'select';
    destructive?: boolean;
    requiresConfirm?: boolean;
    confirmMessage?: string;
    options?: ActionOption[];
};

export type ActionGroup = {
    name: string;
    actions: BulkAction[];
};

export type AssetType = 'testCases' | 'bugs' | 'documents' | 'recordings' | 'recommendations' | 'sprints' | 'archive' | 'testRuns' | 'trash' | 'testData' | 'reports' | 'schedules';

export interface BulkActionsBarProps {
    selectedItems?: string[];
    onClearSelection: () => void;
    assetType?: AssetType | null;
    actionGroups?: ActionGroup[];
    onAction: (actionId: string, selectedIds: string[], actionConfig: BulkAction, selectedOption?: ActionOption | null) => Promise<void>;
    portalId?: string;
    loadingActions?: string[];
}

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: 'error' | 'warning';
}

interface TooltipProps {
    children: React.ReactNode;
    text: string;
    disabled?: boolean;
}

interface ActionDropdownProps {
    action: BulkAction;
    onSelect: (actionId: string, option: ActionOption) => void;
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
    disabled?: boolean;
}

// ============================================
// Icon mapping
// ============================================
const ICONS: Record<string, LucideIcon> = {
    Trash2, Archive, Download, Play, CheckCircle, XCircle,
    RotateCcw, FileText, TestTube, Video, BarChart3,
    Lightbulb, Target, Shield, RefreshCw, Eye, Users, Database,
    FolderOpen, GitBranch, Move, Copy, Star, Lock, Unlock,
    Mail, Bell, Calendar, Clock, Flag, Link2, Bookmark,
    ChevronDown, X, Layers
};

// ============================================
// Confirmation Dialog Component
// ============================================
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    confirmColor = "error"
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 border border-border animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                        confirmColor === 'error' ? 'bg-error/10' : 'bg-warning/10'
                    )}>
                        <AlertTriangle className={cn(
                            "w-6 h-6",
                            confirmColor === 'error' ? 'text-error' : 'text-warning'
                        )} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all",
                            confirmColor === 'error'
                                ? 'bg-error hover:bg-error/90 focus:ring-error'
                                : 'bg-warning hover:bg-warning/90 focus:ring-warning'
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ============================================
// Tooltip Component
// ============================================
const Tooltip: React.FC<TooltipProps> = ({ children, text, disabled = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    if (disabled) return <>{children}</>;

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 text-xs text-gray-800 bg-foreground rounded-lg whitespace-nowrap z-50 animate-in fade-in text-white slide-in-from-bottom-1 duration-150">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                </div>
            )}
        </div>
    );
};

// ============================================
// Dropdown Component
// ============================================
const ActionDropdown: React.FC<ActionDropdownProps> = ({
    action,
    onSelect,
    isOpen,
    onToggle,
    disabled
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const ActionIcon = ICONS[action.icon] || TestTube;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onToggle(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onToggle]);

    const hasOptions = action.options && action.options.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <Tooltip text={action.label} disabled={isOpen}>
                <button
                    onClick={() => onToggle(!isOpen)}
                    disabled={disabled || !hasOptions}
                    className={cn(
                        "inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 relative",
                        "text-foreground bg-card border border-border",
                        "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    <ActionIcon className="w-4 h-4" />
                    <ChevronDown className={cn(
                        "w-3 h-3 absolute -bottom-0.5 -right-0.5 bg-card rounded-full border border-border transition-transform duration-200",
                        isOpen && 'rotate-180'
                    )} />
                </button>
            </Tooltip>

            {isOpen && hasOptions && (
                <div className="absolute bottom-full mb-2 left-0 w-56 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="py-1">
                        {action.options!.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onSelect(action.id, option)}
                                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// Generate Action Configs
// ============================================
const generateAssetActionConfig = (
    assetType: AssetType,
    sprints: any[] = [],
    users: any[] = [],
    modules: any[] = [],
    bugs: any[] = []
): { groups: ActionGroup[] } => {
    const sprintOptions: ActionOption[] = sprints.map(sprint => ({
        id: sprint.id,
        value: sprint.id,
        label: sprint.name,
        data: sprint
    }));

    const userOptions: ActionOption[] = users.map(user => ({
        id: user.id || user.uid,
        value: user.id || user.uid,
        label: user.displayName || user.name || user.email,
        data: user
    }));

    const moduleOptions: ActionOption[] = modules.map(module => ({
        id: module.id,
        label: module.name,
        value: module.id,
        data: module
    }));

    const bugOptions: ActionOption[] = bugs.map(bug => ({
        id: bug.id,
        value: bug.id,
        label: bug.title,
        data: bug
    }));

    const groupingOptions: ActionOption[] = [
        { id: 'sprint', value: 'sprint', label: 'Group by Sprint' },  // FIXED
        { id: 'module', value: 'module', label: 'Group by Module/Feature' },  // FIXED
        { id: 'date', value: 'date', label: 'Group by Date' },  // FIXED
        { id: 'category', value: 'category', label: 'Group by Category' },  // FIXED
        { id: 'status', value: 'status', label: 'Group by Status' },  // FIXED
        { id: 'priority', value: 'priority', label: 'Group by Priority' }  // FIXED
    ];

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
                        ...(sprintOptions.length > 0 ? [{
                            id: 'add-to-sprint',
                            label: 'Add to Sprint',
                            icon: 'Target',
                            type: 'select' as const,
                            options: sprintOptions
                        }] : []),
                        ...(moduleOptions.length > 0 ? [{
                            id: 'add-to-module',
                            label: 'Add to Module',
                            icon: 'FolderOpen',
                            type: 'select' as const,
                            options: moduleOptions
                        }] : []),
                        ...(userOptions.length > 0 ? [{
                            id: 'assign',
                            label: 'Assign',
                            icon: 'Users',
                            type: 'select' as const,
                            options: userOptions
                        }] : []),
                        {
                            id: 'group',
                            label: 'Group Items',
                            icon: 'Layers',
                            type: 'select' as const,
                            options: groupingOptions
                        }
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
                        ...(userOptions.length > 0 ? [{
                            id: 'assign',
                            label: 'Assign',
                            icon: 'Users',
                            type: 'select' as const,
                            options: userOptions
                        }] : []),
                        {
                            id: 'severity',
                            label: 'Set Severity',
                            icon: 'Flag',
                            type: 'select' as const,
                            options: [
                                { id: 'critical', value: 'critical', label: 'Critical' },  // FIXED
                                { id: 'high', value: 'high', label: 'High' },  // FIXED
                                { id: 'medium', value: 'medium', label: 'Medium' },  // FIXED
                                { id: 'low', value: 'low', label: 'Low' }  // FIXED
                            ]
                        }
                    ]
                },
                {
                    name: 'organization',
                    actions: [
                        ...(sprintOptions.length > 0 ? [{
                            id: 'add-to-sprint',
                            label: 'Add to Sprint',
                            icon: 'Target',
                            type: 'select' as const,
                            options: sprintOptions
                        }] : []),
                        {
                            id: 'group',
                            label: 'Group Items',
                            icon: 'Layers',
                            type: 'select' as const,
                            options: groupingOptions
                        }
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
                    name: 'type',
                    actions: [
                        {
                            id: 'change-type',
                            label: 'Change Type',
                            icon: 'FileText',
                            type: 'select' as const,
                            options: [
                                { id: 'meeting_notes', value: 'meeting_notes', label: '📝 Meeting Notes' },
                                { id: 'test_plan', value: 'test_plan', label: '📋 Test Plan' },
                                { id: 'test_strategy', value: 'test_strategy', label: '🎯 Test Strategy' },
                                { id: 'brainstorm', value: 'brainstorm', label: '💡 Brainstorm' },
                                { id: 'general', value: 'general', label: '📄 General' }
                            ]
                        }
                    ]
                },
                {
                    name: 'organization',
                    actions: [
                        ...(sprintOptions.length > 0 ? [{
                            id: 'move-to-suite',
                            label: 'Move to Suite',
                            icon: 'FolderOpen',
                            type: 'select' as const,
                            options: sprintOptions  // Reuse for suites or create suiteOptions
                        }] : []),
                        {
                            id: 'duplicate',
                            label: 'Duplicate',
                            icon: 'Copy'
                        },
                        {
                            id: 'bookmark',
                            label: 'Bookmark',
                            icon: 'Bookmark'
                        }
                    ]
                },
                {
                    name: 'sharing',
                    actions: [
                        {
                            id: 'share',
                            label: 'Share',
                            icon: 'Link2'
                        },
                        {
                            id: 'export',
                            label: 'Export',
                            icon: 'Download',
                            type: 'select' as const,
                            options: [
                                { id: 'pdf', value: 'pdf', label: 'Export as PDF' },
                                { id: 'markdown', value: 'markdown', label: 'Export as Markdown' },
                                { id: 'docx', value: 'docx', label: 'Export as Word' },
                                { id: 'html', value: 'html', label: 'Export as HTML' }
                            ]
                        }
                    ]
                },
                {
                    name: 'status',
                    actions: [
                        {
                            id: 'lock',
                            label: 'Lock',
                            icon: 'Lock'
                        },
                        {
                            id: 'unlock',
                            label: 'Unlock',
                            icon: 'Unlock'
                        },
                        {
                            id: 'archive',
                            label: 'Archive',
                            icon: 'Archive',
                            requiresConfirm: true,
                            confirmMessage: 'Archive selected documents?'
                        }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        {
                            id: 'delete',
                            label: 'Delete',
                            icon: 'Trash2',
                            destructive: true,
                            confirmMessage: 'Delete selected documents? This action cannot be undone.'
                        }
                    ]
                }
            ]
        },

        reports: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        {
                            id: 'regenerate',
                            label: 'Regenerate',
                            icon: 'RefreshCw'
                        },
                        {
                            id: 'download',
                            label: 'Download',
                            icon: 'Download'
                        },
                        {
                            id: 'share',
                            label: 'Share',
                            icon: 'Link2'
                        },
                        {
                            id: 'archive',
                            label: 'Archive',
                            icon: 'Archive',
                            requiresConfirm: true,
                            confirmMessage: 'Archive selected reports?'
                        },
                        {
                            id: 'delete',
                            label: 'Delete',
                            icon: 'Trash2',
                            destructive: true,
                            confirmMessage: 'Delete selected reports? This action cannot be undone.'
                        }
                    ]
                }
            ]
        },

        schedules: {
            groups: [
                {
                    name: 'status',
                    actions: [
                        {
                            id: 'enable',
                            label: 'Enable',
                            icon: 'CheckCircle'
                        },
                        {
                            id: 'disable',
                            label: 'Disable',
                            icon: 'XCircle'
                        }
                    ]
                },
                {
                    name: 'execution',
                    actions: [
                        {
                            id: 'run-now',
                            label: 'Run Now',
                            icon: 'Play'
                        },
                        {
                            id: 'set-frequency',
                            label: 'Set Frequency',
                            icon: 'Clock',
                            type: 'select' as const,
                            options: [
                                { id: 'daily', value: 'daily', label: 'Daily' },
                                { id: 'weekly', value: 'weekly', label: 'Weekly' },
                                { id: 'monthly', value: 'monthly', label: 'Monthly' },
                                { id: 'custom', value: 'custom', label: 'Custom' }
                            ]
                        }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        {
                            id: 'archive',
                            label: 'Archive',
                            icon: 'Archive',
                            requiresConfirm: true,
                            confirmMessage: 'Archive selected schedules?'
                        },
                        {
                            id: 'delete',
                            label: 'Delete',
                            icon: 'Trash2',
                            destructive: true,
                            confirmMessage: 'Delete selected schedules? This will stop all future report generation.'
                        }
                    ]
                }
            ]
        },

        recordings: {
            groups: [
                {
                    name: 'playback',
                    actions: [
                        { id: 'download', label: 'Download', icon: 'Download' },
                        { id: 'share', label: 'Share', icon: 'Link2' }
                    ]
                },
                {
                    name: 'linking',
                    actions: [
                        ...(bugOptions.length > 0 ? [{
                            id: 'link-to-bug',
                            label: 'Link to Bug',
                            icon: 'Link2',
                            type: 'select' as const,
                            options: bugOptions
                        }] : [])
                    ]
                },
                {
                    name: 'organization',
                    actions: [
                        { id: 'bookmark', label: 'Bookmark', icon: 'Bookmark' },
                        {
                            id: 'group',
                            label: 'Group Items',
                            icon: 'Layers',
                            type: 'select' as const,
                            options: groupingOptions
                        }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected recordings?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected recordings?' }
                    ]
                }
            ]
        },

        testData: {
            groups: [
                {
                    name: 'actions',
                    actions: [
                        {
                            id: 'delete',
                            label: 'Delete',
                            icon: 'Trash2',
                            destructive: true,
                            requiresConfirm: true,
                            confirmMessage: 'Are you sure you want to delete the selected test data? This action cannot be undone.'
                        }
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
                        { id: 'reject', label: 'Reject', icon: 'XCircle' },
                        { id: 'review', label: 'Mark for Review', icon: 'Eye' }
                    ]
                },
                {
                    name: 'implementation',
                    actions: [
                        ...(sprintOptions.length > 0 ? [{
                            id: 'add-to-sprint',
                            label: 'Add to Sprint',
                            icon: 'Target',
                            type: 'select' as const,
                            options: sprintOptions
                        }] : []),
                        {
                            id: 'priority',
                            label: 'Set Priority',
                            icon: 'Flag',
                            type: 'select' as const,
                            options: [
                                { id: 'critical', value: 'critical', label: 'Critical' },  // FIXED
                                { id: 'high', value: 'high', label: 'High' },  // FIXED
                                { id: 'medium', value: 'medium', label: 'Medium' },  // FIXED
                                { id: 'low', value: 'low', label: 'Low' }  // FIXED
                            ]
                        }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected recommendations?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected recommendations?' }
                    ]
                }
            ]
        },

        sprints: {
            groups: [
                {
                    name: 'status',
                    actions: [
                        { id: 'start', label: 'Start Sprint', icon: 'Play' },
                        { id: 'complete', label: 'Complete Sprint', icon: 'CheckCircle' },
                        { id: 'close', label: 'Close Sprint', icon: 'XCircle' }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected sprints?' },
                        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected sprints?' }
                    ]
                }
            ]
        },

        archive: {
            groups: [
                {
                    name: 'restore',
                    actions: [
                        { id: 'restore', label: 'Restore', icon: 'RotateCcw' },
                        ...(sprintOptions.length > 0 ? [{
                            id: 'restore-to-sprint',
                            label: 'Restore to Sprint',
                            icon: 'Target',
                            type: 'select' as const,
                            options: sprintOptions
                        }] : [])
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', destructive: true, confirmMessage: 'Permanently delete selected items? This cannot be undone.' }
                    ]
                }
            ]
        },
        testRuns: {
            groups: [
                {
                    name: 'execution',
                    actions: [
                        {
                            id: 'execute',
                            label: 'Start Execution',
                            icon: 'Play'
                        },
                        {
                            id: 'complete',
                            label: 'Mark Complete',
                            icon: 'CheckCircle'
                        },
                        {
                            id: 'abort',
                            label: 'Abort',
                            icon: 'XCircle',
                            requiresConfirm: true,
                            confirmMessage: 'Abort selected test runs?'
                        }
                    ]
                },
                {
                    name: 'status',
                    actions: [
                        {
                            id: 'set-status',
                            label: 'Set Status',
                            icon: 'Flag',
                            type: 'select' as const,
                            options: [
                                { id: 'pending', value: 'pending', label: 'Pending' },
                                { id: 'in-progress', value: 'in-progress', label: 'In Progress' },
                                { id: 'passed', value: 'passed', label: 'Passed' },
                                { id: 'failed', value: 'failed', label: 'Failed' },
                                { id: 'blocked', value: 'blocked', label: 'Blocked' },
                                { id: 'skipped', value: 'skipped', label: 'Skipped' }
                            ]
                        }
                    ]
                },
                {
                    name: 'assignment',
                    actions: [
                        ...(userOptions.length > 0 ? [{
                            id: 'assign',
                            label: 'Assign',
                            icon: 'Users',
                            type: 'select' as const,
                            options: userOptions
                        }] : [])
                    ]
                },
                {
                    name: 'organization',
                    actions: [
                        ...(sprintOptions.length > 0 ? [{
                            id: 'add-to-sprint',
                            label: 'Add to Sprint',
                            icon: 'Target',
                            type: 'select' as const,
                            options: sprintOptions
                        }] : []),
                        {
                            id: 'set-environment',
                            label: 'Set Environment',
                            icon: 'Settings',
                            type: 'select' as const,
                            options: [
                                { id: 'dev', value: 'development', label: 'Development' },
                                { id: 'staging', value: 'staging', label: 'Staging' },
                                { id: 'qa', value: 'qa', label: 'QA' },
                                { id: 'prod', value: 'production', label: 'Production' }
                            ]
                        }
                    ]
                },
                {
                    name: 'data',
                    actions: [
                        {
                            id: 'export',
                            label: 'Export Results',
                            icon: 'Download'
                        },
                        {
                            id: 'generate-report',
                            label: 'Generate Report',
                            icon: 'FileText'
                        }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        {
                            id: 'archive',
                            label: 'Archive',
                            icon: 'Archive',
                            requiresConfirm: true,
                            confirmMessage: 'Archive selected test runs?'
                        },
                        {
                            id: 'delete',
                            label: 'Delete',
                            icon: 'Trash2',
                            destructive: true,
                            confirmMessage: 'Delete selected test runs? This will also delete all test results.'
                        }
                    ]
                }
            ]
        },

        trash: {
            groups: [
                {
                    name: 'restore',
                    actions: [
                        { id: 'restore', label: 'Restore', icon: 'RotateCcw' }
                    ]
                },
                {
                    name: 'actions',
                    actions: [
                        { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', destructive: true, confirmMessage: 'Permanently delete selected items? This cannot be undone.' }
                    ]
                }
            ]
        }
    };

    return configs[assetType] || { groups: [] };
};

// ============================================
// Main Component
// ============================================
export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedItems = [],
    onClearSelection,
    assetType = null,
    actionGroups = [],
    onAction,
    portalId = 'bulk-actions-portal',
    loadingActions = [],
}) => {
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        action: string | null;
        config: BulkAction | null;
        option: ActionOption | null;
    }>({
        isOpen: false,
        action: null,
        config: null,
        option: null
    });

    // Setup portal container
    useEffect(() => {
        let container = document.getElementById(portalId);
        if (!container) {
            container = document.createElement('div');
            container.id = portalId;
            container.className = 'fixed inset-x-0 bottom-8 pointer-events-none z-50 flex items-center justify-center';
            document.body.appendChild(container);
        }
        setPortalContainer(container);

        return () => {
            const existingContainer = document.getElementById(portalId);
            if (existingContainer && existingContainer.children.length === 0) {
                document.body.removeChild(existingContainer);
            }
        };
    }, [portalId]);

    // Generate config
    const config = useMemo(() => {
        if (actionGroups.length > 0) {
            return { groups: actionGroups };
        }

        if (assetType) {
            // In a real app, fetch these from context or props
            return generateAssetActionConfig(assetType, [], [], [], []);
        }

        return { groups: [] };
    }, [assetType, actionGroups]);

    if (!portalContainer || config.groups.length === 0 || selectedItems.length === 0) {
        return null;
    }

    const handleAction = async (actionId: string, actionConfig: BulkAction, selectedOption: ActionOption | null = null) => {
        const requiresConfirm = actionConfig.requiresConfirm || actionConfig.destructive;

        if (requiresConfirm) {
            setConfirmDialog({
                isOpen: true,
                action: actionId,
                config: actionConfig,
                option: selectedOption
            });
            return;
        }

        await executeAction(actionId, actionConfig, selectedOption);
    };

    const executeAction = async (actionId: string, actionConfig: BulkAction, selectedOption: ActionOption | null = null) => {
        try {
            await onAction(actionId, selectedItems, actionConfig, selectedOption);
            onClearSelection();
            setOpenDropdowns({});
        } catch (error) {
            console.error('Action execution failed:', error);
        }
    };

    const handleConfirmDialogConfirm = async () => {
        const { action, config, option } = confirmDialog;
        if (!action || !config) return;

        setConfirmDialog({ isOpen: false, action: null, config: null, option: null });
        await executeAction(action, config, option);
    };

    const handleConfirmDialogClose = () => {
        setConfirmDialog({ isOpen: false, action: null, config: null, option: null });
    };

    const handleDropdownSelect = (actionId: string, selectedOption: ActionOption) => {
        const action = config.groups
            .flatMap(group => group.actions)
            .find(act => act.id === actionId);

        if (action) {
            handleAction(actionId, action, selectedOption);
        }

        setOpenDropdowns(prev => ({ ...prev, [actionId]: false }));
    };

    const handleDropdownToggle = (actionId: string, isOpen: boolean) => {
        setOpenDropdowns(prev => ({ ...prev, [actionId]: isOpen }));
    };

    const handleCancel = () => {
        onClearSelection();
        setOpenDropdowns({});
    };

    return createPortal(
        <>
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleConfirmDialogClose}
                onConfirm={handleConfirmDialogConfirm}
                title={confirmDialog.config?.destructive ? "Confirm Deletion" : "Confirm Action"}
                message={confirmDialog.config?.confirmMessage || "Are you sure you want to proceed with this action?"}
                confirmText={confirmDialog.config?.destructive ? "Delete" : "Confirm"}
                confirmColor={confirmDialog.config?.destructive ? "error" : "warning"}
            />

            <div className="pointer-events-auto mx-2 sm:mx-4">
                <div className="bg-card border border-border rounded-xl shadow-xl px-4 py-3 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between gap-4">
                        {/* Selection Count */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground whitespace-nowrap">
                                <span className="hidden sm:inline">{selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected</span>
                                <span className="inline sm:hidden">({selectedItems.length})</span>
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className={cn(
                            "flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style]:none [scrollbar-width]:none"
                        )}>
                            {config.groups.map((group, groupIndex) => (
                                <React.Fragment key={group.name || groupIndex}>
                                    <div className="flex items-center gap-2">
                                        {group.actions.map((action) => {
                                            const ActionIcon = ICONS[action.icon] || TestTube;
                                            const isLoading = loadingActions.includes(action.id);

                                            if (action.type === 'select') {
                                                return (
                                                    <ActionDropdown
                                                        key={action.id}
                                                        action={action}
                                                        onSelect={handleDropdownSelect}
                                                        isOpen={openDropdowns[action.id] || false}
                                                        onToggle={(isOpen) => handleDropdownToggle(action.id, isOpen)}
                                                        disabled={isLoading}
                                                    />
                                                );
                                            }

                                            return (
                                                <Tooltip key={action.id} text={action.label}>
                                                    <button
                                                        onClick={() => handleAction(action.id, action)}
                                                        disabled={isLoading}
                                                        className={cn(
                                                            "inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                                                            "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                                            "disabled:opacity-50 disabled:cursor-not-allowed",
                                                            action.destructive || action.requiresConfirm
                                                                ? 'text-error border border-error/30 hover:bg-error/10 focus:ring-error'
                                                                : 'text-foreground bg-card border border-border hover:bg-muted focus:ring-primary'
                                                        )}
                                                    >
                                                        <ActionIcon className={cn(
                                                            "w-4 h-4",
                                                            isLoading && 'animate-spin'
                                                        )} />
                                                    </button>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>

                                    {groupIndex < config.groups.length - 1 && (
                                        <div className="w-px h-6 bg-border" />
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Cancel Button */}
                            <div className="w-px h-6 bg-border ml-2" />
                            <Tooltip text="Cancel selection">
                                <button
                                    onClick={handleCancel}
                                    className="w-9 h-9 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        portalContainer
    );
};

export default BulkActionsBar;