import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/Badge';
import type { NetworkLog } from '@/types/recording.types';

interface NetworkPanelProps {
  logs: NetworkLog[];
  currentTime: number;
  onSeek: (ms: number) => void;
}

export function NetworkPanel({ logs, currentTime, onSeek }: NetworkPanelProps) {
  const visibleLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    return logs.filter(log => log.timestamp <= currentTime);
  }, [logs, currentTime]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'primary';
    if (status >= 200 && status < 300) return 'default';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400) return 'danger';
    return 'primary';
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-blue-500 text-white',
      'POST': 'bg-green-500 text-white',
      'PUT': 'bg-yellow-600 text-white',
      'DELETE': 'bg-red-500 text-white',
      'PATCH': 'bg-purple-500 text-white',
    };
    return colors[method.toUpperCase()] || 'bg-gray-500 text-white';
  };

  const extractPath = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      return path.length > 60 ? path.substring(0, 57) + '...' : path;
    } catch {
      return url.length > 60 ? url.substring(0, 57) + '...' : url;
    }
  };

  const extractDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  };

  if (visibleLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
        <p className="text-center">
          {logs.length === 0 
            ? 'No network requests in this recording'
            : 'No network requests at this time. Play the recording to see requests appear.'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="text-xs">
        {visibleLogs.map((log, index) => (
          <div
            key={index}
            className="px-3 py-2.5 border-b hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => onSeek(log.timestamp)}
            title="Click to jump to this moment"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getMethodBadge(log.method)}`}>
                {log.method}
              </span>
              
              {log.status && (
                <Badge variant={getStatusColor(log.status)} className="text-[10px] h-5 px-1.5">
                  {log.status}
                </Badge>
              )}
              
              {log.duration && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {log.duration}ms
                </span>
              )}
              
              <span className="ml-auto text-[10px] text-muted-foreground">
                {formatTime(log.timestamp)}
              </span>
            </div>
            
            <div className="text-[11px] space-y-0.5">
              {extractDomain(log.url) && (
                <div className="text-muted-foreground font-medium">
                  {extractDomain(log.url)}
                </div>
              )}
              <div className="text-foreground/80 break-all" title={log.url}>
                {extractPath(log.url)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}