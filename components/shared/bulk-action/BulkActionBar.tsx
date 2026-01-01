// ============================================
// FILE: components/shared/BulkActionBar/BulkActionsBar.tsx
// Main component - simplified
// ============================================
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ICONS } from './constants';
import { ConfirmDialog, Tooltip, ActionDropdown } from './UIComponents';
import { generateAssetActionConfig } from './ActionConfigs';
import type { BulkActionsBarProps, BulkAction, ActionOption } from './types';

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
    }>({ isOpen: false, action: null, config: null, option: null });

    // Setup portal
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
            const existing = document.getElementById(portalId);
            if (existing && existing.children.length === 0) {
                document.body.removeChild(existing);
            }
        };
    }, [portalId]);

    // Generate config
    const config = useMemo(() => {
        if (actionGroups.length > 0) return { groups: actionGroups };
        if (assetType) return generateAssetActionConfig(assetType, [], [], [], []);
        return { groups: [] };
    }, [assetType, actionGroups]);

    if (!portalContainer || config.groups.length === 0 || selectedItems.length === 0) {
        return null;
    }

    const executeAction = async (actionId: string, actionConfig: BulkAction, selectedOption: ActionOption | null = null) => {
        try {
            await onAction(actionId, selectedItems, actionConfig, selectedOption);
            onClearSelection();
            setOpenDropdowns({});
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    const handleAction = async (actionId: string, actionConfig: BulkAction, selectedOption: ActionOption | null = null) => {
        if (actionConfig.requiresConfirm || actionConfig.destructive) {
            setConfirmDialog({ isOpen: true, action: actionId, config: actionConfig, option: selectedOption });
            return;
        }
        await executeAction(actionId, actionConfig, selectedOption);
    };

    return createPortal(
        <>
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, action: null, config: null, option: null })}
                onConfirm={async () => {
                    const { action, config, option } = confirmDialog;
                    if (action && config) {
                        setConfirmDialog({ isOpen: false, action: null, config: null, option: null });
                        await executeAction(action, config, option);
                    }
                }}
                title={confirmDialog.config?.destructive ? "Confirm Deletion" : "Confirm Action"}
                message={confirmDialog.config?.confirmMessage || "Are you sure?"}
                confirmText={confirmDialog.config?.destructive ? "Delete" : "Confirm"}
                confirmColor={confirmDialog.config?.destructive ? "error" : "warning"}
            />

            <div className="pointer-events-auto mx-2 sm:mx-4">
                <div className="bg-card border border-border rounded-xl shadow-xl px-4 py-3 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">
                            <span className="hidden sm:inline">{selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected</span>
                            <span className="inline sm:hidden">({selectedItems.length})</span>
                        </span>

                        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
                                                        onSelect={(actionId, option) => {
                                                            const act = config.groups.flatMap(g => g.actions).find(a => a.id === actionId);
                                                            if (act) handleAction(actionId, act, option);
                                                            setOpenDropdowns(prev => ({ ...prev, [actionId]: false }));
                                                        }}
                                                        isOpen={openDropdowns[action.id] || false}
                                                        onToggle={(isOpen) => setOpenDropdowns(prev => ({ ...prev, [action.id]: isOpen }))}
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
                                                            "focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
                                                            action.destructive || action.requiresConfirm
                                                                ? 'text-error border border-error/30 hover:bg-error/10 focus:ring-error'
                                                                : 'text-foreground bg-card border border-border hover:bg-muted focus:ring-primary'
                                                        )}
                                                    >
                                                        <ActionIcon className={cn("w-4 h-4", isLoading && 'animate-spin')} />
                                                    </button>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                    {groupIndex < config.groups.length - 1 && <div className="w-px h-6 bg-border" />}
                                </React.Fragment>
                            ))}

                            <div className="w-px h-6 bg-border ml-2" />
                            <Tooltip text="Cancel selection">
                                <button
                                    onClick={() => {
                                        onClearSelection();
                                        setOpenDropdowns({});
                                    }}
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

// Re-export types
export type { BulkActionsBarProps, BulkAction, ActionGroup, ActionOption, AssetType } from './types';