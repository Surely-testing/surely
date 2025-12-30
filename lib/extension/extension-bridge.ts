// lib/extension/extension-bridge.ts
// Fixed bridge with DIRECT recording start from web app

export interface ExtensionAuthContext {
  accountId: string;
  testSuiteId: string;
  testSuiteName: string;
  sprintId?: string | null;
  userToken: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface RecordingStartResponse {
  success: boolean;
  error?: string;
}

class ExtensionBridge {
  private static instance: ExtensionBridge;
  private authContext: ExtensionAuthContext | null = null;
  private recordingCompleteCallbacks: ((recordingId: string) => void)[] = [];

  private constructor() {
    this.setupMessageListener();
  }

  static getInstance(): ExtensionBridge {
    if (!ExtensionBridge.instance) {
      ExtensionBridge.instance = new ExtensionBridge();
    }
    return ExtensionBridge.instance;
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      const message = event.data;

      switch (message.type) {
        case 'EXTENSION_PONG':
          console.log('[Bridge] Extension detected, version:', message.version);
          break;

        case 'RECORDING_STARTED':
          console.log('[Bridge] Recording started successfully');
          break;

        case 'RECORDING_START_FAILED':
          console.error('[Bridge] Recording failed to start:', message.error);
          break;

        case 'RECORDING_SAVED':
          console.log('[Bridge] Recording saved:', message.recordingId);
          this.handleRecordingComplete(message.recordingId);
          break;

        case 'RECORDING_SAVE_FAILED':
          console.error('[Bridge] Recording save failed:', message.error);
          break;
      }
    });
  }

  /**
   * Set auth context (call this when user navigates to test suite page)
   */
  setAuthContext(context: ExtensionAuthContext): void {
    console.log('[Bridge] Setting auth context');
    this.authContext = context;
    
    // Send to extension immediately
    this.sendAuthContextToExtension();
  }

  /**
   * Send auth context to extension via window messaging
   */
  private sendAuthContextToExtension(): void {
    if (!this.authContext) {
      console.warn('[Bridge] No auth context available to send');
      return;
    }

    console.log('[Bridge] Sending auth context to extension');
    
    window.postMessage({
      type: 'SET_AUTH_CONTEXT',
      data: this.authContext
    }, '*');
  }

  /**
   * Check if extension is installed
   */
  async checkExtension(): Promise<boolean> {
    return new Promise((resolve) => {
      // Send ping
      window.postMessage({ type: 'EXTENSION_PING' }, '*');

      // Listen for pong
      const handlePong = (event: MessageEvent) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'EXTENSION_PONG') {
          window.removeEventListener('message', handlePong);
          resolve(true);
        }
      };

      window.addEventListener('message', handlePong);

      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', handlePong);
        resolve(false);
      }, 2000);
    });
  }

  /**
   * Start recording directly from web app
   */
  async startRecording(): Promise<RecordingStartResponse> {
    if (!this.authContext) {
      return {
        success: false,
        error: 'No authentication context available. Please refresh the page.'
      };
    }

    return new Promise((resolve) => {
      console.log('[Bridge] Requesting recording start');

      // Send start recording message with auth context
      window.postMessage({
        type: 'START_RECORDING',
        data: this.authContext
      }, '*');

      // Listen for response
      const handleResponse = (event: MessageEvent) => {
        if (event.source !== window) return;

        if (event.data.type === 'RECORDING_STARTED') {
          window.removeEventListener('message', handleResponse);
          resolve({ success: true });
        } else if (event.data.type === 'RECORDING_START_FAILED') {
          window.removeEventListener('message', handleResponse);
          resolve({ 
            success: false, 
            error: event.data.error || 'Failed to start recording'
          });
        }
      };

      window.addEventListener('message', handleResponse);

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        resolve({ 
          success: false, 
          error: 'Recording start timeout - extension may not be responding'
        });
      }, 30000);
    });
  }

  /**
   * Register callback for when recording is completed
   */
  onRecordingComplete(callback: (recordingId: string) => void): () => void {
    this.recordingCompleteCallbacks.push(callback);

    // Return cleanup function
    return () => {
      const index = this.recordingCompleteCallbacks.indexOf(callback);
      if (index > -1) {
        this.recordingCompleteCallbacks.splice(index, 1);
      }
    };
  }

  private handleRecordingComplete(recordingId: string) {
    this.recordingCompleteCallbacks.forEach(callback => {
      try {
        callback(recordingId);
      } catch (error) {
        console.error('[Bridge] Error in recording complete callback:', error);
      }
    });
  }
}

// Export singleton instance
export const extensionBridge = ExtensionBridge.getInstance();