'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SuggestionWithCreator, SuggestionCategory, SuggestionPriority, SuggestionImpact } from '@/types/suggestion.types';
import { X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

interface SuggestionFormProps {
  suiteId: string;
  suggestion?: SuggestionWithCreator | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SuggestionForm({ suiteId, suggestion, onSuccess, onCancel }: SuggestionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rationale: '',
    category: 'improvement' as SuggestionCategory,
    priority: 'medium' as SuggestionPriority,
    impact: 'medium' as SuggestionImpact,
    effort_estimate: '',
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (suggestion) {
      setFormData({
        title: suggestion.title || '',
        description: suggestion.description || '',
        rationale: suggestion.rationale || '',
        category: suggestion.category || 'improvement',
        priority: suggestion.priority || 'medium',
        impact: suggestion.impact || 'medium',
        effort_estimate: suggestion.effort_estimate || '',
        tags: suggestion.tags || [],
      });
    }
  }, [suggestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      if (suggestion) {
        // Update existing suggestion
        const { error } = await supabase
          .from('suggestions')
          .update({
            title: formData.title,
            description: formData.description,
            rationale: formData.rationale,
            category: formData.category,
            priority: formData.priority,
            impact: formData.impact,
            effort_estimate: formData.effort_estimate,
            tags: formData.tags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', suggestion.id);
        
        if (error) throw error;
      } else {
        // Create new suggestion
        const { error } = await supabase
          .from('suggestions')
          .insert({
            suite_id: suiteId,
            title: formData.title,
            description: formData.description,
            rationale: formData.rationale,
            category: formData.category,
            priority: formData.priority,
            impact: formData.impact,
            effort_estimate: formData.effort_estimate,
            tags: formData.tags,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'pending' as const,
            upvotes: 0,
            downvotes: 0,
            votes: {},
          });
        
        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving suggestion:', error);
      toast.error('Failed to save suggestion', { description: error?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  return (
    <div className="bg-card max-w-4xl rounded-lg border border-border p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {suggestion ? 'Edit Suggestion' : 'New Suggestion'}
        </h2>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Brief title for your suggestion"
            maxLength={200}
          />
          <p className="mt-1 text-xs text-muted-foreground">{formData.title.length}/200 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description <span className="text-error">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Detailed description of your suggestion..."
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-muted-foreground">{formData.description.length}/1000 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Rationale</label>
          <textarea
            rows={3}
            value={formData.rationale}
            onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
            className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Why is this suggestion important?"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-muted-foreground">{formData.rationale.length}/500 characters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as SuggestionCategory }))}
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
              <option value="performance">Performance</option>
              <option value="ui_ux">UI/UX</option>
              <option value="testing">Testing</option>
              <option value="documentation">Documentation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as SuggestionPriority }))}
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Expected Impact</label>
            <select
              value={formData.impact}
              onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value as SuggestionImpact }))}
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="low">Low Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="high">High Impact</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Effort Estimate</label>
            <input
              type="text"
              value={formData.effort_estimate}
              onChange={(e) => setFormData(prev => ({ ...prev, effort_estimate: e.target.value }))}
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., 2-3 days, 1 week"
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tags (max 10)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
              className="flex-1 px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add a tag..."
              maxLength={20}
            />
            <Button type="button" onClick={handleAddTag} variant="outline" disabled={!tagInput.trim() || formData.tags.length >= 10}>
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary/10 text-primary gap-1">
                  <Tag className="w-3 h-3" />{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="text-primary hover:text-primary/80">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}>
            {isSubmitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>
            ) : (
              <>{suggestion ? 'Update' : 'Create'} Suggestion</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}