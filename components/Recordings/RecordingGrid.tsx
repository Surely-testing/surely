// ============================================
// components/recordings/RecordingGrid.tsx
// ============================================

'use client';

import { Recording } from '@/types/recording.types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import {
  Play,
  MoreVertical,
  Share2,
  Download,
  Trash2,
  Clock,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { deleteRecording } from '@/lib/actions/recordings';
import { toast } from 'sonner';
import { useState } from 'react';

interface RecordingGridProps {
  recordings: Recording[];
  onDelete?: () => void;
}

export function RecordingGrid({ recordings, onDelete }: RecordingGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (recordingId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(recordingId);
    const { success, error } = await deleteRecording(recordingId);

    if (success) {
      toast.success('Recording deleted');
      onDelete?.();
    } else {
      toast.error(error || 'Failed to delete recording');
    }
    setDeletingId(null);
  };

  const handleShare = async (recording: Recording) => {
    const shareUrl = `${window.location.origin}/dashboard/recordings/${recording.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
        <p className="text-muted-foreground mb-4">
          Start recording your screen to capture test sessions
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recordings.map((recording) => (
        <Card key={recording.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-video bg-black">
            {/* Video Thumbnail */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                href={`/dashboard/recordings/${recording.id}`}
                className="group"
              >
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Play className="h-8 w-8 text-primary-foreground ml-1" />
                </div>
              </Link>
            </div>

            {/* Duration Badge */}
            {recording.duration && (
              <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(recording.duration)}
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link
                href={`/dashboard/recordings/${recording.id}`}
                className="flex-1"
              >
                <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                  {recording.title}
                </h3>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 shrink-0"
                    disabled={deletingId === recording.id}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/recordings/${recording.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      View Recording
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(recording)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={recording.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Open in YouTube
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(recording.id, recording.title)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(recording.created_at ? new Date(recording.created_at) : new Date(), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}