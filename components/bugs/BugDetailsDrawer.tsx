// ============================================
// FILE: components/bugs/BugDetailsDrawer.tsx
// Main drawer component - manages state and layout
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, Check, ExternalLink, FileText, Settings, Tag, MessageSquare, Activity, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import type { BugWithCreator } from '@/types/bug.types'
import { BugDrawerHeader } from './BugDrawerHeader'
import { BugDrawerContent } from './BugDrawerContent'
import { RecordingPlayer } from '../Recordings/RecordingPlayer'

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
    const [shareTooltip, setShareTooltip] = useState('Copy link')
    const [showShareSuccess, setShowShareSuccess] = useState(false)
    const [formData, setFormData] = useState<any>({})
    const [sprints, setSprints] = useState<any[]>([])
    const [activities, setActivities] = useState<any[]>([])
    const [comments, setComments] = useState<any[]>([])

    // Recording player data
    const [recordingData, setRecordingData] = useState<any>(null)
    const [isLoadingRecording, setIsLoadingRecording] = useState(false)

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
                environment: bug.environment || '',
                linked_recording_id: bug.linked_recording_id || null,
                linked_test_case_id: bug.linked_test_case_id || null
            })
            fetchSprints()
            fetchActivities()
            fetchComments()

            // Pre-fetch recording data if it exists
            if (bug.linked_recording_id) {
                fetchRecordingData(bug.linked_recording_id)
            }
        }
    }, [bug])

    // Fetch recording data when fullscreen is enabled and there's a linked recording
    const fetchRecordingData = async (recordingId: string) => {
        if (isLoadingRecording) return // Prevent duplicate fetches

        setIsLoadingRecording(true)
        try {
            // Fetch full recording data
            const { data: recording, error: recordingError } = await supabase
                .from('recordings')
                .select('*')
                .eq('id', recordingId)
                .single()

            if (recordingError) throw recordingError

            // Fetch suite data - correct table name is test_suites
            const { data: suite, error: suiteError } = await supabase
                .from('test_suites')
                .select('id, name')
                .eq('id', recording.suite_id)
                .single()

            if (suiteError) throw suiteError

            // Fetch sprint data if exists
            let sprint = null
            if (recording.sprint_id) {
                const { data: sprintData } = await supabase
                    .from('sprints')
                    .select('id, name')
                    .eq('id', recording.sprint_id)
                    .single()
                sprint = sprintData
            }

            setRecordingData({ recording, suite, sprint })
        } catch (error: any) {
            toast.error('Failed to load recording', { description: error.message })
            console.error('Error loading recording:', error)
        } finally {
            setIsLoadingRecording(false)
        }
    }

    const fetchSprints = async () => {
        if (!bug?.suite_id) return
        try {
            const { data, error } = await supabase
                .from('sprints')
                .select('*')
                .eq('suite_id', bug.suite_id)
                .order('created_at', { ascending: false })
            if (!error) setSprints(data || [])
        } catch (error) {
            console.error('Error fetching sprints:', error)
        }
    }

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
            const { data: commentsData } = await supabase
                .from('comments')
                .select('*')
                .eq('resource_type', 'bug')
                .eq('resource_id', bug.id)
                .order('created_at', { ascending: false })

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

            const formattedComments = (commentsData || []).map((comment: any) => {
                const profile = profiles[comment.user_id]
                return {
                    id: comment.id,
                    text: comment.text,
                    user: profile?.name || 'Unknown User',
                    avatar_url: profile?.avatar_url || null,
                    createdAt: comment.created_at,
                    edited: comment.edited || false
                }
            })

            setComments(formattedComments)
        } catch (error) {
            console.error('Error fetching comments:', error)
        }
    }

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
            toast.success(`${field.replace('_', ' ')} updated`)

            if (onUpdateBug) {
                const { creator, ...bugData } = bug
                await onUpdateBug({ ...bugData, [field]: value } as BugWithCreator)
            }
        } catch (error: any) {
            toast.error('Failed to update', { description: error.message })
        }
    }

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEscKey)
        return () => document.removeEventListener('keydown', handleEscKey)
    }, [isOpen, onClose])

    if (!mounted || !isOpen || !bug) return null

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'details', label: 'Details', icon: Settings },
        { id: 'links', label: 'Links', icon: Tag },
        { id: 'comments', label: 'Comments', icon: MessageSquare, badge: comments.length },
        { id: 'activity', label: 'Activity', icon: Activity, badge: activities.length },
    ]

    // Determine if we should show the recording player
    const shouldShowRecordingPlayer = isFullscreen && formData.linked_recording_id && recordingData

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

                    {/* Drawer */}
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
                        {shouldShowRecordingPlayer ? (
                            <>
                                {/* Recording Player View - Fullscreen Only */}
                                <div className="flex-shrink-0 border-b border-border bg-card px-4 md:px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Recording Evidence</h2>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setIsFullscreen(false)}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                title="Exit fullscreen"
                                            >
                                                <ExternalLink className="h-4 w-4 text-muted-foreground rotate-180" />
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                aria-label="Close drawer"
                                            >
                                                <X className="h-5 w-5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Recording Player Content */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                    {isLoadingRecording ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                                <p className="text-muted-foreground">Loading recording...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="recording-player-embedded">
                                            <style jsx>{`
                                                .recording-player-embedded button[class*="Back"],
                                                .recording-player-embedded button:has(svg.lucide-external-link.rotate-180),
                                                .recording-player-embedded button:has(.lucide-bug) {
                                                    display: none !important;
                                                }
                                            `}</style>
                                            <RecordingPlayer
                                                recording={recordingData.recording}
                                                suite={recordingData.suite}
                                                sprint={recordingData.sprint}
                                                embeddedInBugDrawer={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Normal Bug Details View */}
                                <BugDrawerHeader
                                    bug={bug}
                                    formData={formData}
                                    tabs={tabs}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    isFullscreen={isFullscreen}
                                    setIsFullscreen={setIsFullscreen}
                                    showShareSuccess={showShareSuccess}
                                    shareTooltip={shareTooltip}
                                    handleShareBug={handleShareBug}
                                    onClose={onClose}
                                    comments={comments}
                                    activities={activities}
                                />

                                <BugDrawerContent
                                    activeTab={activeTab}
                                    bug={bug}
                                    formData={formData}
                                    sprints={sprints}
                                    comments={comments}
                                    activities={activities}
                                    user={user}
                                    handleFieldUpdate={handleFieldUpdate}
                                    fetchComments={fetchComments}
                                    fetchActivities={fetchActivities}
                                    setIsFullscreen={setIsFullscreen}
                                />

                                {/* Footer Actions */}
                                <div className="flex-shrink-0 border-t border-border bg-card p-4 md:p-6">
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
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}