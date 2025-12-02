'use client';

import { useState, useEffect } from 'react';
import { Recording, ConsoleLog, NetworkLog } from '@/types/recording.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Share2,
  Download,
  Calendar,
  Clock,
  Monitor,
  Activity,
  Network,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface RecordingPlayerProps {
  recording: Recording;
  suite: { id: string; name: string };
  sprint?: { id: string; name: string } | null;
}

export function RecordingPlayer({ recording, suite, sprint }: RecordingPlayerProps) {
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [recording]);

  const loadLogs = async () => {
    setIsLoadingLogs(true);

    try {
      const metadata = recording.metadata as any;

      // Load console logs
      if (metadata?.consoleLogsUrl) {
        const response = await fetch(metadata.consoleLogsUrl);
        const data = await response.json();
        setConsoleLogs(data);
      }

      // Load network logs
      if (metadata?.networkLogsUrl) {
        const response = await fetch(metadata.networkLogsUrl);
        const data = await response.json();
        setNetworkLogs(data);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleShare = async () => {
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

  const formatLogTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getVideoEmbedUrl = () => {
    const metadata = recording.metadata as any;
    
    // First, try to use the embedUrl from metadata
    if (metadata?.embedUrl) {
      return metadata.embedUrl;
    }

    // Second, try to use videoId from metadata
    if (metadata?.videoId) {
      return `https://www.youtube.com/embed/${metadata.videoId}`;
    }

    // Third, try to extract video ID from the URL
    const url = recording.url;
    if (!url) return '';

    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }

    // If it's already an embed URL or direct video URL, return as is
    if (url.includes('youtube.com/embed/') || url.includes('.mp4') || url.includes('.webm')) {
      return url;
    }

    return '';
  };

  const metadata = recording.metadata as any;
  const createdAt = recording.created_at ? new Date(recording.created_at) : new Date();
  const embedUrl = getVideoEmbedUrl();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{recording.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </div>
            {recording.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(recording.duration)}
              </div>
            )}
            {metadata?.resolution && (
              <div className="flex items-center gap-1">
                <Monitor className="h-4 w-4" />
                {metadata.resolution}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="info">{suite.name}</Badge>
            {sprint && <Badge variant="primary">{sprint.name}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={recording.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in YouTube
            </a>
          </Button>
        </div>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          <div className="aspect-video bg-black">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={recording.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <p className="text-lg mb-2">Video unavailable</p>
                  <p className="text-sm text-gray-400">
                    The video URL is invalid or missing
                  </p>
                  {recording.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      asChild
                    >
                      <a
                        href={recording.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Try opening directly
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono space-y-1">
              <div>URL: {recording.url || 'null'}</div>
              <div>Video ID: {metadata?.videoId || 'null'}</div>
              <div>Embed URL: {metadata?.embedUrl || 'null'}</div>
              <div>Computed Embed: {embedUrl || 'null'}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs and Details */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">
            <Activity className="h-4 w-4 mr-2" />
            Info
          </TabsTrigger>
          <TabsTrigger value="console">
            <Activity className="h-4 w-4 mr-2" />
            Console ({consoleLogs.length})
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="h-4 w-4 mr-2" />
            Network ({networkLogs.length})
          </TabsTrigger>
          <TabsTrigger value="screenshots">
            <ImageIcon className="h-4 w-4 mr-2" />
            Screenshots ({metadata?.screenshotUrls?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Recording Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">
                    Duration
                  </dt>
                  <dd className="text-sm font-mono">
                    {formatDuration(recording.duration)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">
                    Resolution
                  </dt>
                  <dd className="text-sm">{metadata?.resolution || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">
                    Created
                  </dt>
                  <dd className="text-sm">
                    {createdAt.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">
                    Browser
                  </dt>
                  <dd className="text-sm">{metadata?.browser || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">
                    Operating System
                  </dt>
                  <dd className="text-sm">{metadata?.os || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">
                    Test Suite
                  </dt>
                  <dd className="text-sm">{suite.name}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="console">
          <Card>
            <CardHeader>
              <CardTitle>Console Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {isLoadingLogs ? (
                  <p className="text-center text-muted-foreground py-8">
                    Loading logs...
                  </p>
                ) : consoleLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No console logs available
                  </p>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {consoleLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 pb-2 border-b">
                        <span className="text-muted-foreground shrink-0">
                          {formatLogTime(log.timestamp)}
                        </span>
                        <span
                          className={
                            log.type === 'error'
                              ? 'text-red-500 shrink-0'
                              : log.type === 'warn'
                              ? 'text-yellow-500 shrink-0'
                              : log.type === 'info'
                              ? 'text-blue-500 shrink-0'
                              : 'text-foreground shrink-0'
                          }
                        >
                          [{log.type}]
                        </span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {isLoadingLogs ? (
                  <p className="text-center text-muted-foreground py-8">
                    Loading network logs...
                  </p>
                ) : networkLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No network activity recorded
                  </p>
                ) : (
                  <div className="divide-y">
                    {networkLogs.map((log, index) => (
                      <div key={index} className="py-3 text-sm hover:bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="info">
                              {log.method}
                            </Badge>
                            <span
                              className={
                                log.status && log.status >= 200 && log.status < 300
                                  ? 'text-green-600 font-semibold'
                                  : log.status && log.status >= 400
                                  ? 'text-red-600 font-semibold'
                                  : 'text-yellow-600 font-semibold'
                              }
                            >
                              {log.status || 'pending'}
                            </span>
                            {log.duration && (
                              <span className="text-muted-foreground">
                                {log.duration}ms
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatLogTime(log.timestamp)}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs break-all">
                          {log.url}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screenshots">
          <Card>
            <CardHeader>
              <CardTitle>Screenshots</CardTitle>
            </CardHeader>
            <CardContent>
              {metadata?.screenshotUrls?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {metadata.screenshotUrls.map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video overflow-hidden rounded-lg border bg-muted hover:ring-2 ring-primary transition-all"
                    >
                      <img
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No screenshots captured
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}