
// ============================================
// lib/recording/source-map-resolver.ts
// Resolve minified stack traces using source maps
// ============================================

import { logger } from '@/lib/utils/logger';

export interface SourceMapPosition {
  source: string;
  line: number;
  column: number;
  name?: string;
}

export interface ResolvedStackFrame {
  original: string;
  resolved?: SourceMapPosition;
  functionName?: string;
}

export class SourceMapResolver {
  private sourceMapCache: Map<string, any> = new Map();

  async resolveStackTrace(stackTrace: string): Promise<ResolvedStackFrame[]> {
    const frames = this.parseStackTrace(stackTrace);
    const resolved: ResolvedStackFrame[] = [];

    for (const frame of frames) {
      const resolvedFrame: ResolvedStackFrame = {
        original: frame,
      };

      try {
        const position = await this.resolveFrame(frame);
        if (position) {
          resolvedFrame.resolved = position;
        }
      } catch (error) {
        logger.log('Error resolving frame:', error);
      }

      resolved.push(resolvedFrame);
    }

    return resolved;
  }

  private parseStackTrace(stackTrace: string): string[] {
    return stackTrace
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('Error'));
  }

  private async resolveFrame(frame: string): Promise<SourceMapPosition | null> {
    // Extract URL, line, and column from stack frame
    // Example formats:
    // "at functionName (http://example.com/bundle.js:1:2345)"
    // "at http://example.com/bundle.js:1:2345"
    
    const match = frame.match(/(?:at\s+)?(?:.*?\s+)?\(?([^)]+):(\d+):(\d+)\)?/);
    if (!match) {
      return null;
    }

    const [, url, line, column] = match;
    const lineNum = parseInt(line, 10);
    const colNum = parseInt(column, 10);

    // Try to fetch and parse source map
    const sourceMap = await this.fetchSourceMap(url);
    if (!sourceMap) {
      return null;
    }

    // Resolve position using source map
    return this.resolvePosition(sourceMap, lineNum, colNum);
  }

  private async fetchSourceMap(url: string): Promise<any | null> {
    // Check cache
    if (this.sourceMapCache.has(url)) {
      return this.sourceMapCache.get(url);
    }

    try {
      // Fetch the JavaScript file
      const response = await fetch(url);
      const content = await response.text();

      // Look for source map comment
      // //# sourceMappingURL=bundle.js.map
      const sourceMapMatch = content.match(/\/\/# sourceMappingURL=(.+)/);
      if (!sourceMapMatch) {
        return null;
      }

      const sourceMapUrl = new URL(sourceMapMatch[1], url).href;

      // Fetch source map
      const mapResponse = await fetch(sourceMapUrl);
      const sourceMap = await mapResponse.json();

      this.sourceMapCache.set(url, sourceMap);
      return sourceMap;
    } catch (error) {
      logger.log('Error fetching source map:', error);
      return null;
    }
  }

  private resolvePosition(
    sourceMap: any,
    line: number,
    column: number
  ): SourceMapPosition | null {
    // This is a simplified implementation
    // A full implementation would use the source-map library
    // to decode VLQ mappings and resolve exact positions

    try {
      // Source maps have a "sources" array and "mappings" string
      // For simplicity, we'll return approximate position
      if (sourceMap.sources && sourceMap.sources.length > 0) {
        return {
          source: sourceMap.sources[0],
          line: line,
          column: column,
        };
      }
    } catch (error) {
      logger.log('Error resolving position:', error);
    }

    return null;
  }

  clearCache(): void {
    this.sourceMapCache.clear();
  }
}
