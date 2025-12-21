'use client';

import { useState, useEffect, SetStateAction } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SuggestionWithCreator, SuggestionStatus, SuggestionPriority, SuggestionCategory } from '@/types/suggestion.types';
import { Plus, Grid, List, Search, Filter, Sparkles, Upload, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SuggestionGrid } from '../suggestions/SuggestionGrid';
import { SuggestionTable } from '../suggestions/SuggestionTable';
import { SuggestionForm } from '../suggestions/SuggestionForm';
import { SuggestionDetailsDrawer } from '../suggestions/SuggestionDetailsDrawer';
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Pagination } from '@/components/shared/Pagination';
import { logger } from '@/lib/utils/logger';

interface SuggestionsProps {
  suiteId: string;
  onRefresh?: () => void;
}

type ViewMode = 'grid' | 'table';
type SortField = 'created_at' | 'updated_at' | 'title' | 'upvotes' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'status' | 'priority' | 'category' | 'sprint';

export function Suggestions({ suiteId, onRefresh }: SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionWithCreator | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSuggestion, setEditingSuggestion] = useState<SuggestionWithCreator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filters, Sorting, Grouping
  const [filterStatus, setFilterStatus] = useState<SuggestionStatus[]>([]);
  const [filterPriority, setFilterPriority] = useState<SuggestionPriority[]>([]);
  const [filterCategory, setFilterCategory] = useState<SuggestionCategory[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (suiteId) {
      fetchCurrentUser();
      fetchSuggestions();
    }
  }, [suiteId, searchQuery]);

  const fetchCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      logger.log('Error fetching user:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      let query = supabase
        .from('suggestions')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: suggestionsData, error: suggestionsError } = await query;

      if (suggestionsError) {
        logger.log('Error fetching suggestions:', suggestionsError);
        setError(suggestionsError.message);
        toast.error('Failed to fetch suggestions', {
          description: suggestionsError.message
        });
        throw suggestionsError;
      }

      if (!suggestionsData || suggestionsData.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set([
        ...suggestionsData.map(s => s.created_by),
        ...suggestionsData.map(s => s.assigned_to).filter((id): id is string => id !== null && id !== undefined)
      ])];
      let profilesMap = new Map();

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);

        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      const transformedData: SuggestionWithCreator[] = suggestionsData.map((suggestion: any) => ({
        ...suggestion,
        creator: suggestion.created_by ? profilesMap.get(suggestion.created_by) : undefined,
        assignee: suggestion.assigned_to ? profilesMap.get(suggestion.assigned_to) : undefined
      }));

      setSuggestions(transformedData);
    } catch (error: any) {
      logger.log('Error in fetchSuggestions:', error);
      setError(error?.message || 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (suggestionId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      toast.error('You must be logged in to vote');
      return;
    }

    try {
      const supabase = createClient();
      const suggestion = suggestions.find(s => s.id === suggestionId);

      if (!suggestion) return;

      const currentVote = suggestion.votes?.[currentUser.id];
      let newVotes = { ...suggestion.votes };
      let upvotes = suggestion.upvotes;
      let downvotes = suggestion.downvotes;

      if (currentVote === 'upvote') upvotes--;
      if (currentVote === 'downvote') downvotes--;

      if (currentVote === voteType) {
        delete newVotes[currentUser.id];
      } else {
        newVotes[currentUser.id] = voteType;
        if (voteType === 'upvote') upvotes++;
        if (voteType === 'downvote') downvotes++;
      }

      const { error } = await supabase
        .from('suggestions')
        .update({
          votes: newVotes,
          upvotes,
          downvotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;

      toast.success('Vote recorded');
      fetchSuggestions();
    } catch (error: any) {
      logger.log('Error voting:', error);
      toast.error('Failed to vote', {
        description: error?.message
      });
    }
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
            selectedIds.map(id => supabase.from('suggestions').delete().eq('id', id))
          );
          setSuggestions(suggestions.filter(s => !selectedIds.includes(s.id)));
          toast.success(`${selectedIds.length} suggestion${selectedIds.length > 1 ? 's' : ''} deleted successfully`);
          break;

        case 'approve':
          await Promise.all(
            selectedIds.map(id => supabase.from('suggestions').update({ status: 'accepted' }).eq('id', id))
          );
          fetchSuggestions();
          toast.success(`${selectedIds.length} suggestion${selectedIds.length > 1 ? 's' : ''} accepted`);
          break;

        case 'reject':
          await Promise.all(
            selectedIds.map(id => supabase.from('suggestions').update({ status: 'rejected' }).eq('id', id))
          );
          fetchSuggestions();
          toast.success(`${selectedIds.length} suggestion${selectedIds.length > 1 ? 's' : ''} rejected`);
          break;

        case 'review':
          await Promise.all(
            selectedIds.map(id => supabase.from('suggestions').update({ status: 'under_review' }).eq('id', id))
          );
          fetchSuggestions();
          toast.success(`${selectedIds.length} suggestion${selectedIds.length > 1 ? 's' : ''} marked for review`);
          break;

        case 'priority':
          if (selectedOption) {
            await Promise.all(
              selectedIds.map(id =>
                supabase.from('suggestions').update({ priority: selectedOption.value }).eq('id', id)
              )
            );
            fetchSuggestions();
            toast.success(`Priority updated to ${selectedOption.label}`);
          }
          break;
      }
      setSelectedSuggestionIds([]);
    } catch (error: any) {
      logger.log('Bulk action error:', error);
      toast.error('Bulk action failed', {
        description: error?.message
      });
    }
  };

  const handleCreateClick = () => {
    setShowForm(true);
  };

  // Apply filters, sorting
  const getFilteredAndSortedSuggestions = () => {
    let filtered = [...suggestions];

    if (filterStatus.length > 0) {
      filtered = filtered.filter(s => filterStatus.includes(s.status as SuggestionStatus));
    }

    if (filterPriority.length > 0) {
      filtered = filtered.filter(s => filterPriority.includes(s.priority as SuggestionPriority));
    }

    if (filterCategory.length > 0) {
      filtered = filtered.filter(s => filterCategory.includes(s.category as SuggestionCategory));
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

  const filteredSuggestions = getFilteredAndSortedSuggestions();

  // Group suggestions if needed
  const getGroupedSuggestions = () => {
    if (groupBy === 'none') {
      return { 'All Suggestions': filteredSuggestions };
    }

    const grouped: Record<string, SuggestionWithCreator[]> = {};

    filteredSuggestions.forEach(suggestion => {
      let groupKey = 'Uncategorized';

      switch (groupBy) {
        case 'status':
          groupKey = suggestion.status ? suggestion.status.replace('_', ' ').toUpperCase() : 'NO STATUS';
          break;
        case 'priority':
          groupKey = suggestion.priority ? suggestion.priority.toUpperCase() : 'NO PRIORITY';
          break;
        case 'category':
          groupKey = suggestion.category ? suggestion.category.replace('_', ' ').toUpperCase() : 'NO CATEGORY';
          break;
        case 'sprint':
          groupKey = suggestion.sprint_id ? `Sprint ${suggestion.sprint_id.slice(-8)}` : 'NO SPRINT';
          break;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(suggestion);
    });

    return grouped;
  };

  const groupedSuggestions = getGroupedSuggestions();

  // Pagination
  const getPaginatedSuggestions = () => {
    if (groupBy === 'none') {
      return filteredSuggestions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    }
    return filteredSuggestions;
  };

  const paginatedSuggestions = getPaginatedSuggestions();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const toggleStatusFilter = (status: SuggestionStatus) => {
    setFilterStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: SuggestionPriority) => {
    setFilterPriority(prev =>
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const toggleCategoryFilter = (category: SuggestionCategory) => {
    setFilterCategory(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterPriority([]);
    setFilterCategory([]);
    setSortField('created_at');
    setSortOrder('desc');
  };

  const handleSelectAll = () => {
    if (selectedSuggestionIds.length === paginatedSuggestions.length && paginatedSuggestions.length > 0) {
      setSelectedSuggestionIds([]);
    } else {
      setSelectedSuggestionIds(paginatedSuggestions.map(s => s.id));
    }
  };

  const activeFiltersCount = filterStatus.length + filterPriority.length + filterCategory.length;

  if (showForm) {
    return (
      <SuggestionForm
        suiteId={suiteId}
        suggestion={editingSuggestion}
        onSuccess={() => {
          setShowForm(false);
          setEditingSuggestion(null);
          fetchSuggestions();
          toast.success(editingSuggestion ? 'Suggestion updated' : 'Suggestion created');
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingSuggestion(null);
        }}
      />
    );
  }

  if (!loading && suggestions.length === 0) {
    return (
      <>
        <EmptyState
          icon={Lightbulb}
          iconSize={64}
          title="No suggestions yet"
          description="Share your ideas to improve this test suite"
          actions={[
            {
              label: 'Create Suggestion',
              onClick: handleCreateClick,
              variant: 'primary',
              icon: Plus,
            },
            {
              label: 'Import Suggestions',
              onClick: () => toast.info('Import feature coming soon'),
              variant: 'secondary',
              icon: Upload,
            },
            {
              label: 'AI Generate',
              onClick: () => toast.info('AI generation coming soon'),
              variant: 'accent',
              icon: Sparkles,
            },
          ]}
        />
      </>
    );
  }


  return (
    <>
      <div className="space-y-6 pb-24">
        {/* Main Content Card */}
        <div>
          {/* Unified Controls Bar - Mobile First, Desktop Preserved */}
          <div className="px-3 py-2 border-b border-border bg-card">
            <div className="flex flex-col gap-3 lg:gap-0">
              {/* Mobile Layout (< lg screens) */}
              <div className="lg:hidden space-y-3">
                {/* Row 1: Search (Full Width) */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search suggestions..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>

                {/* Row 2: Filter, Sort, Grouping */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    disabled={loading}
                    className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-');
                      setSortField(field as SortField);
                      setSortOrder(order as SortOrder);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">Newest First</SelectItem>
                      <SelectItem value="created_at-asc">Oldest First</SelectItem>
                      <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                      <SelectItem value="upvotes-desc">Most Upvoted</SelectItem>
                      <SelectItem value="upvotes-asc">Least Upvoted</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Group By Dropdown */}
                  <Select
                    value={groupBy}
                    onValueChange={(value) => setGroupBy(value as GroupBy)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                      <SelectValue placeholder="Group by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Grouping</SelectItem>
                      <SelectItem value="status">Group by Status</SelectItem>
                      <SelectItem value="priority">Group by Priority</SelectItem>
                      <SelectItem value="category">Group by Category</SelectItem>
                      <SelectItem value="sprint">Group by Sprint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 3: Select All (Left) | View Toggle (Right) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestionIds.length === paginatedSuggestions.length && paginatedSuggestions.length > 0}
                      onChange={handleSelectAll}
                      disabled={loading}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      Select All
                    </span>
                  </div>

                  {/* View Toggle */}
                  <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      disabled={loading}
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
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
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout (lg+ screens) - Original Design */}
              <div className="hidden lg:flex lg:flex-col lg:gap-0">
                <div className="flex items-center justify-between gap-4">
                  {/* Left Side: Select All */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestionIds.length === paginatedSuggestions.length && paginatedSuggestions.length > 0}
                      onChange={handleSelectAll}
                      disabled={loading}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      Select All
                    </span>
                  </div>

                  {/* Right Side: Search, Filters, Sort, Group, View Toggle */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search suggestions..."
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
                    <Select
                      value={`${sortField}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split('-');
                        setSortField(field as SortField);
                        setSortOrder(order as SortOrder);
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Newest First</SelectItem>
                        <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                        <SelectItem value="upvotes-desc">Most Upvoted</SelectItem>
                        <SelectItem value="upvotes-asc">Least Upvoted</SelectItem>
                        <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                        <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Group By Dropdown */}
                    <Select
                      value={groupBy}
                      onValueChange={(value) => setGroupBy(value as GroupBy)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Group by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Grouping</SelectItem>
                        <SelectItem value="status">Group by Status</SelectItem>
                        <SelectItem value="priority">Group by Priority</SelectItem>
                        <SelectItem value="category">Group by Category</SelectItem>
                        <SelectItem value="sprint">Group by Sprint</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* View Toggle */}
                    <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                      <button
                        onClick={() => setViewMode('grid')}
                        disabled={loading}
                        className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
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
                        className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
                          ? 'bg-primary text-primary-foreground shadow-theme-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        title="Table View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'under_review', 'accepted', 'rejected', 'implemented'] as SuggestionStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => toggleStatusFilter(status)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterStatus.includes(status)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                            }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Priority
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['low', 'medium', 'high', 'critical'] as SuggestionPriority[]).map(priority => (
                        <button
                          key={priority}
                          onClick={() => togglePriorityFilter(priority)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterPriority.includes(priority)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                            }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['feature', 'improvement', 'performance', 'ui_ux', 'testing', 'documentation', 'other'] as SuggestionCategory[]).map(category => (
                        <button
                          key={category}
                          onClick={() => toggleCategoryFilter(category)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterCategory.includes(category)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                            }`}
                        >
                          {category.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="pt-6">
            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-destructive">Error: {error}</p>
              </div>
            )}

            {/* Suggestions List */}
            {loading ? (
              // Skeleton loader
              <div className="space-y-4">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3 animate-pulse">
                        <div className="flex items-start justify-between">
                          <div className="w-4 h-4 bg-muted rounded"></div>
                          <div className="w-20 h-6 bg-muted rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-5 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-5/6"></div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="w-24 h-6 bg-muted rounded-full"></div>
                          <div className="w-20 h-6 bg-muted rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 border-b border-border">
                      <div className="flex items-center gap-4 p-4">
                        <div className="w-4 h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-4 bg-muted rounded w-1/6"></div>
                        <div className="h-4 bg-muted rounded w-1/6"></div>
                      </div>
                    </div>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 animate-pulse">
                        <div className="w-4 h-4 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="w-20 h-6 bg-muted rounded-full"></div>
                        <div className="w-20 h-6 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : filteredSuggestions.length === 0 ? (
              // Filtered Empty State
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Filter className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No suggestions found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  groupBy === 'none' ? (
                    <SuggestionGrid
                      suggestions={paginatedSuggestions}
                      onSelect={(suggestion: SetStateAction<SuggestionWithCreator | null>) => setSelectedSuggestion(suggestion)}
                      selectedSuggestions={selectedSuggestionIds}
                      onSelectionChange={setSelectedSuggestionIds}
                      onVote={handleVote}
                      currentUserId={currentUser?.id}
                    />
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedSuggestions).map(([groupName, groupSuggestions]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-semibold text-foreground uppercase">
                              {groupName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              ({groupSuggestions.length})
                            </span>
                          </div>
                          <SuggestionGrid
                            suggestions={groupSuggestions}
                            onSelect={(suggestion: SetStateAction<SuggestionWithCreator | null>) => setSelectedSuggestion(suggestion)}
                            selectedSuggestions={selectedSuggestionIds}
                            onSelectionChange={setSelectedSuggestionIds}
                            onVote={handleVote}
                            currentUserId={currentUser?.id}
                          />
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  groupBy === 'none' ? (
                    <SuggestionTable
                      suggestions={paginatedSuggestions}
                      onSelect={(suggestion: SetStateAction<SuggestionWithCreator | null>) => setSelectedSuggestion(suggestion)}
                      selectedSuggestions={selectedSuggestionIds}
                      onSelectionChange={setSelectedSuggestionIds}
                      onVote={handleVote}
                      currentUserId={currentUser?.id}
                      onUpdate={fetchSuggestions}
                    />
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedSuggestions).map(([groupName, groupSuggestions]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-semibold text-foreground uppercase">
                              {groupName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              ({groupSuggestions.length})
                            </span>
                          </div>
                          <SuggestionTable
                            suggestions={groupSuggestions}
                            onSelect={(suggestion: SetStateAction<SuggestionWithCreator | null>) => setSelectedSuggestion(suggestion)}
                            selectedSuggestions={selectedSuggestionIds}
                            onSelectionChange={setSelectedSuggestionIds}
                            onVote={handleVote}
                            currentUserId={currentUser?.id}
                            onUpdate={fetchSuggestions}
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Pagination - Only show when not grouped */}
                {groupBy === 'none' && (
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredSuggestions.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(items: SetStateAction<number>) => {
                      setItemsPerPage(items);
                      setCurrentPage(1);
                    }}
                  />
                )}
              </>
            )}

            <SuggestionDetailsDrawer
              isOpen={selectedSuggestion !== null}
              suggestion={selectedSuggestion as any}
              onClose={() => setSelectedSuggestion(null)}
              onEdit={(suggestionId: string) => {
                const suggestion = suggestions.find(s => s.id === suggestionId);
                if (suggestion) {
                  setEditingSuggestion(suggestion);
                  setShowForm(true);
                }
              }}
              onVote={handleVote}
              currentUserId={currentUser?.id}
              onUpdate={fetchSuggestions}
            />
          </div>

          <BulkActionsBar
            selectedItems={selectedSuggestionIds}
            onClearSelection={() => setSelectedSuggestionIds([])}
            assetType="recommendations"
            onAction={handleBulkAction}
          />
        </div>
      </div>
    </>
  );
}