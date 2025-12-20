// ============================================
// components/recordings/RecordingGrid.tsx
// Grid with video preview on hover and delete dialog
// ============================================
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Recording } from '@/types/recording.types';
import { Badge } from '@/components/ui/Badge';
import { Play, Clock, Calendar, Trash2, Video, Link2, CheckSquare, Square, Bug, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deleteRecording } from '@/lib/actions/recordings';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';

interface RecordingGridProps {
  recordings: Recording[];
  onDelete?: () => void;
  selectedRecordings?: string[];
  onToggleSelection?: (recordingId: string) => void;
  viewMode?: 'grid' | 'list';
  isDeletingIds?: Set<string>;
}

export function RecordingGrid({ 
  recordings, 
  onDelete, 
  selectedRecordings = [], 
  onToggleSelection,
  isDeletingIds = new Set()
}: RecordingGridProps) {
  const [localDeletingId, setLocalDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null);

  const handleDeleteClick = (recording: Recording, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecordingToDelete(recording);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordingToDelete) return;

    setLocalDeletingId(recordingToDelete.id);
    setDeleteDialogOpen(false);
    const toastId = toast.loading('Deleting recording...');

    try {
      const { success, error } = await deleteRecording(recordingToDelete.id);

      if (error || !success) {
        toast.error(error || 'Failed to delete recording', { id: toastId });
      } else {
        toast.success('Recording deleted successfully', { id: toastId });
        
        if (selectedRecordings?.includes(recordingToDelete.id)) {
          onToggleSelection?.(recordingToDelete.id);
        }
        
        onDelete?.();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete recording', { id: toastId });
    } finally {
      setLocalDeletingId(null);
      setRecordingToDelete(null);
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

    // First try to get the first screenshot as thumbnail
    if (metadata?.screenshotUrls && metadata.screenshotUrls.length > 0) {
      return metadata.screenshotUrls[0];
    }

    // Fallback to custom thumbnail if exists
    if (metadata?.thumbnailUrl) {
      return metadata.thumbnailUrl;
    }

    return null;
  };

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
        <p className="text-sm text-muted-foreground">
          Start recording your test sessions to see them here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recordings.map((recording) => {
          const thumbnailUrl = getThumbnailUrl(recording);
          const createdAt = recording.created_at ? new Date(recording.created_at) : new Date();
          const isSelected = selectedRecordings.includes(recording.id);
          const isDeleting = isDeletingIds.has(recording.id) || localDeletingId === recording.id;
          const metadata = recording.metadata as any;

          return (
            <RecordingCard
              key={recording.id}
              recording={recording}
              thumbnailUrl={thumbnailUrl}
              createdAt={createdAt}
              isSelected={isSelected}
              isDeleting={isDeleting}
              metadata={metadata}
              formatDuration={formatDuration}
              onToggleSelection={onToggleSelection}
              handleShare={handleShare}
              handleDelete={handleDeleteClick}
            />
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-foreground/20 backdrop-blur-sm"
          onClick={() => setDeleteDialogOpen(false)}
        >
          <div
            className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 border border-border animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground mb-2">Delete Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-foreground">
                    "{recordingToDelete?.title}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-600/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function RecordingCard({
  recording,
  thumbnailUrl,
  createdAt,
  isSelected,
  isDeleting,
  metadata,
  formatDuration,
  onToggleSelection,
  handleShare,
  handleDelete,
}: {
  recording: Recording;
  thumbnailUrl: string | null;
  createdAt: Date;
  isSelected: boolean;
  isDeleting: boolean;
  metadata: any;
  formatDuration: (seconds: number | null) => string;
  onToggleSelection?: (recordingId: string) => void;
  handleShare: (recording: Recording, e: React.MouseEvent) => void;
  handleDelete: (recording: Recording, e: React.MouseEvent) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    
    // Delay before playing video to avoid flickering on quick hovers
    hoverTimeoutRef.current = setTimeout(() => {
      if (recording.url && videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.log('Autoplay prevented:', err);
        });
        setShowVideo(true);
      }
    }, 500); // 500ms delay before playing
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    
    // Clear timeout if user leaves before video plays
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Pause and reset video
    setShowVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`rounded-md border overflow-hidden transition-all duration-300 ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      } ${
        isSelected
          ? 'bg-teal-50 dark:bg-primary/20 border-primary shadow-xl ring-1 ring-primary/50'
          : 'bg-card border-border hover:shadow-xl'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/dashboard/recordings/${recording.id}`}>
        <div className="relative aspect-video bg-muted overflow-hidden cursor-pointer group">
          {/* Always show video element - it will display first frame as preview */}
          {recording.url ? (
            <video
              ref={videoRef}
              src={recording.url}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : thumbnailUrl ? (
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

          {/* Play button overlay - only show when not playing video */}
          {!showVideo && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center z-[2]">
              <div className="w-16 h-16 rounded-full border-[3px] border-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Selection checkbox */}
          <div
            className={`absolute top-2 left-2 transition-opacity duration-200 z-10 ${
              isSelected || isHovering ? 'opacity-100' : 'opacity-0'
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

          {/* Share button */}
          <div
            className={`absolute top-2 right-2 transition-opacity duration-200 z-10 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={(e) => handleShare(recording, e)}
          >
            <button className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg">
              <Link2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Duration badge */}
          {recording.duration && (
            <Badge
              variant="default"
              className="absolute bottom-2 left-2 bg-black/70 text-white border-0 z-10"
            >
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(recording.duration)}
            </Badge>
          )}

          {/* Issues badge */}
          {metadata?.detectedIssues?.length > 0 && (
            <div className="absolute bottom-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded flex items-center space-x-1 z-10">
              <Bug className="w-3 h-3" />
              <span>{metadata.detectedIssues.length}</span>
            </div>
          )}
        </div>
      </Link>

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
            onClick={(e) => handleDelete(recording, e)}
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

        {metadata?.resolution && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {metadata.resolution}
          </div>
        )}
      </div>
    </div>
  );
}