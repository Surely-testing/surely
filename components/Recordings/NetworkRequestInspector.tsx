// ============================================
// GROUP 5: UI COMPONENTS
// ============================================

// ============================================
// components/Recordings/NetworkRequestInspector.tsx
// Deep dive UI for inspecting single network request
// ============================================

'use client';

import { useState } from 'react';
import { NetworkLog } from '@/types/recording.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkRequestInspectorProps {
  log: NetworkLog;
  open: boolean;
  onClose: () => void;
}

export function NetworkRequestInspector({ log, open, onClose }: NetworkRequestInspectorProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatJSON = (data: any) => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-yellow-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
    if (status >= 400 && status < 500) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">{log.method}</Badge>
                <span className={cn("font-semibold", getStatusColor(log.status))}>
                  {log.status || 'Failed'}
                </span>
                {log.duration && (
                  <span className="text-sm text-muted-foreground">{log.duration}ms</span>
                )}
                {log.type === 'graphql' && (
                  <Badge variant="primary">GraphQL</Badge>
                )}
                {log.type === 'websocket' && (
                  <Badge variant="primary">WebSocket</Badge>
                )}
              </div>
              <DialogTitle className="text-sm font-mono break-all">
                {log.url}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
              {log.type === 'websocket' && (
                <TabsTrigger value="messages">Messages</TabsTrigger>
              )}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <dt className="text-xs font-medium text-muted-foreground">Method</dt>
                  <dd className="text-sm font-mono">{log.method}</dd>
                </div>
                <div className="space-y-2">
                  <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                  <dd className={cn("text-sm font-semibold", getStatusColor(log.status))}>
                    {log.status} {log.statusText}
                  </dd>
                </div>
                <div className="space-y-2">
                  <dt className="text-xs font-medium text-muted-foreground">Duration</dt>
                  <dd className="text-sm">{log.duration ? `${log.duration}ms` : 'N/A'}</dd>
                </div>
                <div className="space-y-2">
                  <dt className="text-xs font-medium text-muted-foreground">Size</dt>
                  <dd className="text-sm">
                    {log.size ? `${(log.size / 1024).toFixed(2)} KB` : 'N/A'}
                  </dd>
                </div>
                <div className="space-y-2">
                  <dt className="text-xs font-medium text-muted-foreground">Type</dt>
                  <dd className="text-sm capitalize">{log.type}</dd>
                </div>
                <div className="space-y-2">
                  <dt className="text-xs font-medium text-muted-foreground">Timestamp</dt>
                  <dd className="text-sm">{new Date(log.timestamp).toLocaleString()}</dd>
                </div>
              </div>

              {log.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <dt className="text-xs font-medium text-red-800 mb-1">Error</dt>
                  <dd className="text-sm text-red-600">{log.error}</dd>
                </div>
              )}
            </TabsContent>

            {/* Headers Tab */}
            <TabsContent value="headers" className="mt-4 space-y-4">
              {log.requestHeaders && Object.keys(log.requestHeaders).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Request Headers</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(log.requestHeaders, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="border rounded overflow-hidden">
                    {Object.entries(log.requestHeaders).map(([key, value]) => (
                      <div key={key} className="flex border-b last:border-b-0">
                        <div className="w-1/3 px-3 py-2 bg-muted text-xs font-medium break-all">
                          {key}
                        </div>
                        <div className="w-2/3 px-3 py-2 text-xs font-mono break-all">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {log.responseHeaders && Object.keys(log.responseHeaders).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Response Headers</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(log.responseHeaders, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="border rounded overflow-hidden">
                    {Object.entries(log.responseHeaders).map(([key, value]) => (
                      <div key={key} className="flex border-b last:border-b-0">
                        <div className="w-1/3 px-3 py-2 bg-muted text-xs font-medium break-all">
                          {key}
                        </div>
                        <div className="w-2/3 px-3 py-2 text-xs font-mono break-all">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Request Tab */}
            <TabsContent value="request" className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Request Body</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(
                      typeof log.requestBody === 'string' 
                        ? log.requestBody 
                        : JSON.stringify(log.requestBody, null, 2)
                    )}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  {log.requestBody && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadJSON(log.requestBody, 'request-body.json')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
              {log.requestBody ? (
                <pre className="p-4 bg-muted rounded text-xs font-mono overflow-auto max-h-96">
                  {formatJSON(log.requestBody)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No request body
                </p>
              )}
            </TabsContent>

            {/* Response Tab */}
            <TabsContent value="response" className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Response Body</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(
                      typeof log.responseBody === 'string' 
                        ? log.responseBody 
                        : JSON.stringify(log.responseBody, null, 2)
                    )}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  {log.responseBody && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadJSON(log.responseBody, 'response-body.json')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
              {log.responseBody ? (
                <pre className="p-4 bg-muted rounded text-xs font-mono overflow-auto max-h-96">
                  {formatJSON(log.responseBody)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No response body
                </p>
              )}
            </TabsContent>

            {/* WebSocket Messages Tab */}
            {log.type === 'websocket' && log.websocketMessages && (
              <TabsContent value="messages" className="mt-4">
                <div className="space-y-2">
                  {log.websocketMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded border",
                        msg.type === 'sent' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={msg.type === 'sent' ? 'default' : 'primary'}>
                          {msg.type === 'sent' ? 'Sent' : 'Received'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs font-mono overflow-auto max-h-32">
                        {typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}