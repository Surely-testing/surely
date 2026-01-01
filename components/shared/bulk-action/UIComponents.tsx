// ============================================
// FILE: components/shared/BulkActionBar/UIComponents.tsx
// Reusable UI pieces
// ============================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, AlertTriangle, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ICONS } from './constants';
import type { ConfirmDialogProps, TooltipProps, ActionDropdownProps } from './types';

// Confirmation Dialog
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, onClose, onConfirm, title, message,
    confirmText = "Confirm", confirmColor = "error"
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

// Tooltip - FIXED: Portal to body and proper z-index
export const Tooltip: React.FC<TooltipProps> = ({ children, text, disabled = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top - 8, // 8px above the element
                left: rect.left + rect.width / 2
            });
        }
    }, [isVisible]);

    if (disabled) return <>{children}</>;

    const tooltipContent = isVisible && (
        <div 
            className="fixed pointer-events-none z-[10000]"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translate(-50%, -100%)'
            }}
        >
            <div className="px-2 py-1.5 text-xs text-white bg-gray-900 rounded-lg whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
                {text}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </div>
        </div>
    );

    return (
        <>
            <div
                ref={triggerRef}
                className="relative inline-block"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children}
            </div>
            {isVisible && createPortal(tooltipContent, document.body)}
        </>
    );
};

// Action Dropdown
export const ActionDropdown: React.FC<ActionDropdownProps> = ({
    action, onSelect, isOpen, onToggle, disabled
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const ActionIcon = ICONS[action.icon] || TestTube;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onToggle(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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