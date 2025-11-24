// ============================================
// components/bugs/BugTracking.tsx
// Bug tracking with pagination, bulk actions, and proper dialogs
// Mobile-first responsive with theme colors
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Plus, Grid, List, Code, Search, Eye, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { BugForm } from './BugForm';
import { BugGrid } from './BugGrid';
import { BugTable } from './BugTable';
import { BugDetailsDrawer } from './BugDetailsDrawer';
import { MiniBugView } from './MiniBugView';
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar';
import { Pagination } from '@/components/shared/Pagination';

interface BugTrackingProps {
  suiteId: string;
  onRefresh?: () => void;
}

type ViewMode = 'grid' | 'table' | 'mini';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-foreground/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 border border-border animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isDestructive ? 'bg-error/10' : 'bg-warning/10'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${isDestructive ? 'text-error' : 'text-warning'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${
              isDestructive
                ? 'bg-error hover:bg-error/90'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export function BugTracking({ suiteId, onRefresh }: BugTrackingProps) {
  const [bugs, setBugs] = useState<BugWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedBug, setSelectedBug] = useState<BugWithCreator | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBug, setEditingBug] = useState<BugWithCreator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBugIds, setSelectedBugIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  });

  useEffect(() => {
    if (suiteId) {
      fetchBugs();
    }
  }, [suiteId, searchQuery]);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      let query = supabase
        .from('bugs')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: bugsData, error: bugsError } = await query;
      
      if (bugsError) {
        console.error('Error fetching bugs:', bugsError);
        setError(bugsError.message);
        toast.error('Failed to fetch bugs', {
          description: bugsError.message
        });
        throw bugsError;
      }

      if (!bugsData || bugsData.length === 0) {
        setBugs([]);
        setLoading(false);
        return;
      }

      const creatorIds = [...new Set(bugsData.map(bug => bug.created_by).filter(Boolean))];
      let profilesMap = new Map();
      
      if (creatorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', creatorIds);

        if (!profilesError && profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      const transformedData: BugWithCreator[] = bugsData.map((bug: any) => ({
        ...bug,
        creator: bug.created_by ? profilesMap.get(bug.created_by) : undefined
      }));

      setBugs(transformedData);
    } catch (error: any) {
      console.error('Error in fetchBugs:', error);
      setError(error?.message || 'Failed to fetch bugs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBugs();
    onRefresh?.();
  };

  const handleCreateBug = () => {
    setEditingBug(null);
    setShowForm(true);
  };

  const handleEditBug = (bug: BugWithCreator) => {
    setEditingBug(bug);
    setShowForm(true);
    setSelectedBug(null);
  };

  const handleDeleteBug = async (bugId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Bug',
      message: 'Are you sure you want to delete this bug? This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const supabase = createClient();
          const { error } = await supabase.from('bugs').delete().eq('id', bugId);
          if (error) throw error;

          setBugs(bugs.filter(b => b.id !== bugId));
          if (selectedBug?.id === bugId) {
            setSelectedBug(null);
          }
          setSelectedBugIds(prev => prev.filter(id => id !== bugId));
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          toast.success('Bug deleted successfully');
        } catch (error: any) {
          console.error('Error deleting bug:', error);
          toast.error('Failed to delete bug', {
            description: error?.message
          });
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const handleBulkAction = async (
    actionId: string,
    selectedIds: string[],
    actionConfig: BulkAction,
    selectedOption?: ActionOption | null
  ) => {
    const supabase = createClient();
    
    try {
      switch (actionId) {
        case 'delete':
          await Promise.all(
            selectedIds.map(id => supabase.from('bugs').delete().eq('id', id))
          );
          setBugs(bugs.filter(b => !selectedIds.includes(b.id)));
          toast.success(`${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} deleted successfully`);
          break;
          
        case 'open':
          await Promise.all(
            selectedIds.map(id => supabase.from('bugs').update({ status: 'open' }).eq('id', id))
          );
          fetchBugs();
          toast.success(`${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} reopened`);
          break;
          
        case 'resolve':
          await Promise.all(
            selectedIds.map(id => supabase.from('bugs').update({ status: 'resolved' }).eq('id', id))
          );
          fetchBugs();
          toast.success(`${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} resolved`);
          break;
          
        case 'close':
          await Promise.all(
            selectedIds.map(id => supabase.from('bugs').update({ status: 'closed' }).eq('id', id))
          );
          fetchBugs();
          toast.success(`${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} closed`);
          break;
          
        case 'severity':
          if (selectedOption) {
            await Promise.all(
              selectedIds.map(id => 
                supabase.from('bugs').update({ severity: selectedOption.value }).eq('id', id)
              )
            );
            fetchBugs();
            toast.success(`Severity updated to ${selectedOption.label}`);
          }
          break;
          
        case 'archive':
          // Archive by closing the bugs
          await Promise.all(
            selectedIds.map(id => supabase.from('bugs').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id))
          );
          fetchBugs();
          toast.success(`${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} archived`);
          break;
      }
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast.error('Bulk action failed', {
        description: error?.message
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBug(null);
    fetchBugs();
    toast.success(editingBug ? 'Bug updated successfully' : 'Bug created successfully');
  };

  const handleUpdateBug = async (updatedBug: BugWithCreator) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bugs')
        .update(updatedBug)
        .eq('id', updatedBug.id);
      
      if (error) throw error;
      
      fetchBugs();
      toast.success('Bug updated successfully');
    } catch (error: any) {
      console.error('Error updating bug:', error);
      toast.error('Failed to update bug', {
        description: error?.message
      });
    }
  };

  const handleSelectBug = (bug: BugWithCreator) => {
    setSelectedBug(bug);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedBugIds(selectedIds);
  };

  // Pagination
  const paginatedBugs = bugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  if (showForm) {
    return (
      <BugForm
        suiteId={suiteId}
        bug={editingBug}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingBug(null);
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Bugs</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {bugs.length} total bugs
              {selectedBugIds.length > 0 && ` • ${selectedBugIds.length} selected`}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-theme-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-theme-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('mini')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'mini'
                    ? 'bg-background text-foreground shadow-theme-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Developer Mini View"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            <Button onClick={handleCreateBug} size="sm" className="whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Bug</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4">
            <p className="text-sm text-destructive">Error: {error}</p>
          </div>
        )}

        {/* Bugs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading bugs...</p>
          </div>
        ) : bugs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'No bugs match your search' : 'No bugs found for this suite'}
            </p>
            <Button variant="outline" onClick={handleCreateBug}>
              Create your first bug report
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'mini' ? (
              <MiniBugView
                bugs={paginatedBugs}
                onSelect={handleSelectBug}
                selectedBugs={selectedBugIds}
                onSelectionChange={handleSelectionChange}
              />
            ) : viewMode === 'table' ? (
              <BugTable
                bugs={paginatedBugs as any}
                onSelect={handleSelectBug}
                selectedBugs={selectedBugIds}
                onSelectionChange={handleSelectionChange}
                onRefresh={fetchBugs} 
              />
            ) : (
              <BugGrid
                bugs={paginatedBugs as any}
                onSelect={handleSelectBug}
              />
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={bugs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}

        {/* Bug Details Drawer */}
        <BugDetailsDrawer
          isOpen={selectedBug !== null}
          bug={selectedBug as any}
          onClose={() => setSelectedBug(null)}
          onEdit={(bugId) => {
            const bug = bugs.find(b => b.id === bugId);
            if (bug) handleEditBug(bug);
          }}
          onDelete={handleDeleteBug}
          onUpdateBug={handleUpdateBug}
        />
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={selectedBugIds}
        onClearSelection={() => setSelectedBugIds([])}
        assetType="bugs"
        onAction={handleBulkAction}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.isDestructive ? 'Delete' : 'Confirm'}
        isDestructive={confirmDialog.isDestructive}
      />
    </>
  );
}