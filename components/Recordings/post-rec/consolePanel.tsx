import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConsoleLog } from '@/types/recording.types';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  currentTime: number;
  onSeek: (ms: number) => void;
}

export function ConsolePanel({ logs, currentTime, onSeek }: ConsolePanelProps) {
  const visibleLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    return logs.filter(log => log.timestamp <= currentTime);
  }, [logs, currentTime]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getLogStyle = (type: string) => {
    switch (type) {
      case 'error': 
        return 'border-l-2 border-red-500 bg-red-50/50 text-red-900';
      case 'warn': 
        return 'border-l-2 border-yellow-500 bg-yellow-50/50 text-yellow-900';
      case 'info': 
        return 'border-l-2 border-blue-500 bg-blue-50/50 text-blue-900';
      default: 
        return 'border-l-2 border-transparent';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '▶';
    }
  };

  if (visibleLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
        <p className="text-center">
          {logs.length === 0 
            ? 'No console logs in this recording'
            : 'No console logs at this time. Play the recording to see logs appear.'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="font-mono text-xs">
        {visibleLogs.map((log, index) => (
          <div
            key={index}
            className={`px-3 py-2 border-b hover:bg-accent/50 cursor-pointer transition-colors ${getLogStyle(log.type)}`}
            onClick={() => onSeek(log.timestamp)}
            title="Click to jump to this moment"
          >
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-sm">{getLogIcon(log.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="break-words">{log.message}</div>
              </div>
              <span className="shrink-0 text-[10px] opacity-60">
                {formatTime(log.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}