// ============================================
// FILE: components/bugs/BugDrawerHeader.tsx
// Header component with title, status, and tabs
// ============================================
'use client'

import React from 'react'
import { 
    X, Share2, Check, ExternalLink, FileText, Copy, 
    Clock, User, Eye, MessageSquare, TrendingUp, AlertTriangle, Info 
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import type { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types'

interface BugDrawerHeaderProps {
    bug: BugWithCreator
    formData: any
    tabs: any[]
    activeTab: string
    setActiveTab: (tab: string) => void
    isFullscreen: boolean
    setIsFullscreen: (value: boolean) => void
    showShareSuccess: boolean
    shareTooltip: string
    handleShareBug: () => void
    onClose: () => void
    comments: any[]
    activities: any[]
}

export function BugDrawerHeader({
    bug,
    formData,
    tabs,
    activeTab,
    setActiveTab,
    isFullscreen,
    setIsFullscreen,
    showShareSuccess,
    shareTooltip,
    handleShareBug,
    onClose,
    comments,
    activities
}: BugDrawerHeaderProps) {
    
    const getSeverityColor = (severity: BugSeverity | null | undefined) => {
        const colors = {
            critical: 'bg-destructive text-destructive-foreground',
            high: 'bg-warning text-warning-foreground',
            medium: 'bg-info text-info-foreground',
            low: 'bg-success text-success-foreground',
        }
        return colors[severity as keyof typeof colors] || 'bg-muted text-muted-foreground'
    }

    const getStatusColor = (status: BugStatus | null | undefined) => {
        const colors = {
            open: 'bg-destructive text-destructive-foreground',
            in_progress: 'bg-info text-info-foreground',
            resolved: 'bg-success text-success-foreground',
            closed: 'bg-muted text-muted-foreground',
        }
        return colors[status as keyof typeof colors] || 'bg-info text-info-foreground'
    }

    const getSeverityIcon = (severity: BugSeverity | null | undefined) => {
        if (severity === 'critical' || severity === 'high') {
            return <AlertTriangle className="h-4 w-4" />
        }
        return <Info className="h-4 w-4" />
    }

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <div className="flex-shrink-0 border-b border-border bg-card">
            <div className="px-4 md:px-6 py-4">
                {/* Top Row - Title and Actions */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Severity Icon */}
                        <div className="flex-shrink-0 mt-1">
                            <div className={cn("p-2.5 rounded-lg", getSeverityColor(formData.severity))}>
                                {getSeverityIcon(formData.severity)}
                            </div>
                        </div>
                        
                        {/* Title and Metadata */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold text-foreground break-words leading-tight">
                                {formData.title}
                            </h2>
                            <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                                {/* Bug ID */}
                                <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                        #{bug.id.slice(-8)}
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(bug.id)
                                            toast.success('ID copied')
                                        }}
                                        className="hover:text-foreground transition-colors"
                                        aria-label="Copy bug ID"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                                
                                {/* Created Date */}
                                {bug.created_at && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>Created {formatDate(bug.created_at)}</span>
                                    </div>
                                )}
                                
                                {/* Creator */}
                                {bug.creator && (
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>{bug.creator.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Share Button */}
                        <button
                            onClick={handleShareBug}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title={shareTooltip}
                            aria-label="Share bug"
                        >
                            {showShareSuccess ? (
                                <Check className="h-5 w-5 text-success" />
                            ) : (
                                <Share2 className="h-5 w-5 text-muted-foreground" />
                            )}
                        </button>
                        
                        {/* Fullscreen/Expand Button - Hidden on mobile */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors hidden md:block"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </button>
                        
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Close drawer"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Status Bar - Badges and Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    {/* Left Side - Status Badges */}
                    <div className="flex items-center flex-wrap gap-2">
                        {/* Status Badge */}
                        <div className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                            getStatusColor(formData.status)
                        )}>
                            <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                            {formData.status ? (formData.status.replace('_', ' ').charAt(0).toUpperCase() + formData.status.replace('_', ' ').slice(1)) : 'Open'}
                        </div>
                        
                        {/* Severity Badge */}
                        <div className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                            getSeverityColor(formData.severity)
                        )}>
                            {getSeverityIcon(formData.severity)}
                            <span className="ml-1">
                                {formData.severity ? (formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)) : 'Medium'}
                            </span>
                        </div>
                        
                        {/* Priority Badge */}
                        {formData.priority && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {formData.priority}
                            </div>
                        )}
                    </div>
                    
                    {/* Right Side - Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {/* Views */}
                        <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">0</span>
                        </div>
                        
                        {/* Comments Count */}
                        <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{comments.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="px-4 md:px-6 border-b border-border overflow-x-auto">
                <nav className="flex space-x-6" aria-label="Bug details tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "whitespace-nowrap flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-all",
                                    activeTab === tab.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <Icon className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                
                                {/* Badge for counts */}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="ml-2 bg-primary/10 text-primary py-0.5 px-2 rounded-full text-xs">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}