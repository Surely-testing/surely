'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SuggestionWithCreator, SuggestionCategory, SuggestionPriority, SuggestionImpact } from '@/types/suggestion.types';
import { X, Tag, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

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
        toast.success('Suggestion updated successfully');
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
        toast.success('Suggestion created successfully');
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={onCancel} className="mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {suggestion ? 'Edit Suggestion' : 'New Suggestion'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {suggestion ? 'Update the suggestion details below' : 'Share your ideas to improve this test suite'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief title for your suggestion"
                maxLength={200}
              />
              <p className="mt-1 text-xs text-muted-foreground">{formData.title.length}/200 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-error">*</span>
              </label>
              <Textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of your suggestion..."
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-muted-foreground">{formData.description.length}/1000 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rationale
              </label>
              <Textarea
                rows={3}
                value={formData.rationale}
                onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                placeholder="Why is this suggestion important? What problem does it solve?"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-muted-foreground">{formData.rationale.length}/500 characters</p>
            </div>
          </div>
        </section>

        {/* Classification */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as SuggestionCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="ui_ux">UI/UX</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as SuggestionPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Expected Impact
              </label>
              <Select
                value={formData.impact}
                onValueChange={(value) => setFormData(prev => ({ ...prev, impact: value as SuggestionImpact }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Impact</SelectItem>
                  <SelectItem value="medium">Medium Impact</SelectItem>
                  <SelectItem value="high">High Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Effort Estimate
              </label>
              <Input
                type="text"
                value={formData.effort_estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, effort_estimate: e.target.value }))}
                placeholder="e.g., 2-3 days, 1 week"
                maxLength={50}
              />
            </div>
          </div>
        </section>

        {/* Tags */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </h3>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags (max 10)
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    handleAddTag(); 
                  } 
                }}
                placeholder="Add a tag..."
                maxLength={20}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleAddTag} 
                variant="outline" 
                disabled={!tagInput.trim() || formData.tags.length >= 10}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20 gap-2"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)} 
                      className="text-primary hover:text-primary/80 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {formData.tags.length}/10 tags
            </p>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>{suggestion ? 'Update Suggestion' : 'Create Suggestion'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}