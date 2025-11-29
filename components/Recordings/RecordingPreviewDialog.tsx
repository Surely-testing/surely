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
import { Loader2, Upload } from 'lucide-react';
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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0">
        <div className="flex h-[90vh]">
          {/* Left Side - Video Preview */}
          <div className="flex-1 flex flex-col bg-muted/30">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Recording Preview</DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-3xl">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-xl">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                  />
                </div>
                
                {/* Video Info */}
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Duration: {Math.floor(preview.duration / 60)}m {preview.duration % 60}s
                  </span>
                  <span>
                    Resolution: {preview.metadata.resolution}
                  </span>
                  <span>
                    Size: {(preview.videoBlob.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-background flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!title.trim()}>
                <Upload className="h-4 w-4 mr-2" />
                Save Recording
              </Button>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className="w-[400px] border-l flex flex-col bg-background">
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="info" className="h-full flex flex-col">
                <div className="px-4 pt-4">
                  <TabsList className="grid w-full grid-cols-4 h-auto">
                    <TabsTrigger value="info" className="text-xs px-2 py-2">
                      Info
                    </TabsTrigger>
                    <TabsTrigger value="console" className="text-xs px-2 py-2">
                      Console
                    </TabsTrigger>
                    <TabsTrigger value="network" className="text-xs px-2 py-2">
                      Network
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="text-xs px-2 py-2">
                      Actions
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="info" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        {/* Recording Details Form */}
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="title" className="text-xs font-medium">
                              Title *
                            </Label>
                            <Input
                              id="title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Enter recording title"
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <Label htmlFor="description" className="text-xs font-medium">
                              Description
                            </Label>
                            <Textarea
                              id="description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Add a description (optional)"
                              rows={4}
                              className="mt-1.5 resize-none"
                            />
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="pt-4 border-t space-y-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                            Metadata
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1.5">
                              <span className="text-muted-foreground">Timestamp</span>
                              <span className="font-medium">
                                {new Date(preview.metadata.timestamp || '').toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-t">
                              <span className="text-muted-foreground">OS</span>
                              <span className="font-medium">{preview.metadata.os || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-t">
                              <span className="text-muted-foreground">Browser</span>
                              <span className="font-medium">{preview.metadata.browser || 'Chrome'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-t">
                              <span className="text-muted-foreground">Window Size</span>
                              <span className="font-medium">{preview.metadata.resolution}</span>
                            </div>
                          </div>
                        </div>

                        {/* Screenshots Preview */}
                        {preview.screenshots.length > 0 && (
                          <div className="pt-4 border-t space-y-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                              Screenshots ({preview.screenshots.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {preview.screenshots.slice(0, 4).map((screenshot, index) => (
                                <img
                                  key={index}
                                  src={screenshot}
                                  alt={`Screenshot ${index + 1}`}
                                  className="rounded border cursor-pointer hover:ring-2 ring-primary aspect-video object-cover"
                                  onClick={() => window.open(screenshot)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="console" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        {preview.consoleLogs.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8 text-sm">
                            No console logs captured
                          </p>
                        ) : (
                          <div className="space-y-1 font-mono text-[10px]">
                            {preview.consoleLogs.map((log, index) => (
                              <div key={index} className="flex gap-2 py-1 border-b last:border-0">
                                <span className="text-muted-foreground shrink-0 text-[9px]">
                                  {formatLogTime(log.timestamp)}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 font-semibold",
                                    log.type === 'error' && 'text-red-500',
                                    log.type === 'warn' && 'text-yellow-500',
                                    log.type === 'info' && 'text-blue-500',
                                    log.type === 'log' && 'text-foreground'
                                  )}
                                >
                                  {log.type}
                                </span>
                                <span className="break-all text-foreground/90">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="network" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        {preview.networkLogs.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8 text-sm">
                            No network requests captured
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {preview.networkLogs.map((log, index) => (
                              <div key={index} className="text-xs border rounded-lg p-3 hover:bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default" size='md'>
                                      {log.method}
                                    </Badge>
                                    <span
                                      className={cn(
                                        "font-semibold text-xs",
                                        log.status && log.status >= 200 && log.status < 300 && 'text-green-600',
                                        log.status && log.status >= 400 && 'text-red-600',
                                        (!log.status || log.status < 200) && 'text-yellow-600'
                                      )}
                                    >
                                      {log.status || 'pending'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {log.duration}ms
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-[10px] break-all">
                                  {log.url}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="actions" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        <p className="text-xs text-muted-foreground mb-4">
                          Additional recording actions will be available here.
                        </p>
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