'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Circle, AlertCircle, Download } from 'lucide-react';
import { extensionBridge } from '@/lib/extension/extension-bridge';
import { toast } from 'sonner';
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

  // Update context when suite changes
  useEffect(() => {
    if (extensionInstalled) {
      extensionBridge.updateContext({
        testSuiteId,
        testSuiteName,
        accountId,
        sprintId
      });
    }
  }, [testSuiteId, testSuiteName, accountId, sprintId, extensionInstalled]);

  const checkExtension = async () => {
    setIsChecking(true);
    const installed = await extensionBridge.checkExtension();
    setExtensionInstalled(installed);
    setIsChecking(false);
  };

  const handleStartRecording = async () => {
    setIsStarting(true);

    try {
      const result = await extensionBridge.startRecording({
        testSuiteId,
        testSuiteName,
        accountId,
        sprintId
      });

      if (result.success) {
        toast.success('Recording started!', {
          description: 'Use the floating controls to annotate and capture your test.'
        });
      } else {
        toast.error('Failed to start recording', {
          description: result.error
        });
      }
    } catch (error) {
      toast.error('Failed to start recording', {
        description: error instanceof Error ? error.message : 'Unknown error'
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
          <span>Install Extension</span>
        </Button>

        <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extension Required</DialogTitle>
              <DialogDescription>
                The Surely Recorder extension is required to record tests across any website.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-2">Why do I need this?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Capture network requests and console logs</li>
                  <li>✓ Annotate with drawing, blur, and highlight tools</li>
                  <li>✓ Works across all your tabs and applications</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    // Open appropriate store based on browser
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
                  I've Installed It
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show loading state
  if (isChecking) {
    return (
      <Button size="md" disabled>
        <Circle className="h-4 w-4 animate-spin" />
        <span>Checking...</span>
      </Button>
    );
  }

  // Show record button
  return (
    <Button
      onClick={handleStartRecording}
      size="md"
      className="btn-primary shadow-sm"
      disabled={isStarting}
    >
      {isStarting ? (
        <>
          <Circle className="h-4 w-4 animate-spin" />
          <span>Starting...</span>
        </>
      ) : (
        <>
          <Circle className="h-4 w-4 fill-red-500 text-red-500" />
          <span>Record Screen</span>
        </>
      )}
    </Button>
  );
}