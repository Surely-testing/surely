// ============================================
// components/bugs/BugTracking.tsx
// Bug tracking with grid/table/mini view toggle - FIXED
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Plus, Grid, List, Code, Search, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { BugForm } from './BugForm';
import { BugGrid } from './BugGrid';
import { BugTable } from './BugTable';
import { BugDetailsDrawer } from './BugDetailsDrawer';

interface BugTrackingProps {
  suiteId: string;
}

type ViewMode = 'grid' | 'table' | 'mini';

export function BugTracking({ suiteId }: BugTrackingProps) {
  const [bugs, setBugs] = useState<BugWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedBug, setSelectedBug] = useState<BugWithCreator | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBug, setEditingBug] = useState<BugWithCreator | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log('🐛 BugTracking render:', { 
    suiteId, 
    bugs: bugs.length, 
    loading, 
    showForm, 
    selectedBug: !!selectedBug,
    error 
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
      
      console.log('🐛 Fetching bugs for suite:', suiteId);
      
      // First, try a simple query to see if we can get any bugs at all
      let query = supabase
        .from('bugs')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: bugsData, error: bugsError } = await query;
      
      console.log('🐛 Bugs query result:', { 
        data: bugsData, 
        error: bugsError,
        count: bugsData?.length 
      });
      
      if (bugsError) {
        console.error('🐛 Error fetching bugs:', bugsError);
        setError(bugsError.message);
        throw bugsError;
      }

      if (!bugsData || bugsData.length === 0) {
        console.log('🐛 No bugs found for suite:', suiteId);
        setBugs([]);
        setLoading(false);
        return;
      }

      // Now fetch creator profiles separately
      const creatorIds = [...new Set(bugsData.map(bug => bug.created_by).filter(Boolean))];
      console.log('🐛 Fetching profiles for creators:', creatorIds);
      
      let profilesMap = new Map();
      
      if (creatorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', creatorIds);

        console.log('🐛 Profiles query result:', { data: profilesData, error: profilesError });

        if (!profilesError && profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // Transform the data
      const transformedData: BugWithCreator[] = bugsData.map((bug: any) => ({
        ...bug,
        creator: bug.created_by ? profilesMap.get(bug.created_by) : undefined
      }));

      console.log('🐛 Transformed bugs:', transformedData);
      setBugs(transformedData);
    } catch (error: any) {
      console.error('🐛 Error in fetchBugs:', error);
      setError(error?.message || 'Failed to fetch bugs');
    } finally {
      setLoading(false);
    }
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
    if (!confirm('Are you sure you want to delete this bug?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('bugs').delete().eq('id', bugId);
      if (error) throw error;

      setBugs(bugs.filter(b => b.id !== bugId));
      if (selectedBug?.id === bugId) {
        setSelectedBug(null);
      }
    } catch (error) {
      console.error('Error deleting bug:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBug(null);
    fetchBugs();
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
    } catch (error) {
      console.error('Error updating bug:', error);
    }
  };

  const handleSelectBug = (bug: BugWithCreator) => {
    setSelectedBug(bug);
  };

  const getSeverityColor = (severity: BugSeverity | null) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusColor = (status: BugStatus | null) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'resolved': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'closed': return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bugs</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{bugs.length} total bugs</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mini')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'mini'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Developer Mini View"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCreateBug}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Bug
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      )}

      {/* Bugs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bugs...</p>
        </div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'No bugs match your search' : 'No bugs found for this suite'}
          </p>
          <button
            onClick={handleCreateBug}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Create your first bug report
          </button>
        </div>
      ) : viewMode === 'mini' ? (
        <MiniBugView
          bugs={bugs}
          onSelect={handleSelectBug}
          onEdit={handleEditBug}
          onDelete={handleDeleteBug}
          getSeverityColor={getSeverityColor}
          getStatusColor={getStatusColor}
        />
      ) : viewMode === 'table' ? (
        <BugTable
          bugs={bugs as any}
          onSelect={handleSelectBug}
          onEdit={handleEditBug}
          onDelete={handleDeleteBug}
        />
      ) : (
        <BugGrid
          bugs={bugs as any}
          onSelect={handleSelectBug}
        />
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
  );
}

// ============================================
// MiniBugView Component - Developer Focused
// ============================================

interface MiniBugViewProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
  onEdit: (bug: BugWithCreator) => void;
  onDelete: (bugId: string) => void;
  getSeverityColor: (severity: BugSeverity | null) => string;
  getStatusColor: (status: BugStatus | null) => string;
}

function MiniBugView({ bugs, onSelect, onEdit, onDelete, getSeverityColor, getStatusColor }: MiniBugViewProps) {
  return (
    <div className="space-y-3">
      {bugs.map((bug) => (
        <div
          key={bug.id}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          {/* Header Row */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                    {bug.severity || 'N/A'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bug.status)}`}>
                    {bug.status || 'open'}
                  </span>
                  {bug.sprint_id && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      Sprint
                    </span>
                  )}
                </div>
                <h3 
                  onClick={() => onSelect(bug)}
                  className="text-base font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {bug.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(bug)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit bug"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(bug.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete bug"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            {bug.description && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {bug.description}
                </p>
              </div>
            )}

            {/* Steps to Reproduce */}
            {bug.steps_to_reproduce && Array.isArray(bug.steps_to_reproduce) && bug.steps_to_reproduce.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Steps to Reproduce ({bug.steps_to_reproduce.length})
                </h4>
                <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                  {bug.steps_to_reproduce.slice(0, 5).map((step: any, idx: number) => {
                    const stepText = typeof step === 'string' ? step : step.description || step.step || '';
                    return (
                      <li key={idx} className="line-clamp-2">{stepText}</li>
                    );
                  })}
                  {bug.steps_to_reproduce.length > 5 && (
                    <li className="text-blue-600 dark:text-blue-400 text-xs">
                      +{bug.steps_to_reproduce.length - 5} more steps
                    </li>
                  )}
                </ol>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              {bug.creator && (
                <div className="flex items-center gap-2">
                  {bug.creator.avatar_url ? (
                    <img
                      src={bug.creator.avatar_url}
                      alt={bug.creator.name}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {bug.creator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{bug.creator.name}</span>
                </div>
              )}
              {bug.created_at && (
                <span>
                  {format(new Date(bug.created_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            <button
              onClick={() => onSelect(bug)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View Details →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}