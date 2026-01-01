// ============================================
// FILE: components/shared/BulkActionBar/types.ts
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

export type AssetType = 
    | 'testCases' | 'bugs' | 'documents' | 'recordings' 
    | 'recommendations' | 'sprints' | 'archive' | 'testRuns' 
    | 'trash' | 'testData' | 'reports' | 'schedules';

export interface BulkActionsBarProps {
    selectedItems?: string[];
    onClearSelection: () => void;
    assetType?: AssetType | null;
    actionGroups?: ActionGroup[];
    onAction: (
        actionId: string, 
        selectedIds: string[], 
        actionConfig: BulkAction, 
        selectedOption?: ActionOption | null
    ) => Promise<void>;
    portalId?: string;
    loadingActions?: string[];
}

export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: 'error' | 'warning';
}

export interface TooltipProps {
    children: React.ReactNode;
    text: string;
    disabled?: boolean;
}

export interface ActionDropdownProps {
    action: BulkAction;
    onSelect: (actionId: string, option: ActionOption) => void;
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
    disabled?: boolean;
}