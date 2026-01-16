// ============================================
// lib/extension/extension-bridge.ts
// Enhanced with user email for display
// ============================================

export interface ExtensionAuthContext {
  accountId: string;
  testSuiteId: string;
  testSuiteName: string;
  sprintId?: string | null;
  userToken: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  userEmail: string; // ADDED for popup display
}

export interface RecordingStartResponse {
  success: boolean;
  error?: string;
}

class ExtensionBridge {
  private static instance: ExtensionBridge;
  private authContext: ExtensionAuthContext | null = null;
  private recordingCompleteCallbacks: ((recordingId: string) => void)[] = [];
  private recordingStartCallbacks: (() => void)[] = [];
  private recordingFailCallbacks: ((error: string) => void)[] = [];

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
          this.recordingStartCallbacks.forEach(cb => {
            try {
              cb();
            } catch (error) {
              console.error('[Bridge] Error in recording start callback:', error);
            }
          });
          break;

        case 'RECORDING_START_FAILED':
          console.error('[Bridge] Recording failed to start:', message.error);
          this.recordingFailCallbacks.forEach(cb => {
            try {
              cb(message.error);
            } catch (error) {
              console.error('[Bridge] Error in recording fail callback:', error);
            }
          });
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

  setAuthContext(context: ExtensionAuthContext): void {
    console.log('[Bridge] Setting auth context for:', context.userEmail);
    this.authContext = context;
    this.sendAuthContextToExtension();
  }

  getAuthContext(): ExtensionAuthContext | null {
    return this.authContext;
  }

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

  async checkExtension(): Promise<boolean> {
    return new Promise((resolve) => {
      window.postMessage({ type: 'EXTENSION_PING' }, '*');

      const handlePong = (event: MessageEvent) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'EXTENSION_PONG') {
          window.removeEventListener('message', handlePong);
          resolve(true);
        }
      };

      window.addEventListener('message', handlePong);

      setTimeout(() => {
        window.removeEventListener('message', handlePong);
        resolve(false);
      }, 2000);
    });
  }

  async startRecording(): Promise<RecordingStartResponse> {
    if (!this.authContext) {
      return {
        success: false,
        error: 'No authentication context available. Please refresh the page.'
      };
    }

    return new Promise((resolve) => {
      console.log('[Bridge] Requesting recording start');

      const handleStarted = (event: MessageEvent) => {
        if (event.source !== window) return;

        if (event.data.type === 'RECORDING_STARTED') {
          cleanup();
          resolve({ success: true });
        } else if (event.data.type === 'RECORDING_START_FAILED') {
          cleanup();
          resolve({ 
            success: false, 
            error: event.data.error || 'Failed to start recording'
          });
        }
      };

      const cleanup = () => {
        window.removeEventListener('message', handleStarted);
        clearTimeout(timeout);
      };

      window.addEventListener('message', handleStarted);

      window.postMessage({
        type: 'START_RECORDING',
        data: this.authContext
      }, '*');

      const timeout = setTimeout(() => {
        cleanup();
        resolve({ 
          success: false, 
          error: 'Recording start timeout - extension may not be responding'
        });
      }, 30000);
    });
  }

  onRecordingStart(callback: () => void): () => void {
    this.recordingStartCallbacks.push(callback);
    return () => {
      const index = this.recordingStartCallbacks.indexOf(callback);
      if (index > -1) {
        this.recordingStartCallbacks.splice(index, 1);
      }
    };
  }

  onRecordingFail(callback: (error: string) => void): () => void {
    this.recordingFailCallbacks.push(callback);
    return () => {
      const index = this.recordingFailCallbacks.indexOf(callback);
      if (index > -1) {
        this.recordingFailCallbacks.splice(index, 1);
      }
    };
  }

  onRecordingComplete(callback: (recordingId: string) => void): () => void {
    this.recordingCompleteCallbacks.push(callback);
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

  clearAuthContext(): void {
    this.authContext = null;
    console.log('[Bridge] Auth context cleared');
  }
}

export const extensionBridge = ExtensionBridge.getInstance();