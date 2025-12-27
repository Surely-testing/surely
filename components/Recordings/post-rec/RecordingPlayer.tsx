'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Recording, ConsoleLog, NetworkLog } from '@/types/recording.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { logger } from '@/lib/utils/logger';
import {
  Share2,
  Download,
  ExternalLink,
  Play,
  Bot,
  Brain,
  Bug as BugIcon,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { AIInsights, AIInsight } from '@/components/ai/AIInsights';
import { convertInsightToBugData } from '../../../lib/helpers/bugPrefillHelper';
import { AnnotationPlaybackOverlay } from './AnnotationPlaybackOverlay';
import type { Annotation } from '@/lib/recording/annotation-system';

interface RecordingPlayerProps {
  recording: Recording;
  suite: { id: string; name: string };
  sprint?: { id: string; name: string } | null;
  embeddedInBugDrawer?: boolean;
}

export function RecordingPlayer({ 
  recording, 
  suite, 
  sprint,
  embeddedInBugDrawer = false 
}: RecordingPlayerProps) {
  const router = useRouter();
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // AI Insights state
  const [showAIInsights, setShowAIInsights] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [recording]);

  // Video time tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentVideoTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const loadLogs = async () => {
    setIsLoadingLogs(true);

    try {
      const metadata = recording.metadata as any;

      // Load console logs
      if (metadata?.consoleLogs && Array.isArray(metadata.consoleLogs)) {
        setConsoleLogs(metadata.consoleLogs);
      } else if (metadata?.consoleLogsUrl) {
        try {
          const response = await fetch(metadata.consoleLogsUrl);
          if (response.ok) {
            const data = await response.json();
            setConsoleLogs(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          logger.log('Error loading console logs:', error);
        }
      }

      // Load network logs
      if (metadata?.networkLogs && Array.isArray(metadata.networkLogs)) {
        setNetworkLogs(metadata.networkLogs);
      } else if (metadata?.networkLogsUrl) {
        try {
          const response = await fetch(metadata.networkLogsUrl);
          if (response.ok) {
            const data = await response.json();
            setNetworkLogs(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          logger.log('Error loading network logs:', error);
        }
      }

      // Load annotations
      if (metadata?.annotations && Array.isArray(metadata.annotations)) {
        setAnnotations(metadata.annotations);
      } else if (metadata?.annotationsUrl) {
        try {
          const response = await fetch(metadata.annotationsUrl);
          if (response.ok) {
            const data = await response.json();
            setAnnotations(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          logger.log('Error loading annotations:', error);
        }
      }
    } catch (error) {
      logger.log('Error loading logs:', error);
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

  const formatAnnotationTime = (timestamp: number) => {
    const mins = Math.floor(timestamp / 60);
    const secs = Math.floor(timestamp % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoUrl = (): string => {
    return recording.url || '';
  };

  // Handle AI Insights callbacks
  const handleSaveInsights = (insights: AIInsight[]) => {
    logger.log('Saved insights:', insights);
    toast.success(`Saved ${insights.length} AI insights`);
  };

  const handleCreateBug = (insight: AIInsight) => {
    try {
      const metadata = recording.metadata as any;

      // Convert AI insight to bug form data
      const bugData = convertInsightToBugData(insight, recording.id, {
        browser: metadata?.browser,
        os: metadata?.os,
        environment: metadata?.environment || 'production',
        consoleLogs,
        networkLogs
      });

      // Store in sessionStorage for the bug form to pick up
      sessionStorage.setItem('bugPrefillData', JSON.stringify(bugData));

      // Navigate to bug creation page
      router.push(`/dashboard/bugs?from_recording=${recording.id}&insight_id=${insight.id}&show_form=true`);

      toast.success('Opening bug form with AI-generated details...');
    } catch (error) {
      logger.log('Error creating bug from insight:', error);
      toast.error('Failed to prepare bug data');
    }
  };

  const metadata = recording.metadata as any;
  const createdAt = recording.created_at ? new Date(recording.created_at) : new Date();
  const videoUrl = getVideoUrl();

  return (
    <div className="w-full">
      {/* Back and Share Buttons - Top Row */}
      {!embeddedInBugDrawer ? (
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={() => window.history.back()} className="gap-2">
            <ExternalLink className="h-4 w-4 rotate-180" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/bugs?from_recording=${recording.id}&show_form=true`)}
              className="gap-2"
            >
              <BugIcon className="h-4 w-4" />
              Report Bug
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end items-center mb-4">
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      )}

      {/* YouTube-style Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Column - Video Player (70%) */}
        <div className="lg:w-[70%] space-y-4">
          {/* Video Player */}
          <div className="bg-black rounded-xl overflow-hidden">
            <div className="aspect-video relative">
              {videoUrl ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                    onError={() => setVideoError(true)}
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Annotation overlay */}
                  {annotations.length > 0 && (
                    <AnnotationPlaybackOverlay
                      annotations={annotations}
                      currentTime={currentVideoTime}
                      isPlaying={!videoRef.current?.paused}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center px-4">
                    <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Video unavailable</p>
                    <p className="text-sm text-gray-400">No video URL provided</p>
                  </div>
                </div>
              )}

              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center text-white px-4">
                    <p className="text-lg mb-2">Failed to load video</p>
                    <p className="text-sm text-gray-400">
                      The video may be unavailable or corrupted
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-3">
            <h1 className="text-xl font-semibold">{recording.title}</h1>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </span>
                {recording.duration && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(recording.duration)}</span>
                  </>
                )}
                {metadata?.resolution && (
                  <>
                    <span>•</span>
                    <span>{metadata.resolution}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{suite.name}</Badge>
              {sprint && <Badge variant="primary">{sprint.name}</Badge>}
              {consoleLogs.length > 0 && (
                <Badge variant="warning">{consoleLogs.filter(l => l.type === 'error').length} Errors</Badge>
              )}
              {networkLogs.length > 0 && (
                <Badge variant="default">{networkLogs.length} Network Requests</Badge>
              )}
              {annotations.length > 0 && (
                <Badge variant="default">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {annotations.length} Annotations
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - AI Insights & Logs Tabs (30%) */}
        <div className="lg:w-[30%]">
          <Tabs defaultValue="ai-insights" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-4">
              <TabsTrigger value="ai-insights" className="text-xs gap-1">
                <Bot className="h-3 w-3" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="text-xs">
                Info
              </TabsTrigger>
              <TabsTrigger value="console" className="text-xs">
                Console
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs">
                Network
              </TabsTrigger>
              <TabsTrigger value="annotations" className="text-xs">
                Notes
              </TabsTrigger>
              <TabsTrigger value="screenshots" className="text-xs">
                Shots
              </TabsTrigger>
            </TabsList>

            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      AI Insights
                    </CardTitle>
                    <Button
                      onClick={() => setShowAIInsights(!showAIInsights)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                    >
                      {showAIInsights ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <AIInsights
                    consoleLogs={consoleLogs}
                    networkLogs={networkLogs}
                    detectedIssues={[]}
                    duration={recording.duration || 0}
                    isEnabled={showAIInsights}
                    onSaveHighlights={handleSaveInsights}
                    onCreateBug={handleCreateBug}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Recording Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">
                      Duration
                    </dt>
                    <dd className="text-sm font-mono">
                      {formatDuration(recording.duration)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">
                      Resolution
                    </dt>
                    <dd className="text-sm">{metadata?.resolution || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">
                      Created
                    </dt>
                    <dd className="text-sm">
                      {createdAt.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">
                      Browser
                    </dt>
                    <dd className="text-sm">{metadata?.browser || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">
                      Operating System
                    </dt>
                    <dd className="text-sm">{metadata?.os || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">
                      Test Suite
                    </dt>
                    <dd className="text-sm">{suite.name}</dd>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="console" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Console Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {isLoadingLogs ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Loading logs...
                      </p>
                    ) : consoleLogs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        No console logs available
                      </p>
                    ) : (
                      <div className="space-y-2 font-mono text-xs">
                        {consoleLogs.map((log, index) => (
                          <div key={index} className="flex gap-2 pb-2 border-b">
                            <span className="text-muted-foreground shrink-0 text-[10px]">
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
                            <span className="break-all text-[11px]">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Network Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {isLoadingLogs ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Loading network logs...
                      </p>
                    ) : networkLogs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        No network activity recorded
                      </p>
                    ) : (
                      <div className="divide-y">
                        {networkLogs.map((log, index) => (
                          <div key={index} className="py-3 text-xs hover:bg-muted/50">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="info" className="text-[10px] px-1.5 py-0">
                                  {log.method}
                                </Badge>
                                <span
                                  className={
                                    log.status && log.status >= 200 && log.status < 300
                                      ? 'text-green-600 font-semibold text-[11px]'
                                      : log.status && log.status >= 400
                                        ? 'text-red-600 font-semibold text-[11px]'
                                        : 'text-yellow-600 font-semibold text-[11px]'
                                  }
                                >
                                  {log.status || 'pending'}
                                </span>
                                {log.duration && (
                                  <span className="text-muted-foreground text-[10px]">
                                    {log.duration}ms
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-muted-foreground text-[10px] break-all">
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

            <TabsContent value="annotations" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Annotations Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {isLoadingLogs ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Loading annotations...
                      </p>
                    ) : annotations.length > 0 ? (
                      <div className="space-y-3">
                        {annotations.map((annotation) => (
                          <div
                            key={annotation.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = annotation.timestamp;
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="info" className="text-[10px]">
                                {annotation.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatAnnotationTime(annotation.timestamp)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border shrink-0"
                                style={{ backgroundColor: annotation.color }}
                              />
                              {annotation.text && (
                                <span className="text-xs">{annotation.text}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        No annotations in this recording
                      </p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="screenshots" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Screenshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {metadata?.screenshotUrls?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
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
                              <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        No screenshots captured
                      </p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}