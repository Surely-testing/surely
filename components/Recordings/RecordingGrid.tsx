
// ============================================
// components/recordings/RecordingGrid.tsx
// Grid with selection, bulk actions, and pagination
// ============================================
'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Recording } from '@/types/recording.types';
import { Badge } from '@/components/ui/Badge';
import { Play, Clock, Calendar, MoreVertical, Trash2, Video, Link2, CheckSquare, Square, Bug } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deleteRecording } from '@/lib/actions/recordings';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

// This is all that's needed:
interface RecordingGridProps {
  recordings: Recording[];
  onDelete?: () => void;
  selectedRecordings?: string[];
  onToggleSelection?: (recordingId: string) => void;
  viewMode?: 'grid' | 'list';
}

// Utility functions
const getYouTubeVideoId = (url: string | null) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const isYouTubeUrl = (url: string | null) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export function RecordingGrid({ recordings, onDelete, selectedRecordings = [], onToggleSelection }: RecordingGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (recordingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this recording?')) return;

    setDeletingId(recordingId);
    try {
      const { error } = await deleteRecording(recordingId);

      if (error) {
        toast.error('Failed to delete recording');
      } else {
        toast.success('Recording deleted');
        // Remove from selection if it was selected
        if (selectedRecordings?.includes(recordingId)) {
          onToggleSelection?.(recordingId);
        }
        onDelete?.();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (recording: Recording, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const shareUrl = `${window.location.origin}/dashboard/recordings/${recording.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThumbnailUrl = (recording: Recording) => {
    const metadata = recording.metadata as any;

    if (metadata?.thumbnailUrl) {
      return metadata.thumbnailUrl;
    }

    const url = recording.url;
    if (url) {
      const youtubeVideoId = getYouTubeVideoId(url);
      if (youtubeVideoId) {
        return `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`;
      }
    }

    if (metadata?.screenshotUrls && metadata.screenshotUrls.length > 0) {
      return metadata.screenshotUrls[0];
    }

    return null;
  };

  const handleBulkAction = useCallback(async (actionId: string, selectedIds: string[]) => {
    // This is now just a placeholder - actual logic is in RecordingsView
    console.log('Bulk action:', actionId, selectedIds);
  }, []);

  return (
    <>
      {recordings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
          <p className="text-sm text-muted-foreground">
            Start recording your test sessions to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recordings.map((recording) => {
            const thumbnailUrl = getThumbnailUrl(recording);
            const createdAt = recording.created_at ? new Date(recording.created_at) : new Date();
            const isSelected = selectedRecordings.includes(recording.id);
            const isDeleting = deletingId === recording.id;
            const metadata = recording.metadata as any;
            const [isHovering, setIsHovering] = useState(false);

            return (
              <div
                key={recording.id}
                className={`rounded-md border overflow-hidden transition-all duration-300 ${isSelected
                    ? 'bg-teal-50 dark:bg-primary/20 border-primary shadow-xl ring-1 ring-primary/50'
                    : 'bg-card border-border hover:shadow-xl'
                  }`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <Link href={`/dashboard/recordings/${recording.id}`}>
                  <div className="relative aspect-video bg-muted overflow-hidden cursor-pointer group">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={recording.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Play className="w-12 h-12 text-muted-foreground opacity-30" />
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/0 group-hover:bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>

                    {/* Select Checkbox - Top Left */}
                    <div
                      className={`absolute top-2 left-2 transition-opacity duration-200 ${isSelected || isHovering ? 'opacity-100' : 'opacity-0'
                        }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSelection?.(recording.id);
                      }}
                    >
                      <button className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Share Button - Top Right */}
                    <div
                      className={`absolute top-2 right-2 transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'
                        }`}
                      onClick={(e) => handleShare(recording, e)}
                    >
                      <button className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg">
                        <Link2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>

                    {/* Duration - Bottom Left */}
                    {recording.duration && (
                      <Badge
                        variant="default"
                        className="absolute bottom-2 left-2 bg-black/70 text-white border-0"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(recording.duration)}
                      </Badge>
                    )}

                    {/* Issues Badge - Bottom Right */}
                    {metadata?.detectedIssues?.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded flex items-center space-x-1">
                        <Bug className="w-3 h-3" />
                        <span>{metadata.detectedIssues.length}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info Section */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3 text-[11px] text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>{metadata?.consoleLogs?.length || 0} logs</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>{metadata?.networkLogs?.length || 0} requests</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(recording.id, e)}
                      disabled={isDeleting}
                      className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(createdAt, { addSuffix: true })}
                  </div>

                  <h3 className="font-medium text-foreground text-sm line-clamp-2">
                    {recording.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}