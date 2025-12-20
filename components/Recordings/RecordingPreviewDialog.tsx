'use client';

import { useState, useRef, useEffect } from 'react';
import { RecordingPreview } from '@/types/recording.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '../ui/Badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Upload, X } from 'lucide-react';
import { createRecording, updateRecording } from '@/lib/actions/recordings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VideoTrimmer } from '@/components/Recordings/VideoTrimmer';

interface RecordingPreviewDialogProps {
  preview: RecordingPreview;
  suiteId: string;
  sprintId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RecordingPreviewDialog({
  preview,
  suiteId,
  sprintId,
  onClose,
  onSaved,
}: RecordingPreviewDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [trimRange, setTrimRange] = useState<{ start: number; end: number }>({ 
    start: 0, 
    end: preview.duration 
  });
  const videoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;

  useEffect(() => {
    // Create object URL for preview
    const url = URL.createObjectURL(preview.videoBlob);
    setVideoUrl(url);

    // Set default title
    const now = new Date();
    setTitle(`Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [preview]);

  const handleTrim = (startTime: number, endTime: number) => {
    setTrimRange({ start: startTime, end: endTime });
  };

  const trimVideo = async (blob: Blob, start: number, end: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);
      video.muted = false; // Keep audio enabled
      
      video.onloadedmetadata = async () => {
        try {
          // Create a canvas to capture the video frames
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: false });
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Create a MediaStream from the canvas (video track)
          const canvasStream = canvas.captureStream(30);
          const videoTrack = canvasStream.getVideoTracks()[0];
          
          // Create a combined stream
          const combinedStream = new MediaStream([videoTrack]);
          
          // Try to capture audio from the video element
          let audioContext: AudioContext | null = null;
          try {
            audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(video);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            source.connect(audioContext.destination); // Also connect to speakers
            
            // Add audio tracks if available
            const audioTracks = destination.stream.getAudioTracks();
            if (audioTracks.length > 0) {
              audioTracks.forEach(track => combinedStream.addTrack(track));
            }
          } catch (audioError) {
            console.warn('Could not capture audio:', audioError);
          }

          // Set up MediaRecorder
          const chunks: Blob[] = [];
          
          // Try different mime types for better audio support
          let mimeType = 'video/webm;codecs=vp8,opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
            
          const mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 2500000,
            audioBitsPerSecond: 128000,
          });

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
            URL.revokeObjectURL(video.src);
            if (audioContext) {
              audioContext.close();
            }
            resolve(trimmedBlob);
          };

          // Start recording
          mediaRecorder.start(100);

          // Seek to start position
          video.currentTime = start;
          
          const drawFrame = () => {
            if (video.currentTime >= end) {
              mediaRecorder.stop();
              video.pause();
              return;
            }
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          };

          video.onseeked = () => {
            video.play().then(() => {
              drawFrame();
            }).catch(reject);
          };

          // Stop when reaching the end
          video.ontimeupdate = () => {
            if (video.currentTime >= end && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
              video.pause();
            }
          };

        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => reject(new Error('Failed to load video'));
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    // Close dialog immediately
    onClose();

    // Show persistent loading toast
    const toastId = toast.loading('Saving recording...');

    try {
      // Trim video if needed
      let finalBlob = preview.videoBlob;
      let finalDuration = Math.round(preview.duration);

      if (trimRange.start !== 0 || trimRange.end !== preview.duration) {
        toast.loading('Trimming video...', { id: toastId });
        finalBlob = await trimVideo(preview.videoBlob, trimRange.start, trimRange.end);
        finalDuration = Math.round(trimRange.end - trimRange.start);
      }

      toast.loading('Uploading video...', { id: toastId });

      // 1. Upload video to Supabase Storage
      const formData = new FormData();
      formData.append('video', finalBlob, 'recording.webm');
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('suiteId', suiteId);

      const uploadResponse = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload video');
      }

      const { url: videoUrl, fileName, fileSize } = await uploadResponse.json();

      // 2. Create recording record first to get the ID
      const { data: recording, error: createError } = await createRecording({
        suite_id: suiteId,
        sprint_id: sprintId,
        title,
        url: videoUrl,
        duration: finalDuration,
        metadata: {
          description: description || null,
          fileName,
          fileSize,
          resolution: preview.metadata.resolution,
          timestamp: preview.metadata.timestamp,
          browser: preview.metadata.browser,
          os: preview.metadata.os,
        },
      });

      if (createError || !recording) {
        throw new Error(createError || 'Failed to save recording');
      }

      // 3. Upload console logs
      let consoleLogsUrl = null;
      if (preview.consoleLogs && preview.consoleLogs.length > 0) {
        try {
          const consoleResponse = await fetch('/api/recordings/logs/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              suiteId,
              recordingId: recording.id,
              logs: preview.consoleLogs,
              type: 'console'
            })
          });

          if (consoleResponse.ok) {
            const consoleData = await consoleResponse.json();
            consoleLogsUrl = consoleData.url;
          } else {
            console.error('Failed to upload console logs');
          }
        } catch (error) {
          console.error('Error uploading console logs:', error);
        }
      }

      // 4. Upload network logs
      let networkLogsUrl = null;
      if (preview.networkLogs && preview.networkLogs.length > 0) {
        try {
          const networkResponse = await fetch('/api/recordings/logs/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              suiteId,
              recordingId: recording.id,
              logs: preview.networkLogs,
              type: 'network'
            })
          });

          if (networkResponse.ok) {
            const networkData = await networkResponse.json();
            networkLogsUrl = networkData.url;
          } else {
            console.error('Failed to upload network logs');
          }
        } catch (error) {
          console.error('Error uploading network logs:', error);
        }
      }

      // 5. Update recording with log URLs
      const { error: updateError } = await updateRecording(recording.id, {
        metadata: {
          description: description || null,
          fileName,
          fileSize,
          resolution: preview.metadata.resolution,
          timestamp: preview.metadata.timestamp,
          browser: preview.metadata.browser,
          os: preview.metadata.os,
          consoleLogsUrl,
          networkLogsUrl,
        },
      });

      if (updateError) {
        throw new Error(updateError);
      }

      toast.success('Recording saved successfully!', { id: toastId });
      onSaved();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save recording',
        { id: toastId }
      );
    }
  };

  const formatLogTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent 
        className="w-[80vw] h-[75vh] max-w-[80vw] max-h-[75vh] p-0 gap-0 overflow-hidden" 
        hideClose
        aria-describedby="recording-preview-description"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
            <DialogTitle>Recording Preview</DialogTitle>
            <span id="recording-preview-description" className="sr-only">
              Preview and edit your recording before saving
            </span>
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={!title.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Save Recording
              </Button>
              <DialogClose asChild>
                <Button variant="outline" size="md" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>

          {/* YouTube-style Layout */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Left Column - Video Player (70%) */}
            <div className="lg:w-[70%] p-6 overflow-y-auto flex items-center justify-center">
              <div className="space-y-5 max-w-4xl w-full">
                {/* Video Player */}
                <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                  <div className="aspect-video relative">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Video Trimmer */}
                <VideoTrimmer
                  videoRef={videoRef}
                  duration={preview.duration}
                  onTrim={handleTrim}
                />
              </div>
            </div>

            {/* Right Column - Form & Logs Tabs (30%) */}
            <div className="lg:w-[30%] border-t lg:border-t-0 lg:border-l flex flex-col overflow-hidden">
              <div className="p-4 space-y-3 border-b shrink-0">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter recording title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description (optional)"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
                <div className="px-4 pt-4 shrink-0">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info" className="text-xs">
                      Info
                    </TabsTrigger>
                    <TabsTrigger value="console" className="text-xs">
                      Console
                    </TabsTrigger>
                    <TabsTrigger value="network" className="text-xs">
                      Network
                    </TabsTrigger>
                    <TabsTrigger value="screenshots" className="text-xs">
                      Shots
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 min-h-0 relative">
                  <TabsContent value="info" className="absolute inset-0 mt-0 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden">
                    <ScrollArea className="w-full h-full">
                      <div className="px-4 py-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Recording Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground mb-1">
                                Timestamp
                              </dt>
                              <dd className="text-sm">
                                {new Date(preview.metadata.timestamp || '').toLocaleString()}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground mb-1">
                                Duration
                              </dt>
                              <dd className="text-sm font-mono">
                                {Math.floor(trimRange.end - trimRange.start) / 60 >= 1 
                                  ? `${Math.floor((trimRange.end - trimRange.start) / 60)}:${String(Math.floor((trimRange.end - trimRange.start) % 60)).padStart(2, '0')}`
                                  : `0:${String(Math.floor(trimRange.end - trimRange.start)).padStart(2, '0')}`
                                }
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground mb-1">
                                Resolution
                              </dt>
                              <dd className="text-sm">{preview.metadata.resolution}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground mb-1">
                                Browser
                              </dt>
                              <dd className="text-sm">{preview.metadata.browser || 'Chrome'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground mb-1">
                                Operating System
                              </dt>
                              <dd className="text-sm">{preview.metadata.os || 'Unknown'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-muted-foreground mb-1">
                                File Size
                              </dt>
                              <dd className="text-sm">
                                {(preview.videoBlob.size / 1024 / 1024).toFixed(2)} MB
                              </dd>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="console" className="absolute inset-0 mt-0 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden">
                    <ScrollArea className="w-full h-full">
                      <div className="px-4 py-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Console Logs</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {preview.consoleLogs.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8 text-sm">
                                No console logs captured
                              </p>
                            ) : (
                              <div className="space-y-2 font-mono text-xs">
                                {preview.consoleLogs.map((log, index) => (
                                  <div key={index} className="flex gap-2 pb-2 border-b">
                                    <span className="text-muted-foreground shrink-0 text-[10px]">
                                      {formatLogTime(log.timestamp)}
                                    </span>
                                    <span
                                      className={cn(
                                        "shrink-0",
                                        log.type === 'error' && 'text-red-500',
                                        log.type === 'warn' && 'text-yellow-500',
                                        log.type === 'info' && 'text-blue-500',
                                        log.type === 'log' && 'text-foreground'
                                      )}
                                    >
                                      [{log.type}]
                                    </span>
                                    <span className="break-all text-[11px]">{log.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="network" className="absolute inset-0 mt-0 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden">
                    <ScrollArea className="w-full h-full">
                      <div className="px-4 py-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Network Activity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {preview.networkLogs.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8 text-sm">
                                No network activity recorded
                              </p>
                            ) : (
                              <div className="divide-y">
                                {preview.networkLogs.map((log, index) => (
                                  <div key={index} className="py-3 text-xs hover:bg-muted/50">
                                    <div className="flex items-center justify-between mb-2 gap-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="info" className="text-[10px] px-1.5 py-0">
                                          {log.method}
                                        </Badge>
                                        <span
                                          className={cn(
                                            "font-semibold text-[11px]",
                                            log.status && log.status >= 200 && log.status < 300 && 'text-green-600',
                                            log.status && log.status >= 400 && 'text-red-600',
                                            (!log.status || log.status < 200) && 'text-yellow-600'
                                          )}
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
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="screenshots" className="absolute inset-0 mt-0 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden">
                    <ScrollArea className="w-full h-full">
                      <div className="px-4 py-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Screenshots</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {preview.screenshots.length > 0 ? (
                              <div className="grid grid-cols-1 gap-3">
                                {preview.screenshots.map((screenshot, index) => (
                                  <img
                                    key={index}
                                    src={screenshot}
                                    alt={`Screenshot ${index + 1}`}
                                    className="rounded border cursor-pointer hover:ring-2 ring-primary aspect-video object-cover transition-all"
                                    onClick={() => window.open(screenshot)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-muted-foreground py-8 text-sm">
                                No screenshots captured
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}