// ============================================
// FILE: components/bugs/BugDetailsDrawer.tsx
// Mobile-first responsive side drawer for bug details
// ============================================
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, FileText, Calendar, User, Tag, AlertTriangle, Copy,
    Trash2, Archive, CheckCircle2, XCircle, AlertCircle,
    Clock, Share2, Check, Info, Settings, TrendingUp,
    MessageSquare, Activity, ExternalLink, Plus, ChevronDown,
    ChevronUp, Eye, Edit
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { AssetLinkerInline } from '@/components/relationships/AssetLinkerInline'
import type { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types'
import { logger } from '@/lib/utils/logger'

interface BugDetailsDrawerProps {
    isOpen: boolean
    bug: BugWithCreator | null
    onClose: () => void
    onEdit?: (bugId: string) => void
    onDelete?: (bugId: string) => void
    onUpdateBug?: (bug: BugWithCreator) => Promise<void>
}

export function BugDetailsDrawer({
    isOpen,
    bug,
    onClose,
    onEdit,
    onDelete,
    onUpdateBug
}: BugDetailsDrawerProps) {
    const { supabase, user } = useSupabase()

    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [collapsedSections, setCollapsedSections] = useState(new Set<string>())
    const [shareTooltip, setShareTooltip] = useState('Copy link')
    const [showShareSuccess, setShowShareSuccess] = useState(false)
    const [activities, setActivities] = useState<any[]>([])
    const [comments, setComments] = useState<any[]>([])
    const [formData, setFormData] = useState<any>({})
    const [sprints, setSprints] = useState<any[]>([])
    const [editingField, setEditingField] = useState<string | null>(null)
    const [tempValue, setTempValue] = useState<any>(null)
    const [newComment, setNewComment] = useState('')
    const [commentAttachments, setCommentAttachments] = useState<File[]>([])

    // Fetch sprints
    useEffect(() => {
        const fetchSprints = async () => {
            if (!bug?.suite_id) return

            try {
                const { data, error } = await supabase
                    .from('sprints')
                    .select('*')
                    .eq('suite_id', bug.suite_id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setSprints(data || [])
            } catch (error) {
                console.error('Error fetching sprints:', error)
            }
        }

        if (isOpen && bug) {
            fetchSprints()
        }
    }, [isOpen, bug, supabase])

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    useEffect(() => {
        if (bug) {
            setFormData({
                title: bug.title || '',
                description: bug.description || '',
                steps_to_reproduce: bug.steps_to_reproduce || '',
                expected_behavior: bug.expected_behavior || '',
                actual_behavior: bug.actual_behavior || '',
                severity: bug.severity || 'medium',
                status: bug.status || 'open',
                assigned_to: bug.assigned_to || '',
                priority: bug.priority || 'medium',
                tags: bug.tags || [],
                sprint_id: bug.sprint_id || '',
                environment: bug.environment || ''
            })
            fetchActivities()
            fetchComments()
        }
    }, [bug])

    const fetchActivities = async () => {
        if (!bug) return
        try {
            const { data } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('resource_type', 'bug')
                .eq('resource_id', bug.id)
                .order('created_at', { ascending: false })

            setActivities(data || [])
        } catch (error) {
            console.error('Error fetching activities:', error)
        }
    }

    const fetchComments = async () => {
        if (!bug) return

        try {
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select('*')
                .eq('resource_type', 'bug')
                .eq('resource_id', bug.id)
                .order('created_at', { ascending: false })

            if (commentsError) throw commentsError

            const userIds = [...new Set(commentsData?.map(c => c.user_id).filter(Boolean) || [])]

            let profiles: any = {}
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .in('id', userIds)

                profiles = (profilesData || []).reduce((acc, profile) => {
                    acc[profile.id] = profile
                    return acc
                }, {} as Record<string, any>)
            }

            const commentIds = commentsData?.map(c => c.id) || []
            let attachmentsMap: Record<string, any[]> = {}

            if (commentIds.length > 0) {
                const { data: attachmentsData } = await supabase
                    .from('comment_attachments')
                    .select('*')
                    .in('comment_id', commentIds)

                attachmentsMap = (attachmentsData || []).reduce((acc, attachment) => {
                    if (!acc[attachment.comment_id]) {
                        acc[attachment.comment_id] = []
                    }
                    acc[attachment.comment_id].push(attachment)
                    return acc
                }, {} as Record<string, any[]>)
            }

            const formattedComments = (commentsData || []).map((comment: any) => {
                const profile = profiles[comment.user_id]
                return {
                    id: comment.id,
                    text: comment.text,
                    user: profile?.name || 'Unknown User',
                    avatar_url: profile?.avatar_url || null,
                    createdAt: comment.created_at,
                    edited: comment.edited || false,
                    attachments: attachmentsMap[comment.id] || []
                }
            })

            setComments(formattedComments)
        } catch (error) {
            console.error('Error fetching comments:', error)
            setComments([])
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !bug || !user) return

        try {
            const { data: commentData, error: commentError } = await supabase
                .from('comments')
                .insert({
                    resource_type: 'bug',
                    resource_id: bug.id,
                    text: newComment,
                    user_id: user.id
                })
                .select()
                .single()

            if (commentError) {
                if (commentError.code === '42P01') {
                    toast.error('Comments feature not available', {
                        description: 'The comments table needs to be created in your database'
                    })
                    return
                }
                throw commentError
            }

            if (commentAttachments.length > 0 && commentData) {
                const attachmentPromises = commentAttachments.map(async (file) => {
                    try {
                        const fileExt = file.name.split('.').pop()
                        const fileName = `${commentData.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                        const { error: uploadError } = await supabase.storage
                            .from('comment-attachments')
                            .upload(fileName, file, {
                                cacheControl: '3600',
                                upsert: false
                            })

                        if (uploadError) throw uploadError

                        const { data: { publicUrl } } = supabase.storage
                            .from('comment-attachments')
                            .getPublicUrl(fileName)

                        const { error: attachmentError } = await supabase
                            .from('comment_attachments')
                            .insert({
                                comment_id: commentData.id,
                                file_name: file.name,
                                file_type: file.type,
                                file_size: file.size,
                                file_url: publicUrl,
                                uploaded_by: user.id
                            })

                        if (attachmentError) throw attachmentError

                        return { success: true }
                    } catch (error) {
                        console.error('Error uploading file:', file.name, error)
                        return { success: false, fileName: file.name }
                    }
                })

                const results = await Promise.all(attachmentPromises)
                const failedUploads = results.filter(r => !r.success)

                if (failedUploads.length > 0) {
                    toast.warning(`Comment added but ${failedUploads.length} file(s) failed to upload`)
                }
            }

            await fetchComments()

            setNewComment('')
            setCommentAttachments([])
            toast.success('Comment added successfully')

            try {
                await supabase
                    .from('activity_logs')
                    .insert({
                        user_id: user.id,
                        action: 'Added comment',
                        resource_type: 'bug',
                        resource_id: bug.id,
                        metadata: { comment_text: newComment.substring(0, 50) }
                    })

                fetchActivities()
            } catch (activityError) {
                logger.log('Activity logging not available')
            }
        } catch (error: any) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment', { description: error.message })
        }
    }

    const handleRemoveAttachment = (index: number) => {
        setCommentAttachments(commentAttachments.filter((_, i) => i !== index))
    }

    const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setCommentAttachments([...commentAttachments, ...Array.from(e.target.files)])
        }
    }

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEscKey)
        return () => {
            document.removeEventListener('keydown', handleEscKey)
        }
    }, [isOpen, onClose])

    const handleShareBug = async () => {
        if (!bug) return

        try {
            const bugUrl = `${window.location.origin}/dashboard/bugs/${bug.id}`
            await navigator.clipboard.writeText(bugUrl)

            setShareTooltip('Link copied!')
            setShowShareSuccess(true)

            setTimeout(() => {
                setShareTooltip('Copy link')
                setShowShareSuccess(false)
            }, 2000)
        } catch (error) {
            console.error('Failed to copy link:', error)
            toast.error('Failed to copy link')
        }
    }

    const handleFieldUpdate = async (field: string, value: any) => {
        if (!bug || !user) return

        try {
            const { error } = await supabase
                .from('bugs')
                .update({ [field]: value })
                .eq('id', bug.id)

            if (error) throw error

            setFormData({ ...formData, [field]: value })
            toast.success(`${field} updated`)

            if (onUpdateBug) {
                const { creator, ...bugData } = bug;
                await onUpdateBug({ ...bugData, [field]: value } as BugWithCreator)
            }

            try {
                await supabase
                    .from('activity_logs')
                    .insert({
                        user_id: user.id,
                        action: `Updated ${field}`,
                        resource_type: 'bug',
                        resource_id: bug.id,
                        metadata: { field, value }
                    })

                fetchActivities()
            } catch (activityError) {
                logger.log('Activity logging not available')
            }
        } catch (error: any) {
            console.error('Error updating field:', error)
            toast.error('Failed to update', { description: error.message })
        }
    }

    const toggleSection = (sectionId: string) => {
        const newCollapsed = new Set(collapsedSections)
        if (newCollapsed.has(sectionId)) {
            newCollapsed.delete(sectionId)
        } else {
            newCollapsed.add(sectionId)
        }
        setCollapsedSections(newCollapsed)
    }

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

    if (!mounted || !isOpen || !bug) return null

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'details', label: 'Details', icon: Settings },
        { id: 'links', label: 'Links', icon: Tag },
        { id: 'comments', label: 'Comments', icon: MessageSquare, badge: comments.length },
        { id: 'activity', label: 'Activity', icon: Activity, badge: activities.length },
    ]

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Sidebar */}
                    <motion.div
                        key="bug-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={cn(
                            "fixed inset-y-0 right-0 z-50 bg-card border-l border-border shadow-2xl",
                            isFullscreen ? "w-full" : "w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-4xl",
                            "flex flex-col overflow-hidden"
                        )}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 border-b border-border bg-card">
                            <div className="px-4 md:px-6 py-4">
                                {/* Top Row */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className={cn("p-2.5 rounded-lg", getSeverityColor(formData.severity))}>
                                                {getSeverityIcon(formData.severity)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl md:text-2xl font-bold text-foreground break-words leading-tight">
                                                {formData.title}
                                            </h2>
                                            <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
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
                                                        className="hover:text-foreground"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                {bug.created_at && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Created {formatDate(bug.created_at)}</span>
                                                    </div>
                                                )}
                                                {bug.creator && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-4 w-4" />
                                                        <span>{bug.creator.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <div className="relative group">
                                            <button
                                                onClick={handleShareBug}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                title={shareTooltip}
                                            >
                                                {showShareSuccess ? (
                                                    <Check className="h-5 w-5 text-success" />
                                                ) : (
                                                    <Share2 className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                        >
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <X className="h-5 w-5 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>

                                {/* Status Bar */}
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", getStatusColor(formData.status))}>
                                            <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                                            {formData.status?.replace('_', ' ').charAt(0).toUpperCase() + formData.status?.replace('_', ' ').slice(1)}
                                        </div>
                                        <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", getSeverityColor(formData.severity))}>
                                            {getSeverityIcon(formData.severity)}
                                            <span className="ml-1">{formData.severity?.charAt(0).toUpperCase() + formData.severity?.slice(1)}</span>
                                        </div>
                                        {formData.priority && (
                                            <Badge variant="default" size="sm">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                {formData.priority}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-4 w-4" />
                                            <span>0</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>{comments.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="px-4 md:px-6 border-b border-border overflow-x-auto">
                                <nav className="flex space-x-6" aria-label="Tabs">
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
                                            >
                                                <Icon className="h-4 w-4 mr-2" />
                                                {tab.label}
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

                        {/* Content - Continues in next message due to length */}
                        <div className={cn(
                            "flex-1 overflow-y-auto",
                            activeTab === 'comments' ? "flex flex-col" : ""
                        )}>
                            <div className={cn(
                                "p-4 md:p-6",
                                activeTab === 'comments' ? "flex-1 flex flex-col pb-0" : ""
                            )}>
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Quick Actions */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="bg-muted/50 rounded-lg p-3">
                                                {editingField === 'status' ? (
                                                    <select
                                                        value={tempValue}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('status', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('status', tempValue)
                                                                setEditingField(null)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="w-full text-sm font-medium bg-transparent border-none outline-none text-foreground"
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="closed">Closed</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('status')
                                                            setTempValue(formData.status)
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.status?.replace('_', ' ').charAt(0).toUpperCase() + formData.status?.replace('_', ' ').slice(1) || 'Open'}
                                                    </button>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">Status</p>
                                            </div>

                                            <div className="bg-muted/50 rounded-lg p-3">
                                                {editingField === 'severity' ? (
                                                    <select
                                                        value={tempValue}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('severity', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('severity', tempValue)
                                                                setEditingField(null)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="w-full text-sm font-medium bg-transparent border-none outline-none text-foreground"
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                        <option value="critical">Critical</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('severity')
                                                            setTempValue(formData.severity)
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.severity?.charAt(0).toUpperCase() + formData.severity?.slice(1) || 'Medium'}
                                                    </button>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">Severity</p>
                                            </div>

                                            <div className="bg-muted/50 rounded-lg p-3">
                                                {editingField === 'assigned_to' ? (
                                                    <input
                                                        type="text"
                                                        value={tempValue ?? ''}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('assigned_to', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('assigned_to', tempValue)
                                                                setEditingField(null)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                            }
                                                        }}
                                                        autoFocus
                                                        placeholder="Unassigned"
                                                        className="w-full text-sm font-medium bg-transparent border-none outline-none text-foreground"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('assigned_to')
                                                            setTempValue(formData.assigned_to || '')
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.assigned_to || 'Unassigned'}
                                                    </button>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">Assignee</p>
                                            </div>

                                            {sprints.length > 0 && (
                                                <div className="bg-muted/50 rounded-lg p-3">
                                                    {editingField === 'sprint_id' ? (
                                                        <select
                                                            value={tempValue ?? ''}
                                                            onChange={(e) => setTempValue(e.target.value)}
                                                            onBlur={() => {
                                                                handleFieldUpdate('sprint_id', tempValue)
                                                                setEditingField(null)
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleFieldUpdate('sprint_id', tempValue)
                                                                    setEditingField(null)
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingField(null)
                                                                }
                                                            }}
                                                            autoFocus
                                                            className="w-full text-sm font-medium bg-transparent border-none outline-none text-foreground"
                                                        >
                                                            <option value="">No Sprint</option>
                                                            {sprints.map((sprint: any) => (
                                                                <option key={sprint.id} value={sprint.id}>
                                                                    {sprint.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingField('sprint_id')
                                                                setTempValue(formData.sprint_id || '')
                                                            }}
                                                            className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors truncate"
                                                        >
                                                            {formData.sprint_id
                                                                ? sprints.find((s: any) => s.id === formData.sprint_id)?.name || 'Unknown Sprint'
                                                                : 'No Sprint'}
                                                        </button>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">🎯 Sprint</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {formData.description && (
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-primary" />
                                                        Description
                                                    </h3>
                                                    <button
                                                        onClick={() => toggleSection('description')}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        {collapsedSections.has('description') ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronUp className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                {!collapsedSections.has('description') && (
                                                    <>
                                                        {editingField === 'description' ? (
                                                            <textarea
                                                                value={tempValue}
                                                                onChange={(e) => setTempValue(e.target.value)}
                                                                onBlur={() => {
                                                                    handleFieldUpdate('description', tempValue)
                                                                    setEditingField(null)
                                                                }}
                                                                autoFocus
                                                                className="w-full min-h-[100px] text-sm text-foreground leading-relaxed bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingField('description')
                                                                    setTempValue(formData.description)
                                                                }}
                                                                className="w-full text-left text-sm text-foreground leading-relaxed whitespace-pre-wrap hover:bg-accent rounded-lg p-2 transition-colors"
                                                            >
                                                                {formData.description}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Steps to Reproduce */}
                                        {formData.steps_to_reproduce && (
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                                                    <AlertCircle className="h-4 w-4 text-warning" />
                                                    Steps to Reproduce
                                                </h3>
                                                {editingField === 'steps_to_reproduce' ? (
                                                    <textarea
                                                        value={tempValue}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('steps_to_reproduce', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        autoFocus
                                                        className="w-full min-h-[100px] text-sm text-foreground leading-relaxed bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('steps_to_reproduce')
                                                            setTempValue(formData.steps_to_reproduce)
                                                        }}
                                                        className="w-full text-left text-sm text-foreground leading-relaxed whitespace-pre-wrap hover:bg-accent rounded-lg p-2 transition-colors"
                                                    >
                                                        {formData.steps_to_reproduce}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Expected vs Actual Behavior */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {formData.expected_behavior && (
                                                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                                        Expected Behavior
                                                    </h3>
                                                    {editingField === 'expected_behavior' ? (
                                                        <textarea
                                                            value={tempValue}
                                                            onChange={(e) => setTempValue(e.target.value)}
                                                            onBlur={() => {
                                                                handleFieldUpdate('expected_behavior', tempValue)
                                                                setEditingField(null)
                                                            }}
                                                            autoFocus
                                                            className="w-full min-h-[80px] text-sm text-foreground bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingField('expected_behavior')
                                                                setTempValue(formData.expected_behavior)
                                                            }}
                                                            className="w-full text-left text-sm text-foreground hover:bg-accent/50 rounded-lg p-2 transition-colors"
                                                        >
                                                            {formData.expected_behavior}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {formData.actual_behavior && (
                                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                                                        <XCircle className="h-4 w-4 text-destructive" />
                                                        Actual Behavior
                                                    </h3>
                                                    {editingField === 'actual_behavior' ? (
                                                        <textarea
                                                            value={tempValue}
                                                            onChange={(e) => setTempValue(e.target.value)}
                                                            onBlur={() => {
                                                                handleFieldUpdate('actual_behavior', tempValue)
                                                                setEditingField(null)
                                                            }}
                                                            autoFocus
                                                            className="w-full min-h-[80px] text-sm text-foreground bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingField('actual_behavior')
                                                                setTempValue(formData.actual_behavior)
                                                            }}
                                                            className="w-full text-left text-sm text-foreground hover:bg-accent/50 rounded-lg p-2 transition-colors"
                                                        >
                                                            {formData.actual_behavior}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        {/* Meta Information */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-muted/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                    <Settings className="w-3.5 h-3.5" />
                                                    <span className="font-medium">Environment</span>
                                                </div>
                                                {editingField === 'environment' ? (
                                                    <input
                                                        type="text"
                                                        value={tempValue ?? ''}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('environment', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('environment', tempValue)
                                                                setEditingField(null)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                            }
                                                        }}
                                                        autoFocus
                                                        placeholder="Environment"
                                                        className="w-full text-sm font-medium bg-background border border-border rounded px-2 py-1 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('environment')
                                                            setTempValue(formData.environment || '')
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.environment || 'Not specified'}
                                                    </button>
                                                )}
                                            </div>

                                            {bug.created_at && (
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span className="font-medium">Created</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-foreground">{formatDate(bug.created_at)}</p>
                                                </div>
                                            )}

                                            {bug.updated_at && (
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="font-medium">Updated</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-foreground">{formatDate(bug.updated_at)}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {(formData.tags || editingField === 'tags') && (
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                                    <Tag className="h-4 w-4" />
                                                    Tags
                                                </h3>
                                                {editingField === 'tags' ? (
                                                    <input
                                                        type="text"
                                                        value={Array.isArray(tempValue) ? tempValue.join(', ') : tempValue}
                                                        onChange={(e) => setTempValue(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                                        onBlur={() => {
                                                            handleFieldUpdate('tags', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('tags', tempValue)
                                                                setEditingField(null)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                            }
                                                        }}
                                                        autoFocus
                                                        placeholder="tag1, tag2, tag3"
                                                        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('tags')
                                                            setTempValue(formData.tags || [])
                                                        }}
                                                        className="w-full text-left"
                                                    >
                                                        {Array.isArray(formData.tags) && formData.tags.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {formData.tags.map((tag: any, idx: number) => (
                                                                    <Badge key={idx} variant="default" size="sm">
                                                                        {String(tag)}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                                Click to add tags...
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2">Separate tags with commas</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'links' && bug.suite_id && (
                                    <div className="space-y-6">
                                        <AssetLinkerInline
                                            assetType="bug"
                                            assetId={bug.id}
                                            suiteId={bug.suite_id}
                                            editable={true}
                                        />
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div className="flex-1 flex flex-col min-h-0">
                                        {/* Comments List */}
                                        <div className="flex-1 overflow-y-auto mb-4 pr-2">
                                            {comments.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                    <p className="text-muted-foreground text-sm">No comments yet</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Start a discussion about this bug</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {comments.map((comment: any) => (
                                                        <div key={comment.id} className="bg-muted/30 rounded-lg p-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                    {comment.avatar_url ? (
                                                                        <img
                                                                            src={comment.avatar_url}
                                                                            alt={comment.user}
                                                                            className="w-8 h-8 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <User className="h-4 w-4 text-primary" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-medium text-foreground">
                                                                            {comment.user}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {formatDate(comment.createdAt)}
                                                                        </span>
                                                                        {comment.edited && (
                                                                            <span className="text-xs text-muted-foreground italic">
                                                                                (edited)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-foreground whitespace-pre-wrap">
                                                                        {comment.text}
                                                                    </p>
                                                                    {comment.attachments && comment.attachments.length > 0 && (
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            {comment.attachments.map((file: any, idx: number) => (
                                                                                <a
                                                                                    key={idx}
                                                                                    href={file.file_url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                                                                >
                                                                                    <ExternalLink className="h-3 w-3" />
                                                                                    {file.file_name}
                                                                                    <span className="text-xs">
                                                                                        ({(file.file_size / 1024).toFixed(1)}KB)
                                                                                    </span>
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="space-y-3">
                                        {activities.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground text-sm">No activity recorded yet</p>
                                            </div>
                                        ) : (
                                            activities.map((activity, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                    <Activity className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-foreground">{activity.action}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {formatDate(activity.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 border-t border-border bg-card">
                            {/* Comment Input for Comments Tab */}
                            {activeTab === 'comments' && (
                                <div className="px-4 md:px-6 py-4 border-b border-border">
                                    {/* Attachment Preview */}
                                    {commentAttachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
                                            {commentAttachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded text-xs">
                                                    <span>📎 {file.name}</span>
                                                    <span className="text-muted-foreground">
                                                        ({(file.size / 1024).toFixed(1)}KB)
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveAttachment(idx)}
                                                        className="text-error hover:text-error/80"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input Row */}
                                    <div className="flex items-end gap-2">
                                        <label className="cursor-pointer flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors">
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileAttachment}
                                                accept="image/*,.pdf,.doc,.docx,.txt"
                                                className="hidden"
                                            />
                                            <Plus className="h-5 w-5 text-muted-foreground" />
                                        </label>

                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    if (newComment.trim()) {
                                                        handleAddComment()
                                                    }
                                                }
                                            }}
                                            placeholder="Type a comment... (Shift+Enter for new line)"
                                            rows={1}
                                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none min-h-[40px] max-h-[120px]"
                                            style={{ height: 'auto' }}
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement
                                                target.style.height = 'auto'
                                                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                                            }}
                                        />

                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="flex-shrink-0 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Send (Enter)"
                                        >
                                            <MessageSquare className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="p-4 md:p-6">
                                <div className="flex flex-wrap gap-2">
                                    {onEdit && (
                                        <button
                                            onClick={() => {
                                                onEdit(bug.id)
                                                onClose()
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Bug
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => {
                                                onDelete(bug.id)
                                                onClose()
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-error bg-card border border-error/30 rounded-lg hover:bg-error/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}