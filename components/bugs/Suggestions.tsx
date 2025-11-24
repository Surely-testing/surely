'use client';

import { useState, useEffect, useMemo, SetStateAction } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SuggestionWithCreator, SuggestionStatus, SuggestionPriority, SuggestionCategory } from '@/types/suggestion.types';
import { Plus, Grid, List, Search } from 'lucide-react';
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
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<SuggestionPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SuggestionCategory | 'all'>('all');

  useEffect(() => {
    if (suiteId) {
      fetchCurrentUser();
      fetchSuggestions();
    }
  }, [suiteId, searchQuery, statusFilter, priorityFilter, categoryFilter]);

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

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
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
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast.error('Bulk action failed', {
        description: error?.message
      });
    }
  };

  const filteredSuggestions = useMemo(() => suggestions, [suggestions]);

  const paginatedSuggestions = filteredSuggestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      <div className="space-y-4 md:space-y-6 pb-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Suggestions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {suggestions.length} total suggestions
              {selectedSuggestionIds.length > 0 && ` • ${selectedSuggestionIds.length} selected`}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-theme-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'table'
                    ? 'bg-background text-foreground shadow-theme-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button onClick={() => setShowForm(true)} size="sm" className="btn-primary">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Suggestion</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="implemented">Implemented</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Categories</option>
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
              <option value="performance">Performance</option>
              <option value="ui_ux">UI/UX</option>
              <option value="testing">Testing</option>
              <option value="documentation">Documentation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4">
            <p className="text-sm text-destructive">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'No suggestions match your search' : 'No suggestions yet'}
            </p>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              Create your first suggestion
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <SuggestionGrid
                suggestions={paginatedSuggestions}
                onSelect={(suggestion: SetStateAction<SuggestionWithCreator | null>) => setSelectedSuggestion(suggestion)}
                selectedSuggestions={selectedSuggestionIds}
                onSelectionChange={setSelectedSuggestionIds}
                onVote={handleVote}
                currentUserId={currentUser?.id}
              />
            ) : (
              <SuggestionTable
                suggestions={paginatedSuggestions}
                onSelect={(suggestion: SetStateAction<SuggestionWithCreator | null>) => setSelectedSuggestion(suggestion)}
                selectedSuggestions={selectedSuggestionIds}
                onSelectionChange={setSelectedSuggestionIds}
                onVote={handleVote}
                currentUserId={currentUser?.id}
                onUpdate={fetchSuggestions}
              />
            )}

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
    </>
  );
}