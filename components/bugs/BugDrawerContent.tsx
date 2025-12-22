// ============================================
// FILE: components/bugs/BugDrawerContent.tsx 
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import {
    FileText, AlertCircle, CheckCircle2, XCircle, Settings,
    Calendar, Tag, Clock, MessageSquare, Activity, User,
    Plus, ExternalLink, ChevronDown, ChevronUp, Play, Video
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { AssetLinkerInline } from '@/components/relationships/AssetLinkerInline'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { BugWithCreator } from '@/types/bug.types'

interface BugDrawerContentProps {
    activeTab: string
    bug: BugWithCreator
    formData: any
    sprints: any[]
    comments: any[]
    activities: any[]
    user: any
    handleFieldUpdate: (field: string, value: any) => void
    fetchComments: () => void
    fetchActivities: () => void
    setIsFullscreen: (value: boolean) => void
}

export function BugDrawerContent({
    activeTab,
    bug,
    formData,
    sprints,
    comments,
    activities,
    user,
    handleFieldUpdate,
    fetchComments,
    fetchActivities,
    setIsFullscreen
}: BugDrawerContentProps) {
    const supabase = createClient()
    
    const [collapsedSections, setCollapsedSections] = useState(new Set<string>())
    const [editingField, setEditingField] = useState<string | null>(null)
    const [tempValue, setTempValue] = useState<any>(null)
    const [newComment, setNewComment] = useState('')
    const [commentAttachments, setCommentAttachments] = useState<File[]>([])
    
    // Video player state
    const [linkedRecording, setLinkedRecording] = useState<any>(null)
    const [isVideoExpanded, setIsVideoExpanded] = useState(false)
    const [isLoadingVideo, setIsLoadingVideo] = useState(false)

    useEffect(() => {
        if (formData.linked_recording_id && activeTab === 'details') {
            fetchLinkedRecording()
        }
    }, [formData.linked_recording_id, activeTab])

    const fetchLinkedRecording = async () => {
        if (!formData.linked_recording_id) return
        
        setIsLoadingVideo(true)
        try {
            const { data, error } = await supabase
                .from('recordings')
                .select('*')
                .eq('id', formData.linked_recording_id)
                .single()

            if (!error && data) {
                setLinkedRecording(data)
            }
        } catch (error) {
            console.error('Error fetching linked recording:', error)
        } finally {
            setIsLoadingVideo(false)
        }
    }

    const getVideoEmbedUrl = (recording: any): string => {
        const metadata = recording.metadata as any
        
        if (metadata?.embedUrl) return metadata.embedUrl
        if (metadata?.videoId) return `https://www.youtube.com/embed/${metadata.videoId}`
        
        const url = recording.url
        if (!url) return ''
        
        if (url.includes('youtube.com/embed/')) return url
        
        // Extract YouTube video ID
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
            /(?:youtu\.be\/)([^&\n?#]+)/,
            /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
        ]
        
        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}`
            }
        }
        
        if (url.match(/\.(mp4|webm|ogg)$/i)) return url
        
        return ''
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

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !bug || !user) return

        try {
            const { data: commentData, error } = await supabase
                .from('comments')
                .insert({
                    resource_type: 'bug',
                    resource_id: bug.id,
                    text: newComment,
                    user_id: user.id
                })
                .select()
                .single()

            if (error) throw error

            await fetchComments()
            setNewComment('')
            setCommentAttachments([])
            toast.success('Comment added')
        } catch (error: any) {
            toast.error('Failed to add comment', { description: error.message })
        }
    }

    return (
        <div className={cn(
            "flex-1 overflow-y-auto",
            activeTab === 'comments' ? "flex flex-col" : ""
        )}>
            <div className={cn(
                "p-4 md:p-6",
                activeTab === 'comments' ? "flex-1 flex flex-col pb-0" : ""
            )}>
                {/* Overview Tab */}
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
                                        autoFocus
                                        className="w-full text-sm font-medium bg-transparent border-none outline-none"
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
                                        className="w-full text-left text-sm font-medium hover:bg-accent rounded px-1"
                                    >
                                        {formData.status?.replace('_', ' ').charAt(0).toUpperCase() + formData.status?.replace('_', ' ').slice(1)}
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
                                        autoFocus
                                        className="w-full text-sm font-medium bg-transparent border-none outline-none"
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
                                        className="w-full text-left text-sm font-medium hover:bg-accent rounded px-1"
                                    >
                                        {formData.severity?.charAt(0).toUpperCase() + formData.severity?.slice(1)}
                                    </button>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Severity</p>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-3">
                                <button className="w-full text-left text-sm font-medium hover:bg-accent rounded px-1">
                                    {formData.assigned_to || 'Unassigned'}
                                </button>
                                <p className="text-xs text-muted-foreground mt-1">Assignee</p>
                            </div>

                            {sprints.length > 0 && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <button className="w-full text-left text-sm font-medium hover:bg-accent rounded px-1 truncate">
                                        {formData.sprint_id
                                            ? sprints.find(s => s.id === formData.sprint_id)?.name || 'Unknown'
                                            : 'No Sprint'}
                                    </button>
                                    <p className="text-xs text-muted-foreground mt-1">Sprint</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {formData.description && (
                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Description
                                    </h3>
                                    <button onClick={() => toggleSection('description')} className="text-muted-foreground hover:text-foreground">
                                        {collapsedSections.has('description') ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                    </button>
                                </div>
                                {!collapsedSections.has('description') && (
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{formData.description}</p>
                                )}
                            </div>
                        )}

                        {/* Steps to Reproduce */}
                        {formData.steps_to_reproduce && (
                            <div className="bg-muted/30 rounded-lg p-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                    <AlertCircle className="h-4 w-4 text-warning" />
                                    Steps to Reproduce
                                </h3>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{formData.steps_to_reproduce}</p>
                            </div>
                        )}

                        {/* Expected vs Actual */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.expected_behavior && (
                                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                        Expected
                                    </h3>
                                    <p className="text-sm">{formData.expected_behavior}</p>
                                </div>
                            )}
                            {formData.actual_behavior && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                        <XCircle className="h-4 w-4 text-destructive" />
                                        Actual
                                    </h3>
                                    <p className="text-sm">{formData.actual_behavior}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Details Tab with Video Player */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Video Player Section */}
                        {formData.linked_recording_id && (
                            <div className="bg-muted/30 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Video className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-sm font-semibold">Linked Recording</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {linkedRecording?.title || 'Loading...'}
                                            </p>
                                        </div>
                                    </div>
                                    {isVideoExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>

                                {isVideoExpanded && (
                                    <div className="p-4 pt-0">
                                        {isLoadingVideo ? (
                                            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                                                <div className="text-white text-sm">Loading video...</div>
                                            </div>
                                        ) : linkedRecording ? (
                                            <div className="bg-black rounded-lg overflow-hidden">
                                                <div className="aspect-video relative">
                                                    {getVideoEmbedUrl(linkedRecording) ? (
                                                        <iframe
                                                            src={getVideoEmbedUrl(linkedRecording)}
                                                            title={linkedRecording.title}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            className="w-full h-full border-0"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-white">
                                                            <div className="text-center">
                                                                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                                <p className="text-sm">Video unavailable</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 bg-black/50">
                                                    <div className="flex items-center justify-between text-white text-xs">
                                                        <span>{linkedRecording.title}</span>
                                                        <button
                                                            onClick={() => setIsFullscreen(true)}
                                                            className="flex items-center gap-1 hover:text-primary transition-colors"
                                                            title="Open in fullscreen"
                                                        >
                                                            Open
                                                            <ExternalLink className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                                                <div className="text-white text-sm">Failed to load video</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Environment Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <Settings className="w-3.5 h-3.5" />
                                    <span className="font-medium">Environment</span>
                                </div>
                                <p className="text-sm font-medium">{formData.environment || 'Not specified'}</p>
                            </div>
                            {bug.created_at && (
                                <div className="bg-muted/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="font-medium">Created</span>
                                    </div>
                                    <p className="text-sm font-medium">{formatDate(bug.created_at)}</p>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {formData.tags && Array.isArray(formData.tags) && formData.tags.length > 0 && (
                            <div className="bg-muted/30 rounded-lg p-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                    <Tag className="h-4 w-4" />
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag: any, idx: number) => (
                                        <Badge key={idx} variant="default" size="sm">{String(tag)}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Links Tab */}
                {activeTab === 'links' && bug.suite_id && (
                    <AssetLinkerInline
                        assetType="bug"
                        assetId={bug.id}
                        suiteId={bug.suite_id}
                        editable={true}
                    />
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto mb-4">
                            {comments.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground text-sm">No comments yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {comments.map((comment: any) => (
                                        <div key={comment.id} className="bg-muted/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium">{comment.user}</span>
                                                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="border-t border-border pt-4">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    rows={2}
                                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background resize-none"
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div className="space-y-3">
                        {activities.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground text-sm">No activity yet</p>
                            </div>
                        ) : (
                            activities.map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Activity className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm">{activity.action}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.created_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}