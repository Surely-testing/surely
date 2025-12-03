'use client';

import { useState, useRef, useEffect } from 'react';
import { RecordingPreview } from '@/types/recording.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '../ui/Badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Upload, X } from 'lucide-react';
import { createRecording, uploadLogs, updateRecording } from '@/lib/actions/recordings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const videoRef = useRef<HTMLVideoElement>(null);

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
      // 1. Upload video via API route
      const formData = new FormData();
      formData.append('video', preview.videoBlob, 'recording.webm');
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

      const { url: youtubeUrl, videoId, embedUrl } = await uploadResponse.json();

      // 2. Create recording record first to get the ID
      const { data: recording, error: createError } = await createRecording({
        suite_id: suiteId,
        sprint_id: sprintId,
        title,
        url: youtubeUrl,
        duration: preview.duration,
        metadata: {
          description: description || null,
          videoId,
          embedUrl,
          screenshotUrls: preview.screenshots,
          resolution: preview.metadata.resolution,
          timestamp: preview.metadata.timestamp,
          browser: preview.metadata.browser,
          os: preview.metadata.os,
        },
      });

      if (createError || !recording) {
        throw new Error(createError || 'Failed to save recording');
      }

      // 3. Upload console logs (using the generated recording ID)
      const { url: consoleLogsUrl } = await uploadLogs(
        suiteId,
        recording.id,
        preview.consoleLogs,
        'console'
      );

      // 4. Upload network logs
      const { url: networkLogsUrl } = await uploadLogs(
        suiteId,
        recording.id,
        preview.networkLogs,
        'network'
      );

      // 5. Update recording with log URLs
      const { error: updateError } = await updateRecording(recording.id, {
        metadata: {
          description: description || null,
          videoId,
          embedUrl,
          screenshotUrls: preview.screenshots,
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
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header with Close and Save */}
          <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
            <DialogTitle>Recording Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
                <Upload className="h-4 w-4 mr-2" />
                Save Recording
              </Button>
            </div>
          </div>

          {/* YouTube-style Layout */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Left Column - Video Player (70%) */}
            <div className="lg:w-[70%] p-6 overflow-y-auto">
              <div className="space-y-4 max-w-4xl mx-auto">
                {/* Video Player */}
                <div className="bg-black rounded-xl overflow-hidden">
                  <div className="aspect-video relative">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Video Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    Duration: {Math.floor(preview.duration / 60)}m {preview.duration % 60}s
                  </span>
                  <span>•</span>
                  <span>
                    Resolution: {preview.metadata.resolution}
                  </span>
                  <span>•</span>
                  <span>
                    Size: {(preview.videoBlob.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
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

              <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
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

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="info" className="h-full mt-0">
                    <ScrollArea className="h-full px-4 py-4">
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
                              {Math.floor(preview.duration / 60)}:{String(preview.duration % 60).padStart(2, '0')}
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
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="console" className="h-full mt-0">
                    <ScrollArea className="h-full px-4 py-4">
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
                            <div className="space-y-2 font-mono text-xs max-h-[400px] overflow-y-auto">
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
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="network" className="h-full mt-0">
                    <ScrollArea className="h-full px-4 py-4">
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
                            <div className="divide-y max-h-[400px] overflow-y-auto">
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
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="screenshots" className="h-full mt-0">
                    <ScrollArea className="h-full px-4 py-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Screenshots</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {preview.screenshots.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
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