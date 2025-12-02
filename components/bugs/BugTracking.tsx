// ============================================
// components/bugs/BugTracking.tsx
// Bug tracking with unified controls bar matching TestDataTypesView design
// ============================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Grid, List, Code, Search, AlertTriangle, Filter } from 'lucide-react';
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
type SortField = 'created_at' | 'updated_at' | 'title' | 'severity' | 'status';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'status' | 'severity' | 'sprint';

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
        className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border animate-in fade-in zoom-in-95 duration-200"
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
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBug, setEditingBug] = useState<BugWithCreator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBugIds, setSelectedBugIds] = useState<string[]>([]);
  
  // Filters, Sorting, Grouping
  const [filterStatus, setFilterStatus] = useState<BugStatus[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<BugSeverity[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
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

  const handleEditBug = (bug: BugWithCreator) => {
    setEditingBug(bug);
    setShowEditForm(true);
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
          await Promise.all(
            selectedIds.map(id => supabase.from('bugs').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id))
          );
          fetchBugs();
          toast.success(`${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} archived`);
          break;
      }
      setSelectedBugIds([]);
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast.error('Bulk action failed', {
        description: error?.message
      });
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    setEditingBug(null);
    fetchBugs();
    toast.success('Bug updated successfully');
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

  // Apply filters, sorting
  const getFilteredAndSortedBugs = () => {
    let filtered = [...bugs];

    if (filterStatus.length > 0) {
      filtered = filtered.filter(bug => filterStatus.includes(bug.status as BugStatus));
    }

    if (filterSeverity.length > 0) {
      filtered = filtered.filter(bug => filterSeverity.includes(bug.severity as BugSeverity));
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'created_at' || sortField === 'updated_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredBugs = useMemo(() => getFilteredAndSortedBugs(), [
    bugs,
    filterStatus,
    filterSeverity,
    sortField,
    sortOrder
  ]);

  // Group bugs if needed
  const getGroupedBugs = () => {
    if (groupBy === 'none') {
      return { 'All Bugs': filteredBugs };
    }

    const grouped: Record<string, BugWithCreator[]> = {};

    filteredBugs.forEach(bug => {
      let groupKey = 'Uncategorized';

      switch (groupBy) {
        case 'status':
          groupKey = bug.status ? bug.status.replace('_', ' ').toUpperCase() : 'NO STATUS';
          break;
        case 'severity':
          groupKey = bug.severity ? bug.severity.toUpperCase() : 'NO SEVERITY';
          break;
        case 'sprint':
          groupKey = bug.sprint_id ? `Sprint ${bug.sprint_id.slice(-8)}` : 'NO SPRINT';
          break;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(bug);
    });

    return grouped;
  };

  const groupedBugs = getGroupedBugs();

  // Pagination
  const paginatedBugs = useMemo(() => {
    if (groupBy === 'none') {
      return filteredBugs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    }
    return filteredBugs;
  }, [filteredBugs, currentPage, itemsPerPage, groupBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const toggleStatusFilter = (status: BugStatus) => {
    setFilterStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleSeverityFilter = (severity: BugSeverity) => {
    setFilterSeverity(prev =>
      prev.includes(severity) ? prev.filter(s => s !== severity) : [...prev, severity]
    );
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterSeverity([]);
    setSortField('created_at');
    setSortOrder('desc');
  };

  const handleSelectAll = () => {
    if (selectedBugIds.length === paginatedBugs.length && paginatedBugs.length > 0) {
      setSelectedBugIds([]);
    } else {
      setSelectedBugIds(paginatedBugs.map(bug => bug.id));
    }
  };

  const activeFiltersCount = filterStatus.length + filterSeverity.length;

  // Show edit form if editing
  if (showEditForm && editingBug) {
    return (
      <BugForm
        suiteId={suiteId}
        bug={editingBug}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowEditForm(false);
          setEditingBug(null);
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-6 pb-24">
        {/* Main Content Card */}
        <div className="bg-card rounded-lg overflow-hidden border border-border">
          {/* Unified Controls Bar */}
          <div className="px-3 py-2 border-b border-border bg-card">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Side: Select All */}
              <div className="flex items-center gap-3 order-2 lg:order-1">
                <input
                  type="checkbox"
                  checked={selectedBugIds.length === paginatedBugs.length && paginatedBugs.length > 0}
                  onChange={handleSelectAll}
                  disabled={loading}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Select All
                </span>
              </div>

              {/* Right Side: Search, Filters, Sort, Group, View Toggle */}
              <div className="flex items-center gap-3 flex-1 justify-end order-1 lg:order-2 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search bugs..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>

                {/* Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                  disabled={loading}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>

                {/* Sort Dropdown */}
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortField(field as SortField);
                    setSortOrder(order as SortOrder);
                  }}
                  disabled={loading}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground disabled:opacity-50"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="updated_at-desc">Recently Updated</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="severity-desc">Severity (High-Low)</option>
                  <option value="severity-asc">Severity (Low-High)</option>
                </select>

                {/* Group By Dropdown */}
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  disabled={loading}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground disabled:opacity-50"
                >
                  <option value="none">No Grouping</option>
                  <option value="status">Group by Status</option>
                  <option value="severity">Group by Severity</option>
                  <option value="sprint">Group by Sprint</option>
                </select>

                {/* View Toggle */}
                <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    disabled={loading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      viewMode === 'grid'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    disabled={loading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      viewMode === 'table'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('mini')}
                    disabled={loading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      viewMode === 'mini'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Developer Mini View"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['open', 'in_progress', 'resolved', 'closed', 'reopened'] as BugStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => toggleStatusFilter(status)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                            filterStatus.includes(status)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-foreground border-border hover:border-primary'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Severity
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['low', 'medium', 'high', 'critical'] as BugSeverity[]).map(severity => (
                        <button
                          key={severity}
                          onClick={() => toggleSeverityFilter(severity)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                            filterSeverity.includes(severity)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-foreground border-border hover:border-primary'
                          }`}
                        >
                          {severity}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Stats Bar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredBugs.length} of {bugs.length} bugs
                {selectedBugIds.length > 0 && ` • ${selectedBugIds.length} selected`}
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-destructive">Error: {error}</p>
              </div>
            )}

            {/* Bugs List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading bugs...</p>
              </div>
            ) : filteredBugs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-4">
                  {bugs.length === 0
                    ? searchQuery
                      ? 'No bugs match your search'
                      : 'No bugs found for this suite'
                    : 'No bugs match the selected filters'}
                </p>
                {bugs.length > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'mini' ? (
                  groupBy === 'none' ? (
                    <MiniBugView
                      bugs={paginatedBugs}
                      onSelect={handleSelectBug}
                      selectedBugs={selectedBugIds}
                      onSelectionChange={handleSelectionChange}
                      onRefresh={fetchBugs}
                    />
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedBugs).map(([groupName, groupBugs]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-semibold text-foreground uppercase">
                              {groupName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              ({groupBugs.length})
                            </span>
                          </div>
                          <MiniBugView
                            bugs={groupBugs}
                            onSelect={handleSelectBug}
                            selectedBugs={selectedBugIds}
                            onSelectionChange={handleSelectionChange}
                            onRefresh={fetchBugs}
                          />
                        </div>
                      ))}
                    </div>
                  )
                ) : viewMode === 'table' ? (
                  groupBy === 'none' ? (
                    <BugTable
                      bugs={paginatedBugs as any}
                      onSelect={handleSelectBug}
                      selectedBugs={selectedBugIds}
                      onSelectionChange={handleSelectionChange}
                      onRefresh={fetchBugs}
                    />
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedBugs).map(([groupName, groupBugs]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-semibold text-foreground uppercase">
                              {groupName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              ({groupBugs.length})
                            </span>
                          </div>
                          <BugTable
                            bugs={groupBugs as any}
                            onSelect={handleSelectBug}
                            selectedBugs={selectedBugIds}
                            onSelectionChange={handleSelectionChange}
                            onRefresh={fetchBugs}
                          />
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  groupBy === 'none' ? (
                    <BugGrid
                      bugs={paginatedBugs as any}
                      onSelect={handleSelectBug}
                      selectedBugs={selectedBugIds}
                      onSelectionChange={handleSelectionChange}
                    />
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedBugs).map(([groupName, groupBugs]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-semibold text-foreground uppercase">
                              {groupName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              ({groupBugs.length})
                            </span>
                          </div>
                          <BugGrid
                            bugs={groupBugs as any}
                            onSelect={handleSelectBug}
                            selectedBugs={selectedBugIds}
                            onSelectionChange={handleSelectionChange}
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Pagination - Only show when not grouped */}
                {groupBy === 'none' && filteredBugs.length > itemsPerPage && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={filteredBugs.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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