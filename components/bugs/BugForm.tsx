// ============================================
// components/bugs/BugForm.tsx
// Enhanced Bug Form with attachments and recording links
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Plus, Trash, Upload, X, File, Video, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BugWithCreator } from '@/types/bug.types';

interface BugFormProps {
  suiteId: string;
  onSuccess: () => void;
  onCancel: () => void;
  bug?: BugWithCreator | null;
}

interface ReproductionStep {
  id: string;
  order: number;
  description: string;
}

interface AttachmentFile {
  file: File;
  preview?: string;
}

export function BugForm({
  suiteId,
  onSuccess,
  onCancel,
  bug,
}: BugFormProps) {
  const { user } = useSupabase();
  const supabase = createClient();
  
  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('open');
  const [sprintId, setSprintId] = useState('');
  
  // Reproduction details
  const [steps, setSteps] = useState<ReproductionStep[]>([
    { id: '1', order: 1, description: '' },
  ]);
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  
  // Environment details
  const [environment, setEnvironment] = useState('');
  const [browser, setBrowser] = useState('');
  const [os, setOs] = useState('');
  const [version, setVersion] = useState('');
  
  // Organization
  const [assignedTo, setAssignedTo] = useState('');
  const [module, setModule] = useState('');
  const [component, setComponent] = useState('');
  const [tags, setTags] = useState('');
  
  // Linked assets
  const [linkedRecordingId, setLinkedRecordingId] = useState('');
  const [linkedTestCaseId, setLinkedTestCaseId] = useState('');
  
  // Attachments
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  
  // Reference data
  const [sprints, setSprints] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data if editing
  useEffect(() => {
    if (bug) {
      setTitle(bug.title || '');
      setDescription(bug.description || '');
      setSeverity(bug.severity || 'medium');
      setPriority(bug.priority || 'medium');
      setStatus(bug.status || 'open');
      setSprintId(bug.sprint_id || '');
      setExpectedBehavior(bug.expected_behavior || '');
      setActualBehavior(bug.actual_behavior || '');
      setEnvironment(bug.environment || '');
      setBrowser(bug.browser || '');
      setOs(bug.os || '');
      setVersion(bug.version || '');
      setAssignedTo(bug.assigned_to || '');
      setModule(bug.module || '');
      setComponent(bug.component || '');
      setLinkedRecordingId(bug.linked_recording_id || '');
      setLinkedTestCaseId(bug.linked_test_case_id || '');
      
      // Handle tags
      if (bug.tags && Array.isArray(bug.tags)) {
        setTags(bug.tags.join(', '));
      }
      
      // Handle steps
      if (bug.steps_to_reproduce) {
        if (Array.isArray(bug.steps_to_reproduce)) {
          const loadedSteps = bug.steps_to_reproduce.map((step: any, idx: number) => ({
            id: idx.toString(),
            order: idx + 1,
            description: typeof step === 'string' ? step : step.description || step.step || ''
          }));
          setSteps(loadedSteps.length > 0 ? loadedSteps : [{ id: '1', order: 1, description: '' }]);
        } else if (typeof bug.steps_to_reproduce === 'string') {
          setSteps([{ id: '1', order: 1, description: bug.steps_to_reproduce }]);
        }
      }
      
      // Load existing attachments
      fetchExistingAttachments(bug.id);
    }
  }, [bug]);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch sprints
        const { data: sprintsData } = await supabase
          .from('sprints')
          .select('*')
          .eq('suite_id', suiteId)
          .order('created_at', { ascending: false });
        setSprints(sprintsData || []);

        // Fetch recordings
        const { data: recordingsData } = await supabase
          .from('recordings')
          .select('id, title, created_at')
          .eq('suite_id', suiteId)
          .order('created_at', { ascending: false })
          .limit(50);
        setRecordings(recordingsData || []);

        // Fetch test cases
        const { data: testCasesData } = await supabase
          .from('test_cases')
          .select('id, title')
          .eq('suite_id', suiteId)
          .order('created_at', { ascending: false })
          .limit(100);
        setTestCases(testCasesData || []);

        // Fetch team members
        const { data: membersData } = await supabase
          .from('suite_members')
          .select('user_id, profiles(id, name, email)')
          .eq('suite_id', suiteId);
        
        const members = membersData?.map(m => ({
          id: m.user_id,
          name: (m.profiles as any)?.name || (m.profiles as any)?.email || 'Unknown',
          email: (m.profiles as any)?.email
        })) || [];
        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    fetchReferenceData();
  }, [suiteId, supabase]);

  const fetchExistingAttachments = async (bugId: string) => {
    try {
      const { data } = await supabase
        .from('bug_attachments')
        .select('*')
        .eq('bug_id', bugId);
      
      setExistingAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    if (newAttachments[index].preview) {
      URL.revokeObjectURL(newAttachments[index].preview!);
    }
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const removeExistingAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const { error } = await supabase
        .from('bug_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      
      setExistingAttachments(existingAttachments.filter(a => a.id !== attachmentId));
      toast.success('Attachment deleted');
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const addStep = () => {
    const newStep: ReproductionStep = {
      id: Date.now().toString(),
      order: steps.length + 1,
      description: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    if (steps.length === 1) {
      toast.error('At least one step is required');
      return;
    }
    setSteps(steps.filter(step => step.id !== id));
  };

  const updateStep = (id: string, value: string) => {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, description: value } : step
    ));
  };

  const uploadAttachments = async (bugId: string) => {
    const uploadPromises = attachments.map(async ({ file }) => {
      try {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${bugId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('bug-attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('bug-attachments')
          .getPublicUrl(fileName);

        // Save metadata
        const { error: dbError } = await supabase
          .from('bug_attachments')
          .insert({
            bug_id: bugId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: publicUrl,
            uploaded_by: user!.id
          });

        if (dbError) throw dbError;

        return { success: true };
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        return { success: false, fileName: file.name };
      }
    });

    const results = await Promise.all(uploadPromises);
    const failed = results.filter(r => !r.success);

    if (failed.length > 0) {
      toast.warning(`${failed.length} file(s) failed to upload`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare bug data
      const bugData = {
        suite_id: suiteId,
        title: title.trim(),
        description: description.trim() || null,
        severity,
        priority,
        status,
        steps_to_reproduce: steps.filter(s => s.description.trim()).map(s => s.description.trim()),
        expected_behavior: expectedBehavior.trim() || null,
        actual_behavior: actualBehavior.trim() || null,
        environment: environment.trim() || null,
        browser: browser.trim() || null,
        os: os.trim() || null,
        version: version.trim() || null,
        assigned_to: assignedTo || null,
        sprint_id: sprintId || null,
        module: module.trim() || null,
        component: component.trim() || null,
        linked_recording_id: linkedRecordingId || null,
        linked_test_case_id: linkedTestCaseId || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        created_by: user.id,
      };

      let bugId: string;

      if (bug) {
        // Update existing bug
        const { error: updateError } = await supabase
          .from('bugs')
          .update(bugData)
          .eq('id', bug.id);

        if (updateError) throw updateError;
        bugId = bug.id;
        toast.success('Bug updated successfully');
      } else {
        // Create new bug
        const { data: newBug, error: createError } = await supabase
          .from('bugs')
          .insert([bugData])
          .select()
          .single();

        if (createError) throw createError;
        bugId = newBug.id;
        toast.success('Bug created successfully');
      }

      // Upload attachments
      if (attachments.length > 0) {
        await uploadAttachments(bugId);
      }

      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: bug ? 'Updated bug' : 'Created bug',
            resource_type: 'bug',
            resource_id: bugId,
            metadata: { title }
          });
      } catch (activityError) {
        console.log('Activity logging not available');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving bug:', error);
      toast.error('Failed to save bug', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {bug ? 'Edit Bug' : 'Report New Bug'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {bug ? 'Update the bug details below' : 'Fill in the details to report a new bug'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the bug"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the bug and its impact"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Severity *
                </label>
                <Select value={severity} onChange={(e) => setSeverity(e.target.value)} options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priority
                </label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)} options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status *
                </label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                  { value: 'reopened', label: 'Reopened' },
                ]} />
              </div>
            </div>
          </div>
        </section>

        {/* Reproduction Details */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Reproduction Details</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Steps to Reproduce *
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-error/20 text-error flex items-center justify-center text-xs font-medium mt-2">
                      {index + 1}
                    </span>
                    <Input
                      value={step.description}
                      onChange={(e) => updateStep(step.id, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1"
                    />
                    {steps.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="mt-2"
                      >
                        <Trash className="w-4 h-4 text-error" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Expected Behavior
                </label>
                <Textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What should happen?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Actual Behavior
                </label>
                <Textarea
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually happens?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Environment Details */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Environment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Environment
              </label>
              <Input
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="Production, Staging..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Browser
              </label>
              <Input
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                placeholder="Chrome, Firefox..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                OS
              </label>
              <Input
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Windows, macOS..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Version
              </label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="App version"
              />
            </div>
          </div>
        </section>

        {/* Organization */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Assigned To
              </label>
              <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} options={[
                { value: '', label: 'Unassigned' },
                ...teamMembers.map(m => ({ value: m.id, label: m.name }))
              ]} />
            </div>

            {sprints.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sprint
                </label>
                <Select value={sprintId} onChange={(e) => setSprintId(e.target.value)} options={[
                  { value: '', label: 'No Sprint' },
                  ...sprints.map(s => ({ value: s.id, label: `${s.name} ${s.status ? `(${s.status})` : ''}` }))
                ]} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Module
              </label>
              <Input
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g., Authentication, Dashboard"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Component
              </label>
              <Input
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                placeholder="e.g., Login Form, Navigation"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Tags
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ui, critical, regression (comma-separated)"
              />
            </div>
          </div>
        </section>

        {/* Linked Assets */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Linked Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recordings.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Link to Recording
                </label>
                <Select 
                  value={linkedRecordingId} 
                  onChange={(e) => setLinkedRecordingId(e.target.value)}
                  options={[
                    { value: '', label: 'No Recording' },
                    ...recordings.map(r => ({ 
                      value: r.id, 
                      label: `${r.title} - ${new Date(r.created_at).toLocaleDateString()}` 
                    }))
                  ]} 
                />
              </div>
            )}

            {testCases.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Link to Test Case
                </label>
                <Select 
                  value={linkedTestCaseId} 
                  onChange={(e) => setLinkedTestCaseId(e.target.value)}
                  options={[
                    { value: '', label: 'No Test Case' },
                    ...testCases.map(tc => ({ value: tc.id, label: tc.title }))
                  ]} 
                />
              </div>
            )}
          </div>
        </section>

        {/* Attachments */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Attachments
          </h3>
          
          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Current Attachments:</p>
              <div className="space-y-2">
                {existingAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.file_size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(attachment.id)}
                      className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Attachments */}
          <div>
            <label className="block w-full">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt,.log"
                className="hidden"
              />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Screenshots, logs, or documents (Max 10MB each)
                </p>
              </div>
            </label>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {attachment.preview ? (
                        <img 
                          src={attachment.preview} 
                          alt={attachment.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <File className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{attachment.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : bug ? 'Update Bug' : 'Report Bug'}
          </Button>
        </div>
      </form>
    </div>
  );
}