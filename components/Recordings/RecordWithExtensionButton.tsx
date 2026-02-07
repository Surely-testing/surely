// ============================================
// components/recordings/RecordWithExtensionButton.tsx
// Works with new persistent auth system
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Circle, AlertCircle, Download, CheckCircle2, XCircle } from 'lucide-react';
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

  useEffect(() => {
    checkExtension();

    // Listen for recording events
    const cleanupComplete = extensionBridge.onRecordingComplete((recordingId) => {
      console.log('[Button] Recording completed:', recordingId);
      toast.success('Recording saved successfully!', {
        description: 'Your test recording is now available',
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
      });
      onRecordingComplete?.();
    });

    const cleanupStart = extensionBridge.onRecordingStart(() => {
      console.log('[Button] Recording started successfully');
    });

    const cleanupFail = extensionBridge.onRecordingFail((error) => {
      console.error('[Button] Recording failed:', error);
      toast.error('Recording failed', {
        description: error,
        duration: 7000,
        icon: <XCircle className="h-5 w-5 text-red-500" />
      });
    });

    return () => {
      cleanupComplete();
      cleanupStart();
      cleanupFail();
    };
  }, [onRecordingComplete]);

  // Note: ExtensionAuthSync component handles sending auth context automatically
  // We don't need to manually sync here anymore

  const checkExtension = async () => {
    setIsChecking(true);
    const installed = await extensionBridge.checkExtension();
    setExtensionInstalled(installed);
    setIsChecking(false);

    if (installed) {
      console.log('[Button] Extension installed and ready');
    }
  };

  const handleStartRecording = async () => {
    setIsStarting(true);

    try {
      // Extension should already have auth context from ExtensionAuthSync
      // But we'll ensure it's fresh just in case
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error('Authentication error', {
          description: 'Please refresh the page and try again'
        });
        setIsStarting(false);
        return;
      }

      // Get Supabase config
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      if (!supabaseUrl || !supabaseAnonKey) {
        toast.error('Configuration error');
        setIsStarting(false);
        return;
      }

      // Send fresh auth context (in case it changed)
      extensionBridge.setAuthContext({
        accountId,
        testSuiteId,
        testSuiteName,
        sprintId,
        userToken: session.access_token,
        supabaseUrl,
        supabaseAnonKey,
        userEmail: session.user.email || 'Unknown User'
      });

      // Give extension a moment to process
      await new Promise(resolve => setTimeout(resolve, 200));

      // Start recording
      const result = await extensionBridge.startRecording();

      if (result.success) {
        toast.success('Recording started!', {
          description: 'Screen sharing prompt will appear. Select what you want to record.',
          duration: 5000,
          icon: <Circle className="h-5 w-5 fill-red-500 text-red-500 animate-pulse" />
        });

        setTimeout(() => {
          toast.info('Recording in progress', {
            description: 'Use the floating controls to pause, annotate, or stop. Network logs and console are being captured automatically.',
            duration: 8000
          });
        }, 2000);
      } else {
        toast.error('Failed to start recording', {
          description: result.error || 'Please try again',
          duration: 7000
        });
      }
    } catch (error) {
      console.error('[Button] Unexpected error:', error);
      toast.error('Failed to start recording', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 7000
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  ⏱️ Recording Limit: 5 Minutes
                </p>
                <p className="text-xs text-yellow-700">
                  Keep recordings focused. Recording auto-stops after 5 minutes.
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-sm">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Screen & audio recording with countdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Automatic network & console log capture</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Real-time annotation tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>DOM replay with rrweb</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Multi-tab support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Auto-sync to your test suite</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
                    const storeUrl = isFirefox
                      ? 'https://addons.mozilla.org/firefox/'
                      : 'https://chrome.google.com/webstore';
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
                  I've Installed It - Check Again
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                After installation, the extension will automatically connect.
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

  // Show record button
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
          <span>Record Screen</span>
        </>
      )}
    </Button>
  );
}