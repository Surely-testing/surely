
// ============================================
// lib/recording/code-snippet-extractor.ts
// Extracts code from browser DevTools
// ============================================
import { logger } from '@/lib/utils/logger';

export interface CodeSnippet {
  timestamp: number;
  language: string;
  code: string;
  source: 'console' | 'sources' | 'elements' | 'network';
  fileName?: string;
  lineNumber?: number;
}

export class CodeSnippetExtractor {
  private snippets: CodeSnippet[] = [];
  private isExtracting = false;

  start(): void {
    if (this.isExtracting) {
      logger.log('Code snippet extractor already active');
      return;
    }

    this.isExtracting = true;
    this.snippets = [];

    // Monitor console for code
    this.monitorConsole();

    logger.log('✓ Code snippet extractor started');
  }

  private monitorConsole(): void {
    // This is a passive monitor - actual code extraction
    // would require DevTools extension or special permissions
    
    // We can detect when code-like strings are logged
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      args.forEach(arg => {
        if (typeof arg === 'string' && this.looksLikeCode(arg)) {
          const snippet: CodeSnippet = {
            timestamp: Date.now(),
            language: this.detectLanguage(arg),
            code: arg,
            source: 'console',
          };

          this.snippets.push(snippet);
          logger.log('✓ Code snippet detected in console');
        }
      });

      originalLog.apply(console, args);
    };
  }

  private looksLikeCode(text: string): boolean {
    // Basic heuristics to detect code
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /class\s+\w+/,
      /import\s+.*from/,
      /export\s+(default|const|function)/,
      /<\w+[^>]*>/,
      /\{\s*\w+:\s*\w+/,
    ];

    return codePatterns.some(pattern => pattern.test(text)) && text.length > 20;
  }

  private detectLanguage(code: string): string {
    if (/<\w+[^>]*>/.test(code)) return 'html';
    if (/import\s+.*from/.test(code) || /export\s+/.test(code)) return 'javascript';
    if (/function\s+\w+\s*\(/.test(code)) return 'javascript';
    if (/def\s+\w+\s*\(/.test(code)) return 'python';
    if (/public\s+class/.test(code)) return 'java';
    if (/#include\s+</.test(code)) return 'cpp';
    return 'unknown';
  }

  captureManual(code: string, language: string, source: CodeSnippet['source']): void {
    const snippet: CodeSnippet = {
      timestamp: Date.now(),
      language,
      code,
      source,
    };

    this.snippets.push(snippet);
    logger.log('✓ Code snippet manually captured');
  }

  stop(): CodeSnippet[] {
    this.isExtracting = false;

    const captured = [...this.snippets];
    this.snippets = [];

    logger.log('✓ Code snippet extractor stopped', {
      totalSnippets: captured.length,
    });

    return captured;
  }

  getSnippets(): CodeSnippet[] {
    return [...this.snippets];
  }

  getCount(): number {
    return this.snippets.length;
  }

  clear(): void {
    this.snippets = [];
  }
}