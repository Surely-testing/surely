'use client'

import React from 'react'
import { Trash2, Archive } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DialogState, BulkDialogState } from '@/types/test-case-view.types'

interface TestCaseDialogsProps {
  deleteDialog: DialogState
  onDeleteDialogChange: (state: DialogState) => void
  onConfirmDelete: () => void
  archiveDialog: DialogState
  onArchiveDialogChange: (state: DialogState) => void
  onConfirmArchive: () => void
  bulkDeleteDialog: BulkDialogState
  onBulkDeleteDialogChange: (state: BulkDialogState) => void
  onConfirmBulkDelete: () => void
  bulkArchiveDialog: BulkDialogState
  onBulkArchiveDialogChange: (state: BulkDialogState) => void
  onConfirmBulkArchive: () => void
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
      {/* Delete Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => onDeleteDialogChange({ open, testCaseId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Trash?</DialogTitle>
            <DialogDescription>
              This test case will be moved to trash. You can restore it later from the Archive & Trash page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onDeleteDialogChange({ open: false, testCaseId: null })}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-all inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Move to Trash
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog 
        open={archiveDialog.open} 
        onOpenChange={(open) => onArchiveDialogChange({ open, testCaseId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Test Case?</DialogTitle>
            <DialogDescription>
              This test case will be archived. You can restore it later from the Archive & Trash page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onArchiveDialogChange({ open: false, testCaseId: null })}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmArchive}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all inline-flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog 
        open={bulkDeleteDialog.open} 
        onOpenChange={(open) => onBulkDeleteDialogChange({ open, count: 0 })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Move {bulkDeleteDialog.count} Test Case{bulkDeleteDialog.count > 1 ? 's' : ''} to Trash?
            </DialogTitle>
            <DialogDescription>
              These test cases will be moved to trash. You can restore them later from the Archive & Trash page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onBulkDeleteDialogChange({ open: false, count: 0 })}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmBulkDelete}
              className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-all inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Move to Trash
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Archive Dialog */}
      <Dialog 
        open={bulkArchiveDialog.open} 
        onOpenChange={(open) => onBulkArchiveDialogChange({ open, count: 0 })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Archive {bulkArchiveDialog.count} Test Case{bulkArchiveDialog.count > 1 ? 's' : ''}?
            </DialogTitle>
            <DialogDescription>
              These test cases will be archived. You can restore them later from the Archive & Trash page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onBulkArchiveDialogChange({ open: false, count: 0 })}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmBulkArchive}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all inline-flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}