'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Circle, AlertCircle, Download } from 'lucide-react';
import { extensionBridge } from '@/lib/extension/extension-bridge';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RecordWithExtensionButtonProps {
  testSuiteId: string;
  testSuiteName: string;
  accountId: string;
  sprintId?: string | null;
  onRecordingComplete?: () => void;
}

export function RecordWithExtensionButton({
  testSuiteId,
  testSuiteName,
  accountId,
  sprintId,
  onRecordingComplete
}: RecordWithExtensionButtonProps) {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);

  // Check if extension is installed on mount
  useEffect(() => {
    checkExtension();

    // Listen for recording completion
    const cleanup = extensionBridge.onRecordingComplete((recordingId) => {
      toast.success('Recording saved successfully!');
      onRecordingComplete?.();
    });

    return cleanup;
  }, [onRecordingComplete]);

  // Send auth context to extension whenever it changes
  useEffect(() => {
    if (extensionInstalled) {
      sendAuthContextToExtension();
    }
  }, [extensionInstalled, testSuiteId, testSuiteName, accountId, sprintId]);

  const checkExtension = async () => {
    setIsChecking(true);
    const installed = await extensionBridge.checkExtension();
    setExtensionInstalled(installed);
    setIsChecking(false);
    
    if (!installed) {
      console.log('[Button] Extension not installed');
    }
  };

  const sendAuthContextToExtension = async () => {
    try {
      // Create Supabase client
      const supabase = createClient();
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Button] Error getting session:', error);
        return;
      }
      
      if (!session) {
        console.error('[Button] No active session');
        return;
      }

      // Get Supabase config from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Send to extension
      extensionBridge.setAuthContext({
        accountId,
        testSuiteId,
        testSuiteName,
        sprintId,
        userToken: session.access_token,
        supabaseUrl,
        supabaseAnonKey
      });

      console.log('[Button] Auth context sent to extension');
    } catch (error) {
      console.error('[Button] Error sending auth context:', error);
    }
  };

  const handleStartRecording = async () => {
    setIsStarting(true);

    try {
      // Ensure auth context is sent
      await sendAuthContextToExtension();
      
      // Wait a moment for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start recording directly
      const result = await extensionBridge.startRecording();

      if (result.success) {
        toast.success('Recording started!', {
          description: 'Use the floating controls to capture your test. Network logs and console will be recorded automatically.',
          duration: 5000
        });
      } else {
        toast.error('Failed to start recording', {
          description: result.error,
          duration: 5000
        });
      }
    } catch (error) {
      toast.error('Failed to start recording', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Show install prompt if extension not installed
  if (!isChecking && !extensionInstalled) {
    return (
      <>
        <Button
          onClick={() => setShowInstallDialog(true)}
          size="md"
          variant="outline"
          className="border-orange-500 text-orange-600 hover:bg-orange-50"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Install Extension to Record</span>
        </Button>

        <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Surely Recorder Extension Required</DialogTitle>
              <DialogDescription>
                Install the browser extension to record tests with advanced features
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-sm">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Screen & audio recording with countdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Network request & console log capture</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Drawing, blur & highlight annotation tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Works across all websites & tabs</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
                    const storeUrl = isFirefox 
                      ? 'https://addons.mozilla.org/firefox/' // Update with actual URL
                      : 'https://chrome.google.com/webstore'; // Update with actual URL
                    window.open(storeUrl, '_blank');
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  Install from Store
                </Button>
                
                <Button
                  onClick={() => {
                    checkExtension();
                    setShowInstallDialog(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  I've Installed It - Refresh
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                After installation, refresh this page and click the Record button
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show loading state
  if (isChecking) {
    return (
      <Button size="md" disabled variant="outline">
        <Circle className="h-4 w-4 animate-spin" />
        <span>Checking extension...</span>
      </Button>
    );
  }

  // Show record button - DIRECTLY starts recording
  return (
    <Button
      onClick={handleStartRecording}
      size="md"
      className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
      disabled={isStarting}
    >
      {isStarting ? (
        <>
          <Circle className="h-4 w-4 animate-spin" />
          <span>Starting...</span>
        </>
      ) : (
        <>
          <Circle className="h-4 w-4 fill-white" />
          <span>Record Test</span>
        </>
      )}
    </Button>
  );
}