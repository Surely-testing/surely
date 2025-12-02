// ============================================
// components/settings/SuiteDetailsModal.tsx
// Portal-based modal for suite details
// ============================================
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SuiteDetailView } from './SuiteDetailsView';

interface SuiteDetailsModalProps {
  suite: any;
  userRole: 'owner' | 'admin' | 'member';
  userId: string;
  accountType: 'individual' | 'organization';
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function SuiteDetailsModal({
  suite,
  userRole,
  userId,
  accountType,
  isOpen,
  onClose,
  onRefresh,
}: SuiteDetailsModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div 
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-lg bg-background shadow-xl overflow-hidden flex flex-col"
        style={{ zIndex: 51 }}
      >
        {/* Close Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h2 className="text-lg font-semibold">Suite Details</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <SuiteDetailView
            suite={suite}
            userRole={userRole}
            userId={userId}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
}