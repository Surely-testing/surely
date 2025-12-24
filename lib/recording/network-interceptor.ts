// ============================================
// lib/recording/network-interceptor.ts
// Intercept and log network requests
// ============================================

import { logger } from '../utils/logger';
import type { NetworkLog } from '../../types/recording.types';

interface NetworkInterceptorConfig {
  onRequest?: (log: NetworkLog) => void;
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
  maxBodySize?: number; // Max size in bytes to capture
}

class NetworkInterceptor {
  private isActive = false;
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private config: NetworkInterceptorConfig = {};
  private requestCounter = 0;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  start(config: NetworkInterceptorConfig = {}): void {
    if (this.isActive) {
      logger.log('Network interceptor already active');
      return;
    }

    this.isActive = true;
    this.config = {
      captureRequestBody: config.captureRequestBody ?? true,
      captureResponseBody: config.captureResponseBody ?? false,
      maxBodySize: config.maxBodySize ?? 10000, // 10KB default
      onRequest: config.onRequest,
    };
    this.requestCounter = 0;

    this.interceptFetch();
    this.interceptXHR();

    logger.log('✓ Network interceptor started');
  }

  private interceptFetch(): void {
    const self = this;
    const originalFetch = this.originalFetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const startTime = Date.now();
      const requestId = `req-${self.requestCounter++}`;
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';

      let requestBody: any = null;
      if (self.config.captureRequestBody && init?.body) {
        requestBody = await self.captureBody(init.body);
      }

      try {
        const response = await originalFetch(input, init);
        const endTime = Date.now();
        const duration = endTime - startTime;

        let responseBody: any = null;
        if (self.config.captureResponseBody) {
          const clonedResponse = response.clone();
          try {
            const text = await clonedResponse.text();
            if (text.length <= (self.config.maxBodySize || 10000)) {
              try {
                responseBody = JSON.parse(text);
              } catch {
                responseBody = text;
              }
            }
          } catch {
            // Failed to read response body
          }
        }

        const log: NetworkLog = {
          id: requestId,
          timestamp: startTime,
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          duration,
          requestHeaders: self.extractHeaders(init?.headers),
          responseHeaders: self.extractHeadersFromResponse(response),
          requestBody,
          responseBody,
          type: 'fetch',
        };

        if (self.config.onRequest) {
          self.config.onRequest(log);
        }

        return response;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const log: NetworkLog = {
          id: requestId,
          timestamp: startTime,
          url,
          method,
          status: 0,
          statusText: 'Network Error',
          duration,
          requestHeaders: self.extractHeaders(init?.headers),
          responseHeaders: {},
          requestBody,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'fetch',
        };

        if (self.config.onRequest) {
          self.config.onRequest(log);
        }

        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const self = this;
    const originalOpen = this.originalXHROpen;
    const originalSend = this.originalXHRSend;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      (this as any)._networkInterceptor = {
        method,
        url: url.toString(),
        startTime: Date.now(),
        requestId: `req-${self.requestCounter++}`,
      };

      return originalOpen.apply(this, [method, url, async, username, password] as any);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const interceptorData = (this as any)._networkInterceptor;
      
      if (!interceptorData) {
        return originalSend.apply(this, [body] as any);
      }

      const startTime = interceptorData.startTime;
      const requestId = interceptorData.requestId;
      const method = interceptorData.method;
      const url = interceptorData.url;

      let requestBody: any = null;
      if (self.config.captureRequestBody && body) {
        if (typeof body === 'string') {
          if (body.length <= (self.config.maxBodySize || 10000)) {
            try {
              requestBody = JSON.parse(body);
            } catch {
              requestBody = body;
            }
          }
        }
      }

      this.addEventListener('loadend', function () {
        const endTime = Date.now();
        const duration = endTime - startTime;

        let responseBody: any = null;
        if (self.config.captureResponseBody && this.responseText) {
          if (this.responseText.length <= (self.config.maxBodySize || 10000)) {
            try {
              responseBody = JSON.parse(this.responseText);
            } catch {
              responseBody = this.responseText;
            }
          }
        }

        const requestHeaders: Record<string, string> = {};
        const responseHeaders: Record<string, string> = {};
        
        // Parse response headers
        const headerStr = this.getAllResponseHeaders();
        if (headerStr) {
          headerStr.split('\r\n').forEach(line => {
            const parts = line.split(': ');
            if (parts.length === 2) {
              responseHeaders[parts[0]] = parts[1];
            }
          });
        }

        const log: NetworkLog = {
          id: requestId,
          timestamp: startTime,
          url,
          method,
          status: this.status,
          statusText: this.statusText,
          duration,
          requestHeaders,
          responseHeaders,
          requestBody,
          responseBody,
          type: 'xhr',
        };

        if (self.config.onRequest) {
          self.config.onRequest(log);
        }
      });

      return originalSend.apply(this, [body] as any);
    };
  }

  private async captureBody(body: BodyInit): Promise<any> {
    if (typeof body === 'string') {
      if (body.length <= (this.config.maxBodySize || 10000)) {
        try {
          return JSON.parse(body);
        } catch {
          return body;
        }
      }
      return '[Body too large]';
    }

    if (body instanceof FormData) {
      const obj: Record<string, any> = {};
      body.forEach((value, key) => {
        obj[key] = value instanceof File ? `[File: ${value.name}]` : value;
      });
      return obj;
    }

    if (body instanceof URLSearchParams) {
      const obj: Record<string, string> = {};
      body.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    }

    if (body instanceof Blob) {
      return `[Blob: ${body.size} bytes]`;
    }

    return '[Unknown body type]';
  }

  private extractHeaders(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};

    if (!headers) return result;

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        result[key] = value;
      });
    }

    return result;
  }

  private extractHeadersFromResponse(response: Response): Record<string, string> {
    const result: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  stop(): void {
    if (!this.isActive) return;

    // Restore original fetch and XHR
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;

    this.isActive = false;
    this.config = {};

    logger.log('✓ Network interceptor stopped');
  }

  isIntercepting(): boolean {
    return this.isActive;
  }

  getRequestCount(): number {
    return this.requestCounter;
  }
}

// Export singleton instance
export const networkInterceptor = new NetworkInterceptor();