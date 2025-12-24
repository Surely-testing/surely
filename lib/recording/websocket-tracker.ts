// ============================================
// lib/recording/websocket-tracker.ts
// Enhanced WebSocket message tracking
// ============================================
import { logger } from '@/lib/utils/logger';

export interface WebSocketMessage {
  id: string;
  timestamp: number;
  direction: 'sent' | 'received';
  data: any;
  size: number;
  type: string;
  parsed?: any; // Parsed JSON if applicable
}

export interface WebSocketConnection {
  id: string;
  url: string;
  protocols?: string | string[];
  startTime: number;
  endTime?: number;
  state: 'connecting' | 'open' | 'closing' | 'closed';
  messages: WebSocketMessage[];
  totalBytesSent: number;
  totalBytesReceived: number;
}

export class WebSocketTracker {
  private connections: Map<string, WebSocketConnection> = new Map();
  private isTracking = false;
  private originalWebSocket: typeof WebSocket;
  private messageIdCounter = 0;

  constructor() {
    this.originalWebSocket = window.WebSocket;
  }

  start(): void {
    if (this.isTracking) {
      logger.log('WebSocket tracker already active');
      return;
    }

    this.isTracking = true;
    this.connections.clear();
    this.messageIdCounter = 0;

    this.interceptWebSocket();

    logger.log('✓ WebSocket tracker started');
  }

  private interceptWebSocket(): void {
    const self = this;
    const OriginalWebSocket = this.originalWebSocket;

    // Create a custom WebSocket constructor
    const CustomWebSocket = function (
      url: string | URL,
      protocols?: string | string[]
    ) {
      const ws = new OriginalWebSocket(url, protocols);
      const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const connection: WebSocketConnection = {
        id: connectionId,
        url: String(url),
        protocols,
        startTime: Date.now(),
        state: 'connecting',
        messages: [],
        totalBytesSent: 0,
        totalBytesReceived: 0,
      };

      self.connections.set(connectionId, connection);
      logger.log('✓ WebSocket connection tracked:', String(url));

      // Track connection state
      ws.addEventListener('open', () => {
        connection.state = 'open';
        logger.log('✓ WebSocket opened:', connectionId);
      });

      ws.addEventListener('close', () => {
        connection.state = 'closed';
        connection.endTime = Date.now();
        logger.log('✓ WebSocket closed:', connectionId);
      });

      ws.addEventListener('error', () => {
        logger.log('✗ WebSocket error:', connectionId);
      });

      // Intercept send
      const originalSend = ws.send.bind(ws);
      ws.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        const messageId = `msg-${self.messageIdCounter++}`;
        const timestamp = Date.now();
        
        let messageData: any = data;
        let parsed: any = undefined;
        let size = 0;
        let type = 'string';

        if (typeof data === 'string') {
          size = new Blob([data]).size;
          try {
            parsed = JSON.parse(data);
          } catch {
            // Not JSON
          }
        } else if (data instanceof Blob) {
          size = data.size;
          type = 'blob';
        } else if (data instanceof ArrayBuffer) {
          size = data.byteLength;
          type = 'arraybuffer';
        } else if (ArrayBuffer.isView(data)) {
          size = data.byteLength;
          type = 'arraybufferview';
        }

        const message: WebSocketMessage = {
          id: messageId,
          timestamp,
          direction: 'sent',
          data: messageData,
          size,
          type,
          parsed,
        };

        connection.messages.push(message);
        connection.totalBytesSent += size;

        return originalSend(data);
      };

      // Intercept receive
      ws.addEventListener('message', (event: MessageEvent) => {
        const messageId = `msg-${self.messageIdCounter++}`;
        const timestamp = Date.now();
        
        let messageData: any = event.data;
        let parsed: any = undefined;
        let size = 0;
        let type = 'string';

        if (typeof event.data === 'string') {
          size = new Blob([event.data]).size;
          try {
            parsed = JSON.parse(event.data);
          } catch {
            // Not JSON
          }
        } else if (event.data instanceof Blob) {
          size = event.data.size;
          type = 'blob';
        } else if (event.data instanceof ArrayBuffer) {
          size = event.data.byteLength;
          type = 'arraybuffer';
        }

        const message: WebSocketMessage = {
          id: messageId,
          timestamp,
          direction: 'received',
          data: messageData,
          size,
          type,
          parsed,
        };

        connection.messages.push(message);
        connection.totalBytesReceived += size;
      });

      return ws;
    } as any;

    // Use Object.defineProperty to properly copy WebSocket constants
    Object.defineProperty(CustomWebSocket, 'CONNECTING', {
      value: OriginalWebSocket.CONNECTING,
      writable: false,
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(CustomWebSocket, 'OPEN', {
      value: OriginalWebSocket.OPEN,
      writable: false,
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(CustomWebSocket, 'CLOSING', {
      value: OriginalWebSocket.CLOSING,
      writable: false,
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(CustomWebSocket, 'CLOSED', {
      value: OriginalWebSocket.CLOSED,
      writable: false,
      enumerable: true,
      configurable: true,
    });

    // Copy prototype
    CustomWebSocket.prototype = OriginalWebSocket.prototype;

    // Replace global WebSocket
    window.WebSocket = CustomWebSocket as any;
  }

  stop(): WebSocketConnection[] {
    // Restore original WebSocket
    window.WebSocket = this.originalWebSocket;

    this.isTracking = false;

    const captured = Array.from(this.connections.values());
    this.connections.clear();

    logger.log('✓ WebSocket tracker stopped', {
      totalConnections: captured.length,
      totalMessages: captured.reduce((sum, conn) => sum + conn.messages.length, 0),
    });

    return captured;
  }

  getConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(id: string): WebSocketConnection | undefined {
    return this.connections.get(id);
  }

  getActiveConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.state === 'open' || conn.state === 'connecting'
    );
  }

  getTotalMessageCount(): number {
    return Array.from(this.connections.values()).reduce(
      (sum, conn) => sum + conn.messages.length,
      0
    );
  }
}