// Extension Bridge - Add this to your Next.js app
// This allows your web app to communicate with the browser extension

import { createClient } from '@/lib/supabase/client';

export class ExtensionBridge {
  private static instance: ExtensionBridge;
  private extensionInstalled: boolean = false;
  private extensionVersion: string | null = null;

  private constructor() {}

  static getInstance(): ExtensionBridge {
    if (!ExtensionBridge.instance) {
      ExtensionBridge.instance = new ExtensionBridge();
    }
    return ExtensionBridge.instance;
  }

  // Check if extension is installed
  async checkExtension(): Promise<boolean> {
    return new Promise((resolve) => {
      // Send ping message (listener will respond)
      window.postMessage({ type: 'EXTENSION_PING' }, '*');

      const timeout = setTimeout(() => {
        this.extensionInstalled = false;
        resolve(false);
      }, 1000);

      const handleMessage = (event: MessageEvent) => {
        if (event.source !== window) return;

        if (event.data.type === 'EXTENSION_PONG') {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          this.extensionInstalled = true;
          this.extensionVersion = event.data.version;
          resolve(true);
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  // Start recording from web app
  async startRecording(options: {
    testSuiteId: string;
    testSuiteName: string;
    accountId: string;
    sprintId?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if extension is installed
      const isInstalled = await this.checkExtension();
      
      if (!isInstalled) {
        return {
          success: false,
          error: 'Extension not installed. Please install the Surely Test Recorder extension.'
        };
      }

      // Get Supabase credentials
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Get Supabase URL and anon key from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return {
          success: false,
          error: 'Supabase configuration missing'
        };
      }

      console.log('[ExtensionBridge] Sending START_RECORDING to extension');

      // Send message to extension (listener will forward to SURELY_START_RECORDING)
      window.postMessage({
        type: 'START_RECORDING',
        data: {
          testSuiteId: options.testSuiteId,
          testSuiteName: options.testSuiteName,
          accountId: options.accountId,
          sprintId: options.sprintId || null,
          userToken: session.access_token,
          supabaseUrl,
          supabaseAnonKey
        }
      }, '*');

      // Wait for confirmation
      return await this.waitForRecordingStart();

    } catch (error) {
      console.error('[ExtensionBridge] Error starting recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      };
    }
  }

  // Wait for recording to start
  private waitForRecordingStart(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        console.error('[ExtensionBridge] Timeout waiting for RECORDING_STARTED');
        resolve({
          success: false,
          error: 'Recording start timeout - extension did not respond in 10 seconds'
        });
      }, 10000); // 10 seconds to allow for countdown

      const handleMessage = (event: MessageEvent) => {
        if (event.source !== window) return;

        if (event.data.type === 'RECORDING_STARTED') {
          console.log('[ExtensionBridge] ✅ Received RECORDING_STARTED');
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          resolve({ success: true });
        } else if (event.data.type === 'RECORDING_START_FAILED') {
          console.error('[ExtensionBridge] ❌ Received RECORDING_START_FAILED:', event.data.error);
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          resolve({
            success: false,
            error: event.data.error || 'Failed to start recording'
          });
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  // Update context (when user switches test suite)
  updateContext(options: {
    testSuiteId: string;
    testSuiteName: string;
    accountId: string;
    sprintId?: string | null;
  }) {
    window.postMessage({
      type: 'UPDATE_CONTEXT',
      data: {
        testSuiteId: options.testSuiteId,
        testSuiteName: options.testSuiteName,
        accountId: options.accountId,
        sprintId: options.sprintId || null
      }
    }, '*');
  }

  // Check if extension is installed
  isInstalled(): boolean {
    return this.extensionInstalled;
  }

  // Get extension version
  getVersion(): string | null {
    return this.extensionVersion;
  }

  // Listen for recording completion
  onRecordingComplete(callback: (recordingId: string) => void) {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return;

      if (event.data.type === 'RECORDING_COMPLETED') {
        callback(event.data.recordingId);
      }
    };

    window.addEventListener('message', handleMessage);

    // Return cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }
}

// Export singleton
export const extensionBridge = ExtensionBridge.getInstance();