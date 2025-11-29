// ============================================
// components/settings/DeleteSuiteDialog.tsx
// Delete suite confirmation
// ============================================
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSuiteActions } from '@/hooks/useSuiteActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteSuiteDialogProps {
  suite: any;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteSuiteDialog({
  suite,
  isOpen,
  onClose,
}: DeleteSuiteDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const { deleteSuite, loading } = useSuiteActions();
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== suite.name) {
      toast.error('Please type the suite name correctly to confirm');
      return;
    }

    const { error } = await deleteSuite(suite.id);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Suite deleted successfully');
      onClose();
      router.push('/dashboard/settings');
      router.refresh();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-background rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-error">Delete Suite</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-3 p-4 bg-error/10 rounded-lg border border-error/20">
            <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-error">
                This action cannot be undone
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete <strong>{suite.name}</strong> and all
                associated data including test cases, bugs, recordings, and sprints.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Type <span className="font-bold">{suite.name}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Type suite name here"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDelete}
              disabled={loading || confirmText !== suite.name}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Suite'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}