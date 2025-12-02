'use client';

import { useState, useEffect, SetStateAction } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SuggestionWithCreator, SuggestionStatus, SuggestionPriority, SuggestionCategory } from '@/types/suggestion.types';
import { Plus, Grid, List, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SuggestionGrid } from '../suggestions/SuggestionGrid';
import { SuggestionTable } from '../suggestions/SuggestionTable';
import { SuggestionForm } from '../suggestions/SuggestionForm';
import { SuggestionDetailsDrawer } from '../suggestions/SuggestionDetailsDrawer';
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar';
import { Pagination } from '@/components/shared/Pagination';

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
      console.error('Error fetching user:', error);
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
        console.error('Error fetching suggestions:', suggestionsError);
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
      console.error('Error in fetchSuggestions:', error);
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
      console.error('Error voting:', error);
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
      console.error('Bulk action error:', error);
      toast.error('Bulk action failed', {
        description: error?.message
      });
    }
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

  return (
    <>
      <div className="space-y-6 pb-24">
        {/* Main Content Card */}
        <div className="shadow-theme-md rounded-lg overflow-hidden border border-border">
          {/* Unified Controls Bar */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Side: Select All only */}
              <div className="flex items-center gap-3 order-2 lg:order-1">
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
              <div className="flex items-center gap-3 flex-1 justify-end order-1 lg:order-2 flex-wrap">
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
                  <option value="upvotes-desc">Most Upvoted</option>
                  <option value="upvotes-asc">Least Upvoted</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
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
                  <option value="priority">Group by Priority</option>
                  <option value="category">Group by Category</option>
                  <option value="sprint">Group by Sprint</option>
                </select>

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
          <div className="p-6">
            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-destructive">Error: {error}</p>
              </div>
            )}

            {/* Suggestions List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading suggestions...</p>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-4">
                  {suggestions.length === 0
                    ? searchQuery
                      ? 'No suggestions match your search'
                      : 'No suggestions found for this suite'
                    : 'No suggestions match the selected filters'}
                </p>
                {suggestions.length === 0 ? (
                  <Button variant="outline" onClick={() => setShowForm(true)}>
                    Create your first suggestion
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
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
