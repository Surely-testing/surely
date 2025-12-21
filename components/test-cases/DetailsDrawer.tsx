// ============================================
// FILE: components/test-cases/DetailsDrawer.tsx
// Enhanced mobile-first responsive side drawer with asset linking
// ============================================
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, FileText, Calendar, User, Tag, Play, Edit, Copy, Trash2, Archive,
    CheckCircle2, XCircle, AlertCircle, Clock, Share2, Check, Info,
    ListOrdered, Settings, TrendingUp, MessageSquare, Activity, ExternalLink,
    Plus, ChevronDown, ChevronUp, Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { AssetLinkerInline } from '@/components/relationships/AssetLinkerInline'
import type { TestCase } from '@/types/test-case.types'
import { logger } from '@/lib/utils/logger';

interface DetailsDrawerProps {
    isOpen: boolean
    testCase: TestCase | null
    onClose: () => void
    onEdit?: (testCaseId: string) => void
    onDelete?: (testCaseId: string) => void
    onArchive?: (testCaseId: string) => void
    onDuplicate?: (testCaseId: string) => void
    onRun?: (testCaseId: string) => void
}

export function DetailsDrawer({
    isOpen,
    testCase,
    onClose,
    onEdit,
    onDelete,
    onArchive,
    onDuplicate,
    onRun
}: DetailsDrawerProps) {
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

    const handleStepChange = async (index: number, field: 'action' | 'step', value: string) => {
        if (!testCase || !user) return

        try {
            const newSteps = [...(formData.steps || [])]

            // Handle both string steps and object steps
            if (typeof newSteps[index] === 'string') {
                newSteps[index] = { step: value, action: value }
            } else {
                newSteps[index] = {
                    ...(newSteps[index] as any),
                    [field]: value
                }
            }

            const { error } = await supabase
                .from('test_cases')
                .update({ steps: newSteps })
                .eq('id', testCase.id)

            if (error) throw error

            setFormData({ ...formData, steps: newSteps })
            toast.success('Step updated')

            // Log activity
            try {
                await supabase
                    .from('activity_logs')
                    .insert({
                        user_id: user.id,
                        action: `Updated step ${index + 1}`,
                        resource_type: 'test_case',
                        resource_id: testCase.id,
                        metadata: { step_index: index, field, value }
                    })

                fetchActivities()
            } catch (activityError) {
                logger.log('Activity logging not available')
            }
        } catch (error: any) {
            logger.log('Error updating step:', error)
            toast.error('Failed to update step', { description: error.message })
        }
    }

    // Add a new step
    const handleAddStep = async () => {
        if (!testCase || !user) return

        try {
            const newSteps = [
                ...(formData.steps || []),
                { step: '', action: '' }
            ]

            const { error } = await supabase
                .from('test_cases')
                .update({ steps: newSteps })
                .eq('id', testCase.id)

            if (error) throw error

            setFormData({ ...formData, steps: newSteps })
            toast.success('Step added')

            // Log activity
            try {
                await supabase
                    .from('activity_logs')
                    .insert({
                        user_id: user.id,
                        action: 'Added new test step',
                        resource_type: 'test_case',
                        resource_id: testCase.id,
                        metadata: { step_count: newSteps.length }
                    })

                fetchActivities()
            } catch (activityError) {
                logger.log('Activity logging not available')
            }
        } catch (error: any) {
            logger.log('Error adding step:', error)
            toast.error('Failed to add step', { description: error.message })
        }
    }

    // Remove a step
    const handleRemoveStep = async (index: number) => {
        if (!testCase || !user) return

        if (!confirm('Are you sure you want to remove this step?')) return

        try {
            const newSteps = (formData.steps || []).filter((_: any, i: number) => i !== index)

            const { error } = await supabase
                .from('test_cases')
                .update({ steps: newSteps })
                .eq('id', testCase.id)

            if (error) throw error

            setFormData({ ...formData, steps: newSteps })
            toast.success('Step removed')

            // Log activity
            try {
                await supabase
                    .from('activity_logs')
                    .insert({
                        user_id: user.id,
                        action: `Removed step ${index + 1}`,
                        resource_type: 'test_case',
                        resource_id: testCase.id,
                        metadata: { step_index: index }
                    })

                fetchActivities()
            } catch (activityError) {
                logger.log('Activity logging not available')
            }
        } catch (error: any) {
            logger.log('Error removing step:', error)
            toast.error('Failed to remove step', { description: error.message })
        }
    }


    // Fetch sprints
    useEffect(() => {
        const fetchSprints = async () => {
            if (!testCase?.suite_id) return

            try {
                const { data, error } = await supabase
                    .from('sprints')
                    .select('*')
                    .eq('suite_id', testCase.suite_id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setSprints(data || [])
            } catch (error) {
                logger.log('Error fetching sprints:', error)
            }
        }

        if (isOpen && testCase) {
            fetchSprints()
        }
    }, [isOpen, testCase, supabase])

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
        if (testCase) {
            setFormData({
                title: testCase.title || '',
                description: testCase.description || '',
                steps: testCase.steps || [],
                expected_result: testCase.expected_result || '',
                priority: testCase.priority || 'medium',
                status: testCase.status || 'active',
                assigned_to: testCase.assigned_to || '',
                module: testCase.module || '',
                type: testCase.type || '',
                tags: testCase.tags || [],
                sprint_id: testCase.sprint_id || ''
            })
            // Load activities and comments
            fetchActivities()
            fetchComments()
        }
    }, [testCase])

    const fetchActivities = async () => {
        if (!testCase) return
        try {
            const { data } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('resource_type', 'test_case')
                .eq('resource_id', testCase.id)
                .order('created_at', { ascending: false })

            setActivities(data || [])
        } catch (error) {
            logger.log('Error fetching activities:', error)
        }
    }

    // Also replace the handleAddComment function (around line 170)

    const handleAddComment = async () => {
        if (!newComment.trim() || !testCase || !user) return

        try {
            // Check if comments table exists by trying to insert
            const { data: commentData, error: commentError } = await supabase
                .from('comments')
                .insert({
                    resource_type: 'test_case',
                    resource_id: testCase.id,
                    text: newComment,
                    user_id: user.id
                })
                .select()
                .single()

            if (commentError) {
                // If table doesn't exist, show a helpful message
                if (commentError.code === '42P01') {
                    toast.error('Comments feature not available', {
                        description: 'The comments table needs to be created in your database'
                    })
                    return
                }
                throw commentError
            }

            // Upload attachments if any (only if comment was created successfully)
            if (commentAttachments.length > 0 && commentData) {
                const attachmentPromises = commentAttachments.map(async (file) => {
                    try {
                        // 1. Upload file to Supabase Storage
                        const fileExt = file.name.split('.').pop()
                        const fileName = `${commentData.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                        const { error: uploadError } = await supabase.storage
                            .from('comment-attachments')
                            .upload(fileName, file, {
                                cacheControl: '3600',
                                upsert: false
                            })

                        if (uploadError) throw uploadError

                        // 2. Get public URL
                        const { data: { publicUrl } } = supabase.storage
                            .from('comment-attachments')
                            .getPublicUrl(fileName)

                        // 3. Save attachment metadata to database
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
                        logger.log('Error uploading file:', file.name, error)
                        return { success: false, fileName: file.name }
                    }
                })

                const results = await Promise.all(attachmentPromises)
                const failedUploads = results.filter(r => !r.success)

                if (failedUploads.length > 0) {
                    toast.warning(`Comment added but ${failedUploads.length} file(s) failed to upload`)
                }
            }

            // Refresh comments
            await fetchComments()

            setNewComment('')
            setCommentAttachments([])
            toast.success('Comment added successfully')

            // Log activity (optional - don't fail if activity_logs doesn't exist)
            try {
                await supabase
                    .from('activity_logs')
                    .insert({
                        user_id: user.id,
                        action: 'Added comment',
                        resource_type: 'test_case',
                        resource_id: testCase.id,
                        metadata: { comment_text: newComment.substring(0, 50) }
                    })

                fetchActivities()
            } catch (activityError) {
                // Silently fail if activity_logs doesn't exist
                logger.log('Activity logging not available')
            }
        } catch (error: any) {
            logger.log('Error adding comment:', error)
            toast.error('Failed to add comment', { description: error.message })
        }
    }

    const fetchComments = async () => {
        if (!testCase) return

        try {
            // First, fetch comments without the join
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select('*')
                .eq('resource_type', 'test_case')
                .eq('resource_id', testCase.id)
                .order('created_at', { ascending: false })

            if (commentsError) throw commentsError

            // Then fetch user profiles separately if needed
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

            // Fetch attachments separately
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

            // Combine the data
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
            logger.log('Error fetching comments:', error)
            // Don't show error toast, just set empty comments
            setComments([])
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

    const handleShareTestCase = async () => {
        if (!testCase) return

        try {
            const testCaseUrl = `${window.location.origin}/dashboard/test-cases/${testCase.id}`
            await navigator.clipboard.writeText(testCaseUrl)

            setShareTooltip('Link copied!')
            setShowShareSuccess(true)

            setTimeout(() => {
                setShareTooltip('Copy link')
                setShowShareSuccess(false)
            }, 2000)
        } catch (error) {
            logger.log('Failed to copy link:', error)
            toast.error('Failed to copy link')
        }
    }

    const handleFieldUpdate = async (field: string, value: any) => {
        if (!testCase || !user) return

        try {
            const { error } = await supabase
                .from('test_cases')
                .update({ [field]: value })
                .eq('id', testCase.id)

            if (error) throw error

            setFormData({ ...formData, [field]: value })
            toast.success(`${field} updated`)

            // Log activity
            const { error: activityError } = await supabase
                .from('activity_logs')
                .insert({
                    user_id: user.id,
                    action: `Updated ${field}`,
                    resource_type: 'test_case',
                    resource_id: testCase.id,
                    metadata: { field, value }
                })

            if (activityError) {
                logger.log('Failed to log activity:', activityError)
            }

            fetchActivities()
        } catch (error: any) {
            logger.log('Error updating field:', error)
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

    const getPriorityColor = (priority: string | null | undefined) => {
        const colors = {
            critical: 'bg-destructive text-destructive-foreground',
            high: 'bg-warning text-warning-foreground',
            medium: 'bg-info text-info-foreground',
            low: 'bg-success text-success-foreground',
        }
        return colors[priority as keyof typeof colors] || 'bg-muted text-muted-foreground'
    }

    const getStatusColor = (status: string | null | undefined) => {
        const colors = {
            active: 'bg-success text-success-foreground',
            archived: 'bg-muted text-muted-foreground',
            deprecated: 'bg-destructive text-destructive-foreground',
        }
        return colors[status as keyof typeof colors] || 'bg-info text-info-foreground'
    }

    const getSeverityIcon = (priority: string | null | undefined) => {
        if (priority === 'critical' || priority === 'high') {
            return <AlertCircle className="h-4 w-4" />
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

    if (!mounted || !isOpen || !testCase) return null

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
                        key="test-case-drawer"
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
                                            <div className={cn("p-2.5 rounded-lg", getPriorityColor(formData.priority))}>
                                                {getSeverityIcon(formData.priority)}
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
                                                        #{testCase.id.slice(-8)}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(testCase.id)
                                                            toast.success('ID copied')
                                                        }}
                                                        className="hover:text-foreground"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                {testCase.created_at && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Created {formatDate(testCase.created_at)}</span>
                                                    </div>
                                                )}
                                                {formData.assigned_to && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-4 w-4" />
                                                        <span>{formData.assigned_to}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <div className="relative group">
                                            <button
                                                onClick={handleShareTestCase}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                title={shareTooltip}
                                            >
                                                {showShareSuccess ? (
                                                    <Check className="h-5 w-5 text-success" />
                                                ) : (
                                                    <Share2 className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </button>
                                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                {shareTooltip}
                                            </div>
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
                                            {formData.status?.charAt(0).toUpperCase() + formData.status?.slice(1)}
                                        </div>
                                        <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", getPriorityColor(formData.priority))}>
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {formData.priority?.charAt(0).toUpperCase() + formData.priority?.slice(1)}
                                        </div>
                                        {formData.type && (
                                            <Badge variant="default" size="sm">
                                                {formData.type}
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

                        {/* Content */}
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
                                        {/* Quick Actions - Inline Editable */}
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
                                                        <option value="active">Active</option>
                                                        <option value="archived">Archived</option>
                                                        <option value="deprecated">Deprecated</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('status')
                                                            setTempValue(formData.status)
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.status?.charAt(0).toUpperCase() + formData.status?.slice(1) || 'Active'}
                                                    </button>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">Status</p>
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

                                            <div className="bg-muted/50 rounded-lg p-3">
                                                {editingField === 'priority' ? (
                                                    <select
                                                        value={tempValue}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('priority', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('priority', tempValue)
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
                                                            setEditingField('priority')
                                                            setTempValue(formData.priority)
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.priority?.charAt(0).toUpperCase() + formData.priority?.slice(1) || 'Medium'}
                                                    </button>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">Priority</p>
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
                                                            className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
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
                                        {/* Test Steps */}
                                        {(formData.steps && Array.isArray(formData.steps) && formData.steps.length > 0) || editingField === 'steps' ? (
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <ListOrdered className="h-4 w-4 text-success" />
                                                        Test Steps ({(formData.steps || []).length})
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={handleAddStep}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 rounded hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Add Step
                                                        </button>
                                                        <button
                                                            onClick={() => toggleSection('steps')}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            {collapsedSections.has('steps') ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronUp className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {!collapsedSections.has('steps') && (
                                                    <div className="space-y-3">
                                                        {formData.steps && formData.steps.length > 0 ? (
                                                            <>
                                                                {formData.steps.map((step: any, idx: number) => {
                                                                    const stepText = typeof step === 'string' ? step : (step?.step || step?.action || '')
                                                                    const isEditing = editingField === `step-${idx}`

                                                                    return (
                                                                        <div key={idx} className="border border-border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow">
                                                                            <div className="flex items-start gap-3">
                                                                                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-1">
                                                                                    {idx + 1}
                                                                                </span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    {isEditing ? (
                                                                                        <textarea
                                                                                            value={tempValue}
                                                                                            onChange={(e) => setTempValue(e.target.value)}
                                                                                            onBlur={() => {
                                                                                                handleStepChange(idx, 'step', tempValue)
                                                                                                setEditingField(null)
                                                                                            }}
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                                                                    handleStepChange(idx, 'step', tempValue)
                                                                                                    setEditingField(null)
                                                                                                } else if (e.key === 'Escape') {
                                                                                                    setEditingField(null)
                                                                                                }
                                                                                            }}
                                                                                            autoFocus
                                                                                            rows={3}
                                                                                            className="w-full text-sm text-foreground bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none resize-none"
                                                                                            placeholder="Describe the test step..."
                                                                                        />
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingField(`step-${idx}`)
                                                                                                setTempValue(stepText)
                                                                                            }}
                                                                                            className="w-full text-left text-sm text-foreground hover:bg-muted rounded p-2 transition-colors"
                                                                                        >
                                                                                            {stepText || <span className="text-muted-foreground italic">Click to add step description...</span>}
                                                                                        </button>
                                                                                    )}
                                                                                    {isEditing && (
                                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                                            Press Ctrl+Enter to save, Esc to cancel
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                {!isEditing && (
                                                                                    <button
                                                                                        onClick={() => handleRemoveStep(idx)}
                                                                                        className="flex-shrink-0 p-1.5 text-error hover:bg-error/10 rounded transition-colors"
                                                                                        title="Remove step"
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-6">
                                                                <ListOrdered className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                                <p className="text-sm text-muted-foreground mb-3">No test steps yet</p>
                                                                <button
                                                                    onClick={handleAddStep}
                                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                    Add First Step
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleAddStep}
                                                className="w-full bg-muted/30 border border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <ListOrdered className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-sm font-medium text-foreground">Add Test Steps</p>
                                                    <p className="text-xs text-muted-foreground">Click to add your first test step</p>
                                                </div>
                                            </button>
                                        )}

                                        {/* Expected Result */}
                                        {formData.expected_result && (
                                            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                    Expected Result
                                                </h3>
                                                {editingField === 'expected_result' ? (
                                                    <textarea
                                                        value={tempValue}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('expected_result', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        autoFocus
                                                        className="w-full min-h-[80px] text-sm text-foreground bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('expected_result')
                                                            setTempValue(formData.expected_result)
                                                        }}
                                                        className="w-full text-left text-sm text-foreground hover:bg-accent/50 rounded-lg p-2 transition-colors"
                                                    >
                                                        {formData.expected_result}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        {/* Status Management */}
                                        <div className="bg-muted/30 rounded-lg p-4">
                                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                                                <Activity className="h-4 w-4" />
                                                Status Management
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                                                        Test Case Status
                                                    </label>
                                                    {editingField === 'status-detail' ? (
                                                        <select
                                                            value={tempValue ?? ''}
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
                                                            className="w-full text-sm font-medium bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                                        >
                                                            <option value="active">Active</option>
                                                            <option value="archived">Archived</option>
                                                            <option value="deprecated">Deprecated</option>
                                                        </select>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingField('status-detail')
                                                                setTempValue(formData.status || 'active')
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                                                                formData.status === 'active' && "bg-success/10 border-success/30 text-success",
                                                                formData.status === 'archived' && "bg-muted border-border text-muted-foreground",
                                                                formData.status === 'deprecated' && "bg-destructive/10 border-destructive/30 text-destructive"
                                                            )}
                                                        >
                                                            <span className="text-sm font-medium">
                                                                {formData.status?.charAt(0).toUpperCase() + formData.status?.slice(1) || 'Active'}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                                                        Automation Status
                                                    </label>
                                                    {editingField === 'is_automated' ? (
                                                        <select
                                                            value={tempValue ? 'true' : 'false'}
                                                            onChange={(e) => setTempValue(e.target.value === 'true')}
                                                            onBlur={() => {
                                                                handleFieldUpdate('is_automated', tempValue)
                                                                setEditingField(null)
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleFieldUpdate('is_automated', tempValue)
                                                                    setEditingField(null)
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingField(null)
                                                                }
                                                            }}
                                                            autoFocus
                                                            className="w-full text-sm font-medium bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                                        >
                                                            <option value="false">Manual</option>
                                                            <option value="true">Automated</option>
                                                        </select>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingField('is_automated')
                                                                setTempValue(formData.is_automated || false)
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                                                                formData.is_automated
                                                                    ? "bg-info/10 border-info/30 text-info"
                                                                    : "bg-muted border-border text-muted-foreground"
                                                            )}
                                                        >
                                                            <span className="text-sm font-medium">
                                                                {formData.is_automated ? 'Automated' : 'Manual'}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Meta Information */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Module - Now Editable */}
                                            <div className="bg-muted/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span className="font-medium">Module</span>
                                                </div>
                                                {editingField === 'module' ? (
                                                    <input
                                                        type="text"
                                                        value={tempValue ?? ''}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('module', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('module', tempValue)
                                                                setEditingField(null)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                            }
                                                        }}
                                                        autoFocus
                                                        placeholder="Module name"
                                                        className="w-full text-sm font-medium bg-background border border-border rounded px-2 py-1 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('module')
                                                            setTempValue(formData.module || '')
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.module || 'Not specified'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Type - Editable */}
                                            <div className="bg-muted/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                    <Settings className="w-3.5 h-3.5" />
                                                    <span className="font-medium">Test Type</span>
                                                </div>
                                                {editingField === 'type' ? (
                                                    <select
                                                        value={tempValue ?? ''}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        onBlur={() => {
                                                            handleFieldUpdate('type', tempValue)
                                                            setEditingField(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleFieldUpdate('type', tempValue)
                                                                setEditingField(null)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="w-full text-sm font-medium bg-background border border-border rounded px-2 py-1 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                                    >
                                                        <option value="">Not specified</option>
                                                        <option value="functional">Functional</option>
                                                        <option value="integration">Integration</option>
                                                        <option value="unit">Unit</option>
                                                        <option value="regression">Regression</option>
                                                        <option value="performance">Performance</option>
                                                        <option value="security">Security</option>
                                                        <option value="ui">UI</option>
                                                        <option value="api">API</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingField('type')
                                                            setTempValue(formData.type || '')
                                                        }}
                                                        className="w-full text-left text-sm font-medium text-foreground hover:bg-accent rounded px-1 transition-colors"
                                                    >
                                                        {formData.type || 'Not specified'}
                                                    </button>
                                                )}
                                            </div>

                                            {testCase.created_at && (
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span className="font-medium">Created</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-foreground">{formatDate(testCase.created_at)}</p>
                                                </div>
                                            )}

                                            {testCase.updated_at && (
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="font-medium">Updated</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-foreground">{formatDate(testCase.updated_at)}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags - Editable */}
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

                                {activeTab === 'links' && testCase.suite_id && (
                                    <div className="space-y-6">
                                        <AssetLinkerInline
                                            assetType="test_case"
                                            assetId={testCase.id}
                                            suiteId={testCase.suite_id}
                                            editable={true}
                                        />
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div className="flex-1 flex flex-col min-h-0">
                                        {/* Comments List - Scrollable Area */}
                                        <div className="flex-1 overflow-y-auto mb-4 pr-2">
                                            {comments.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                    <p className="text-muted-foreground text-sm">No comments yet</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Start a discussion about this test case</p>
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

                        {/* Footer Actions */}
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
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 md:p-6">
                            <div className="flex flex-wrap gap-2">
                                {onRun && (
                                    <button
                                        onClick={() => {
                                            onRun(testCase.id)
                                            onClose()
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                    </button>
                                )}
                                {onDuplicate && (
                                    <button
                                        onClick={() => {
                                            onDuplicate(testCase.id)
                                            onClose()
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Copy className="w-4 h-4" /> 
                                    </button>
                                )}
                                {onArchive && (
                                    <button
                                        onClick={() => {
                                            onArchive(testCase.id)
                                            onClose()
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            onDelete(testCase.id)
                                            onClose()
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-error bg-card border border-error/30 rounded-lg hover:bg-error/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}