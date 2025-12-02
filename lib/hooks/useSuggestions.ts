import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SuggestionWithCreator, Suggestion } from '@/types/suggestion.types';
import { toast } from 'sonner';

interface UseSuggestionsOptions {
  status?: string;
  category?: string;
  priority?: string;
  sortBy?: 'created_at' | 'upvotes' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export function useSuggestions(suiteId: string, options: UseSuggestionsOptions = {}) {
  const [suggestions, setSuggestions] = useState<SuggestionWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Build query
      let query = supabase
        .from('suggestions')
        .select(`
          *,
          creator:created_by(id, name, avatar_url),
          assignee:assigned_to(id, name, avatar_url)
        `)
        .eq('suite_id', suiteId);

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.category) {
        query = query.eq('category', options.category);
      }
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      
      if (sortBy === 'upvotes') {
        query = query.order('upvotes', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'priority') {
        // Custom priority sorting: critical > high > medium > low
        query = query.order('priority', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform the data to match SuggestionWithCreator type
      const transformedData: SuggestionWithCreator[] = (data || []).map((item: any) => ({
        ...item,
        creator: item.creator ? {
          id: item.creator.id,
          name: item.creator.name,
          avatar_url: item.creator.avatar_url,
        } : undefined,
        assignee: item.assignee ? {
          id: item.assignee.id,
          name: item.assignee.name,
          avatar_url: item.assignee.avatar_url,
        } : undefined,
      }));

      setSuggestions(transformedData);
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'Failed to fetch suggestions');
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [suiteId, options.status, options.category, options.priority, options.sortBy, options.sortOrder]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Set up realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`suggestions:${suiteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suggestions',
          filter: `suite_id=eq.${suiteId}`,
        },
        () => {
          // Refetch when changes occur
          fetchSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [suiteId, fetchSuggestions]);

  const voteSuggestion = useCallback(async (suggestionId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to vote');
        return false;
      }

      // Get current suggestion
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return false;

      const currentVotes = suggestion.votes || {};
      const previousVote = currentVotes[user.id];

      let newUpvotes = suggestion.upvotes;
      let newDownvotes = suggestion.downvotes;
      const newVotes = { ...currentVotes };

      // Handle vote logic
      if (previousVote === voteType) {
        // Remove vote
        delete newVotes[user.id];
        if (voteType === 'upvote') {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }
      } else {
        // Change or add vote
        if (previousVote) {
          // User is changing their vote
          if (previousVote === 'upvote') {
            newUpvotes = Math.max(0, newUpvotes - 1);
            newDownvotes += 1;
          } else {
            newDownvotes = Math.max(0, newDownvotes - 1);
            newUpvotes += 1;
          }
        } else {
          // New vote
          if (voteType === 'upvote') {
            newUpvotes += 1;
          } else {
            newDownvotes += 1;
          }
        }
        newVotes[user.id] = voteType;
      }

      // Update in database
      const { error } = await supabase
        .from('suggestions')
        .update({
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          votes: newVotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;

      // Update local state
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestionId
            ? { ...s, upvotes: newUpvotes, downvotes: newDownvotes, votes: newVotes }
            : s
        )
      );

      return true;
    } catch (err: any) {
      console.error('Error voting on suggestion:', err);
      toast.error('Failed to record vote');
      return false;
    }
  }, [suggestions]);

  const updateSuggestionStatus = useCallback(async (
    suggestionId: string,
    status: Suggestion['status'],
    notes?: string
  ) => {
    try {
      const supabase = createClient();

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.discussion_notes = notes;
      }

      if (status === 'implemented') {
        updateData.implemented_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('suggestions')
        .update(updateData)
        .eq('id', suggestionId);

      if (error) throw error;

      toast.success(`Suggestion marked as ${status}`);
      fetchSuggestions();
      return true;
    } catch (err: any) {
      console.error('Error updating suggestion status:', err);
      toast.error('Failed to update suggestion status');
      return false;
    }
  }, [fetchSuggestions]);

  const assignSuggestion = useCallback(async (suggestionId: string, userId: string | null) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('suggestions')
        .update({
          assigned_to: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;

      toast.success(userId ? 'Suggestion assigned' : 'Suggestion unassigned');
      fetchSuggestions();
      return true;
    } catch (err: any) {
      console.error('Error assigning suggestion:', err);
      toast.error('Failed to assign suggestion');
      return false;
    }
  }, [fetchSuggestions]);

  const deleteSuggestion = useCallback(async (suggestionId: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in');
        return false;
      }

      // Get the suggestion to check ownership
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) {
        toast.error('Suggestion not found');
        return false;
      }

      // Only allow creator or admin to delete
      // Note: You may want to add additional permission checks here
      if (suggestion.created_by !== user.id) {
        toast.error('You can only delete your own suggestions');
        return false;
      }

      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) throw error;

      toast.success('Suggestion deleted');
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      return true;
    } catch (err: any) {
      console.error('Error deleting suggestion:', err);
      toast.error('Failed to delete suggestion');
      return false;
    }
  }, [suggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refetch: fetchSuggestions,
    voteSuggestion,
    updateSuggestionStatus,
    assignSuggestion,
    deleteSuggestion,
  };
}