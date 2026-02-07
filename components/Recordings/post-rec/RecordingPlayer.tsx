'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
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
  ExternalLink,
  Bug as BugIcon,
  Brain,
  Bot,
  Play,
  Pause,
  SkipBack,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { AIInsights, AIInsight } from '@/components/ai/AIInsights';
import { convertInsightToBugData } from '../../../lib/helpers/bugPrefillHelper';
import type { eventWithTime } from '@rrweb/types';
import { ReplayController } from './Replaycontroller';
import { NetworkPanel } from './NetworkPanel';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rrwebEvents, setRRWebEvents] = useState<eventWithTime[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [replayError, setReplayError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const replayContainerRef = useRef<HTMLDivElement>(null);
  const rrwebPlayerRef = useRef<any>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const metadata = recording.metadata as any;
  const createdAt = recording.created_at ? new Date(recording.created_at) : new Date();
  const videoUrl = recording.url || '';
  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load rrweb events
        if (metadata?.rrwebEvents && Array.isArray(metadata.rrwebEvents)) {
          logger.log('Loading rrweb events from metadata:', metadata.rrwebEvents.length);
          setRRWebEvents(metadata.rrwebEvents);
        } else if (metadata?.rrwebEventsUrl) {
          logger.log('Fetching rrweb events from URL:', metadata.rrwebEventsUrl);
          const res = await fetch(metadata.rrwebEventsUrl);
          if (res.ok) {
            const data = await res.json();
            logger.log('Fetched rrweb events:', data.length);
            setRRWebEvents(Array.isArray(data) ? data : []);
          }
        }
        // Load console logs
        if (metadata?.consoleLogs && Array.isArray(metadata.consoleLogs)) {
          logger.log('Loading console logs from metadata:', metadata.consoleLogs.length);
          setConsoleLogs(metadata.consoleLogs);
        } else if (metadata?.consoleLogsUrl) {
          logger.log('Fetching console logs from URL:', metadata.consoleLogsUrl);
          const res = await fetch(metadata.consoleLogsUrl);
          if (res.ok) {
            const data = await res.json();
            logger.log('Fetched console logs:', data.length);
            setConsoleLogs(Array.isArray(data) ? data : []);
          }
        }
        // Load network logs
        if (metadata?.networkLogs && Array.isArray(metadata.networkLogs)) {
          logger.log('Loading network logs from metadata:', metadata.networkLogs.length);
          setNetworkLogs(metadata.networkLogs);
        } else if (metadata?.networkLogsUrl) {
          logger.log('Fetching network logs from URL:', metadata.networkLogsUrl);
          const res = await fetch(metadata.networkLogsUrl);
          if (res.ok) {
            const data = await res.json();
            logger.log('Fetched network logs:', data.length);
            setNetworkLogs(Array.isArray(data) ? data : []);
          }
        }
      } catch (error) {
        logger.log('Error loading data:', error);
        toast.error('Failed to load recording data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [recording.id]);
  // Initialize rrweb when events are loaded
  useEffect(() => {
    if (!rrwebEvents.length || isLoading || !replayContainerRef.current) {
      return;
    }
    const initRRWeb = async () => {
      try {
        logger.log('🎬 Initializing rrweb overlay with', rrwebEvents.length, 'events');
        const { Replayer } = await import('rrweb');
        // Clear container
        if (replayContainerRef.current) {
          replayContainerRef.current.innerHTML = '';
        }
        const replayer = new Replayer(rrwebEvents, {
          root: replayContainerRef.current!,
          speed: 1,
          skipInactive: false,
          showWarning: false,
          mouseTail: {
            duration: 500,
            lineCap: 'round',
            lineWidth: 2,
            strokeStyle: '#f05a22',
          },
        });
        rrwebPlayerRef.current = replayer;
        // Style the iframe to overlay properly
        setTimeout(() => {
          const iframe = replayContainerRef.current?.querySelector('iframe');
          if (iframe) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.display = 'block';
            iframe.style.pointerEvents = 'none'; // Allow clicks through to video
            logger.log('✅ RRWeb iframe styled as overlay');
          }
        }, 200);
        logger.log('✅ RRWeb overlay initialized');
        setReplayError(null);
      } catch (error) {
        logger.log('❌ RRWeb initialization error:', error);
        setReplayError(error instanceof Error ? error.message : 'Failed to initialize replay overlay');
      }
    };
    initRRWeb();
    return () => {
      if (rrwebPlayerRef.current) {
        try {
          rrwebPlayerRef.current.destroy?.();
        } catch (e) {
          logger.log('Error destroying replayer:', e);
        }
        rrwebPlayerRef.current = null;
      }
    };
  }, [rrwebEvents, isLoading]);
  // Sync rrweb with video currentTime
  useEffect(() => {
    if (!videoRef.current || !rrwebPlayerRef.current) return;
    const syncRRWeb = () => {
      if (videoRef.current && rrwebPlayerRef.current) {
        const videoTimeMs = videoRef.current.currentTime * 1000;
        try {
          rrwebPlayerRef.current.pause(videoTimeMs);
          setCurrentTime(videoTimeMs);
        } catch (e) {
          logger.log('Sync error:', e);
        }
      }
    };
    // Sync on video time update
    const video = videoRef.current;
    video.addEventListener('timeupdate', syncRRWeb);
    video.addEventListener('seeked', syncRRWeb);
    return () => {
      video.removeEventListener('timeupdate', syncRRWeb);
      video.removeEventListener('seeked', syncRRWeb);
    };
  }, [rrwebPlayerRef.current, videoRef.current]);
  // Update duration when video metadata loads
  useEffect(() => {
    if (!videoRef.current) return;
    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        const durationMs = videoRef.current.duration * 1000;
        setDuration(durationMs);
        logger.log('📊 Video duration:', durationMs / 1000, 'seconds');
      }
    };
    const video = videoRef.current;
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      if (rrwebPlayerRef.current) {
        rrwebPlayerRef.current.pause();
      }
    } else {
      video.play();
      if (rrwebPlayerRef.current) {
        const currentTimeMs = video.currentTime * 1000;
        rrwebPlayerRef.current.play(currentTimeMs);
      }
    }
    setIsPlaying(!isPlaying);
  };
  const handleSeek = (timeMs: number) => {
    const video = videoRef.current;
    if (!video) return;
    const timeSeconds = timeMs / 1000;
    video.currentTime = timeSeconds;
   
    if (rrwebPlayerRef.current) {
      rrwebPlayerRef.current.pause(timeMs);
      if (isPlaying) {
        rrwebPlayerRef.current.play(timeMs);
      }
    }
   
    setCurrentTime(timeMs);
  };
  const handleRestart = () => {
    handleSeek(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play();
      }
    }
  };
  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/recordings/${recording.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };
  const handleCreateBug = (insight: AIInsight) => {
    try {
      const bugData = convertInsightToBugData(insight, recording.id, {
        browser: metadata?.browser,
        os: metadata?.os,
        environment: metadata?.environment || 'production',
        consoleLogs,
        networkLogs
      });
      sessionStorage.setItem('bugPrefillData', JSON.stringify(bugData));
      router.push(`/dashboard/bugs?from_recording=${recording.id}&insight_id=${insight.id}&show_form=true`);
      toast.success('Opening bug form...');
    } catch (error) {
      logger.log('Error creating bug:', error);
      toast.error('Failed to prepare bug data');
    }
  };
  const handleSaveInsights = (insights: AIInsight[]) => {
    logger.log('Saved insights:', insights);
    toast.success(`Saved ${insights.length} insights`);
  };
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  // Time-filtered logs
  const recordingStartTime = useMemo(() => {
    if (rrwebEvents.length > 0) {
      return rrwebEvents[0].timestamp;
    }
    return 0;
  }, [rrwebEvents]);
  const visibleConsoleLogs = useMemo(() => {
    if (!Array.isArray(consoleLogs) || consoleLogs.length === 0) return [];
    const absoluteTime = recordingStartTime + currentTime;
    return consoleLogs.filter(log => log.timestamp <= absoluteTime);
  }, [consoleLogs, currentTime, recordingStartTime]);
  const visibleNetworkLogs = useMemo(() => {
    if (!Array.isArray(networkLogs) || networkLogs.length === 0) return [];
    const absoluteTime = recordingStartTime + currentTime;
    return networkLogs.filter(log => log.timestamp <= absoluteTime);
  }, [networkLogs, currentTime, recordingStartTime]);
  // Markers for timeline
  const markers = useMemo(() => {
    const errorTimes = consoleLogs
      .filter(l => l.type === 'error')
      .map(l => ({
        time: l.timestamp - recordingStartTime,
        type: 'error' as const
      }));
   
    const failTimes = networkLogs
      .filter(l => l.status !== undefined && l.status >= 400)
      .map(l => ({
        time: l.timestamp - recordingStartTime,
        type: 'fail' as const
      }));
   
    const clickTimes = rrwebEvents
      .filter(e => e.type === 3 && e.data.source === 2 && e.data.type === 3)
      .map(e => ({
        time: e.timestamp - recordingStartTime,
        type: 'click' as const
      }));
   
    return [...errorTimes, ...failTimes, ...clickTimes].sort((a, b) => a.time - b.time);
  }, [consoleLogs, networkLogs, rrwebEvents, recordingStartTime]);
  return (
    <div className="w-full">
      {/* Global styles for rrweb overlay */}
      <style jsx global>{`
        .replayer-wrapper {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          pointer-events: none !important;
        }
        .replayer-wrapper iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          display: block !important;
          pointer-events: none !important;
        }
        .replayer-mouse {
          z-index: 10000 !important;
          pointer-events: none !important;
        }
      `}</style>
      {/* Header */}
      {!embeddedInBugDrawer && (
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
      )}
      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Column - Player */}
        <div className="lg:w-[70%] space-y-4">
          {/* Player Area */}
          <div className="bg-black rounded-xl overflow-hidden relative">
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center px-4">
                    <Play className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p className="text-lg mb-2">Loading recording...</p>
                  </div>
                </div>
              ) : !videoUrl ? (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center px-4">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-lg mb-2">No Video Available</p>
                    <p className="text-sm text-gray-400">This recording doesn't have a video file</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                 
                  {/* RRWeb Overlay */}
                  {rrwebEvents.length > 0 && (
                    <div
                      ref={replayContainerRef}
                      className="absolute inset-0 pointer-events-none"
                      style={{ zIndex: 10 }}
                    />
                  )}
                </>
              )}
            </div>
            {/* Integrated Timeline & Controls */}
            {videoUrl && (
              <div className="absolute bottom-0 left-0 right-0 group">
                {/* Background with gradient - only visible on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-0% via-black/50 via-40% to-black/90 to-100% opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out pointer-events-none" />
               
                {/* Timeline - ALWAYS VISIBLE, moves position based on controls visibility */}
                <div className="relative px-6 transition-all duration-700 ease-in-out group-hover:pt-4 group-hover:pb-2 pb-3">
                  <div className="relative h-1 bg-white/30 rounded-full cursor-pointer">
                    {/* Progress - always animating */}
                    <div
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                   
                    {/* Markers - always visible */}
                    {markers.map((marker, idx) => (
                      <div
                        key={idx}
                        className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transform -translate-x-1/2 cursor-pointer hover:scale-150 transition-transform z-10 ${
                          marker.type === 'error'
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]'
                            : marker.type === 'fail'
                              ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]'
                              : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]'
                        }`}
                        style={{ left: `${(marker.time / duration) * 100}%` }}
                        title={`${marker.type} at ${formatTime(marker.time)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeek(marker.time);
                        }}
                      />
                    ))}
                   
                    {/* Seek handle - visible on hover */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg transform -translate-x-1/2 transition-transform duration-500 z-20 pointer-events-none group-hover:scale-125"
                      style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                   
                    {/* Invisible seek input */}
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="absolute -inset-y-2 inset-x-0 w-full opacity-0 cursor-pointer z-30"
                    />
                  </div>
                </div>
                {/* Controls panel - HIDDEN by default, slides in on hover */}
                <div className="relative px-6 pb-4 max-h-0 opacity-0 overflow-hidden group-hover:max-h-24 group-hover:opacity-100 transition-all duration-700 ease-in-out">
                  <div className="flex items-center gap-4 text-white">
                    {/* Play/Pause */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handlePlayPause}
                      className="h-9 w-9 p-0 text-white hover:text-white hover:bg-white/20 rounded-md transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>
                    {/* Skip Back */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRestart}
                      className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20 rounded-md transition-colors"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    {/* Skip Forward */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSeek(Math.min(currentTime + 10000, duration))}
                      className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20 rounded-md transition-colors"
                    >
                      <SkipBack className="h-4 w-4 rotate-180" />
                    </Button>
                    {/* Volume */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !videoRef.current.muted;
                        }
                      }}
                      className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20 rounded-md transition-colors"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.06 5.5 5.5 0 010 7.78.75.75 0 001.06 1.06 7 7 0 000-9.9z"/>
                      </svg>
                    </Button>
                    {/* Spacer */}
                    <div className="flex-1" />
                    {/* Time Display */}
                    <span className="text-sm font-mono text-white/90 tabular-nums min-w-[100px] text-center">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    {/* Speed Control */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (videoRef.current) {
                          const speeds = [0.5, 1, 1.5, 2];
                          const currentSpeed = videoRef.current.playbackRate;
                          const nextIndex = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
                          videoRef.current.playbackRate = speeds[nextIndex];
                        }
                      }}
                      className="h-8 px-3 text-white hover:text-white hover:bg-white/20 rounded-md text-xs font-semibold min-w-[45px] transition-colors"
                    >
                      {videoRef.current?.playbackRate || 1}x
                    </Button>
                    {/* Fullscreen */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const container = videoRef.current?.closest('.relative');
                        if (container) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            container.requestFullscreen();
                          }
                        }
                      }}
                      className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20 rounded-md transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Video Info */}
          <div className="space-y-3">
            <h1 className="text-xl font-semibold">{recording.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
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
            </div>
            {(recording.comment || metadata?.comment) && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {recording.comment || metadata?.comment}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Right Column - Tabs */}
        <div className="lg:w-[30%]">
          <Tabs defaultValue="console" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="console" className="text-xs">
                Console
                {consoleLogs.length > 0 && (
                  <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">
                    {consoleLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs">
                Network
                {networkLogs.length > 0 && (
                  <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">
                    {networkLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
              <TabsTrigger value="ai-insights" className="text-xs gap-1">
                <Bot className="h-3 w-3" />
                AI
              </TabsTrigger>
            </TabsList>
            <TabsContent value="console" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Console Logs</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {visibleConsoleLogs.length} / {consoleLogs.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {consoleLogs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">No console logs captured</p>
                    ) : visibleConsoleLogs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Play recording to see logs
                      </p>
                    ) : (
                      <div className="space-y-2 font-mono text-xs">
                        {visibleConsoleLogs.map((log, index) => (
                          <div
                            key={index}
                            className="flex gap-2 pb-2 border-b cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                            onClick={() => handleSeek(log.timestamp - recordingStartTime)}
                          >
                            <span className="text-muted-foreground shrink-0 text-[10px]">
                              {formatTime(log.timestamp - recordingStartTime)}
                            </span>
                            <span
                              className={
                                log.type === 'error'
                                  ? 'text-red-500 shrink-0 font-semibold'
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
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Network Activity</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {visibleNetworkLogs.length} / {networkLogs.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NetworkPanel
                    logs={visibleNetworkLogs}
                    currentTime={currentTime}
                    onSeek={handleSeek}
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
                    <dt className="text-xs font-medium text-muted-foreground mb-1">Duration</dt>
                    <dd className="text-sm font-mono">{formatDuration(recording.duration)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">Resolution</dt>
                    <dd className="text-sm">{metadata?.resolution || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">Created</dt>
                    <dd className="text-sm">{createdAt.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">Browser</dt>
                    <dd className="text-sm">{metadata?.browser || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">OS</dt>
                    <dd className="text-sm">{metadata?.os || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">Test Suite</dt>
                    <dd className="text-sm">{suite.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">Events Captured</dt>
                    <dd className="text-sm">{rrwebEvents.length} DOM events</dd>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}