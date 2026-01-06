// ============================================
// FILE: components/test-cases/views/TestCaseDialogs.tsx
// Consistent dialog components using ConfirmDialog
// ============================================
'use client';

import React from 'react';
import { ConfirmDialog } from '@/components/ui/dialog';

interface DialogState {
  open: boolean;
  testCaseId: string | null;
}

interface BulkDialogState {
  open: boolean;
  count: number;
}

interface TestCaseDialogsProps {
  // Single-item dialogs
  deleteDialog: DialogState;
  onDeleteDialogChange: (state: DialogState) => void;
  onConfirmDelete: () => void;
  
  archiveDialog: DialogState;
  onArchiveDialogChange: (state: DialogState) => void;
  onConfirmArchive: () => void;
  
  // Bulk dialogs (kept for backward compatibility but not used - BulkActionsBar handles these)
  bulkDeleteDialog: BulkDialogState;
  onBulkDeleteDialogChange: (state: BulkDialogState) => void;
  onConfirmBulkDelete: () => void;
  
  bulkArchiveDialog: BulkDialogState;
  onBulkArchiveDialogChange: (state: BulkDialogState) => void;
  onConfirmBulkArchive: () => void;
}

export function TestCaseDialogs({
  deleteDialog,
  onDeleteDialogChange,
  onConfirmDelete,
  archiveDialog,
  onArchiveDialogChange,
  onConfirmArchive,
  bulkDeleteDialog,
  onBulkDeleteDialogChange,
  onConfirmBulkDelete,
  bulkArchiveDialog,
  onBulkArchiveDialogChange,
  onConfirmBulkArchive,
}: TestCaseDialogsProps) {
  return (
    <>
      {/* Single Delete Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => onDeleteDialogChange({ 
          open, 
          testCaseId: deleteDialog.testCaseId 
        })}
        onConfirm={onConfirmDelete}
        title="Delete Test Case"
        description="Are you sure you want to delete this test case? This action cannot be undone."
        confirmText="Delete"
        variant="error"
      />

      {/* Single Archive Dialog */}
      <ConfirmDialog
        open={archiveDialog.open}
        onOpenChange={(open) => onArchiveDialogChange({ 
          open, 
          testCaseId: archiveDialog.testCaseId 
        })}
        onConfirm={onConfirmArchive}
        title="Archive Test Case"
        description="Are you sure you want to archive this test case? You can restore it later from the archive."
        confirmText="Archive"
        variant="warning"
      />

      {/* Bulk Delete Dialog - kept for backward compatibility */}
      {bulkDeleteDialog.open && (
        <ConfirmDialog
          open={bulkDeleteDialog.open}
          onOpenChange={(open) => onBulkDeleteDialogChange({ 
            open, 
            count: bulkDeleteDialog.count 
          })}
          onConfirm={onConfirmBulkDelete}
          title={`Delete ${bulkDeleteDialog.count} Test Case${bulkDeleteDialog.count > 1 ? 's' : ''}`}
          description={`Are you sure you want to delete ${bulkDeleteDialog.count} test case${bulkDeleteDialog.count > 1 ? 's' : ''}? This action cannot be undone.`}
          confirmText={`Delete ${bulkDeleteDialog.count > 1 ? `(${bulkDeleteDialog.count})` : ''}`}
          variant="error"
        />
      )}

      {/* Bulk Archive Dialog - kept for backward compatibility */}
      {bulkArchiveDialog.open && (
        <ConfirmDialog
          open={bulkArchiveDialog.open}
          onOpenChange={(open) => onBulkArchiveDialogChange({ 
            open, 
            count: bulkArchiveDialog.count 
          })}
          onConfirm={onConfirmBulkArchive}
          title={`Archive ${bulkArchiveDialog.count} Test Case${bulkArchiveDialog.count > 1 ? 's' : ''}`}
          description={`Are you sure you want to archive ${bulkArchiveDialog.count} test case${bulkArchiveDialog.count > 1 ? 's' : ''}? You can restore them later from the archive.`}
          confirmText={`Archive ${bulkArchiveDialog.count > 1 ? `(${bulkArchiveDialog.count})` : ''}`}
          variant="warning"
        />
      )}
    </>
  );
}