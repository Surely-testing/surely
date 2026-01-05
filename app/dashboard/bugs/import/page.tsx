// ============================================
// FILE: app/dashboard/bugs/import/page.tsx
// Simplified single-mode import with smart inference
// ============================================
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload,
    CheckCircle,
    X,
    Loader2,
    FileText,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ParsedBug {
    title: string;
    description?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
    steps_to_reproduce?: string[];
    expected_behavior?: string;
    actual_behavior?: string;
    environment?: string;
    browser?: string;
    os?: string;
    version?: string;
    module?: string;
    component?: string;
    tags?: string[];
    row?: number;
}

interface ImportResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
}

export default function BugsImportPage() {
    const router = useRouter();
    const { user } = useSupabase();
    const { suite } = useSuiteContext();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [previewData, setPreviewData] = useState<ParsedBug[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
            toast.error('Invalid file type. Please upload CSV or Excel file.');
            return;
        }

        setSelectedFile(file);
        setImportResult(null);
    };

    const parseData = async (data: any[]): Promise<ParsedBug[]> => {
        const sampleRow = data[0];
        const columns = Object.keys(sampleRow);

        logger.log('📊 Columns found:', columns);
        logger.log('📝 Sample row:', sampleRow);

        // Call smart mapping API
        try {
            const response = await fetch('/api/ai/column-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columns, sampleRow })
            });

            if (!response.ok) {
                throw new Error('Mapping failed');
            }

            const result = await response.json();

            if (!result.success || !result.data?.mapping) {
                throw new Error('No mapping returned');
            }

            const mapping = result.data.mapping;
            logger.log('🗺️ Column mapping:', mapping);

            // Helper functions for inference
            const inferSeverity = (text: string): 'low' | 'medium' | 'high' | 'critical' => {
                const lower = text.toLowerCase();
                if (lower.match(/\b(crash|broken|blocking|critical|server error|cannot|down|failure)\b/)) {
                    return 'critical';
                }
                if (lower.match(/\b(error|fail|incorrect|unresponsive|issue|problem|not working)\b/)) {
                    return 'high';
                }
                if (lower.match(/\b(slow|typo|cosmetic|minor|improvement)\b/)) {
                    return 'low';
                }
                return 'medium';
            };

            const inferStatus = (text: string): 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened' => {
                const lower = text.toLowerCase();
                if (lower.match(/\b(fixed|resolved|done|completed)\b/)) return 'resolved';
                if (lower.match(/\b(closed)\b/)) return 'closed';
                if (lower.match(/\b(working|in progress|wip)\b/)) return 'in_progress';
                if (lower.match(/\b(reopen)\b/)) return 'reopened';
                return 'open';
            };

            const inferPriority = (severity: string, text: string): 'low' | 'medium' | 'high' | 'critical' => {
                const lower = text.toLowerCase();
                // Always match severity to priority if no explicit priority indicators
                if (lower.match(/\b(urgent|asap|blocker|immediately)\b/)) return 'critical';
                if (lower.match(/\b(important|soon)\b/)) return 'high';
                if (lower.match(/\b(nice to have|low priority|when possible)\b/)) return 'low';
                
                // Default: match priority to severity
                if (severity === 'critical') return 'critical';
                if (severity === 'high') return 'high';
                if (severity === 'low') return 'low';
                return 'medium';
            };

            // Parse all rows
            const parsed: ParsedBug[] = data.map((row, index) => {
                const title = mapping.title ? String(row[mapping.title] || '').trim() : '';
                const description = mapping.description ? String(row[mapping.description] || '').trim() : '';
                const fullText = `${title} ${description}`;

                // Get or infer severity
                let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
                if (mapping.severity && row[mapping.severity]) {
                    const val = String(row[mapping.severity]).toLowerCase().trim();
                    if (['low', 'medium', 'high', 'critical'].includes(val)) {
                        severity = val as any;
                    } else {
                        severity = inferSeverity(fullText);
                    }
                } else {
                    severity = inferSeverity(fullText);
                }

                // Get or infer status
                let status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened' = 'open';
                if (mapping.status && row[mapping.status]) {
                    const val = String(row[mapping.status]).toLowerCase().trim().replace(/\s+/g, '_');
                    if (['open', 'in_progress', 'resolved', 'closed', 'reopened'].includes(val)) {
                        status = val as any;
                    } else {
                        status = inferStatus(fullText);
                    }
                } else {
                    status = inferStatus(fullText);
                }

                // Get or infer priority (prioritize user's data, then infer)
                let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
                if (mapping.priority && row[mapping.priority]) {
                    const val = String(row[mapping.priority]).toLowerCase().trim();
                    if (['low', 'medium', 'high', 'critical'].includes(val)) {
                        priority = val as any;
                    } else {
                        priority = inferPriority(severity, fullText);
                    }
                } else {
                    // Auto-infer priority from severity and content
                    priority = inferPriority(severity, fullText);
                }

                const bug: ParsedBug = {
                    title: title || 'Untitled Bug',
                    severity,
                    priority,
                    status,
                    row: index + 2
                };

                // Add optional fields (always use user's data if available)
                if (description) bug.description = description;
                
                if (mapping.module && row[mapping.module]) {
                    bug.module = String(row[mapping.module]).trim();
                }
                if (mapping.component && row[mapping.component]) {
                    bug.component = String(row[mapping.component]).trim();
                }
                if (mapping.expected_behavior && row[mapping.expected_behavior]) {
                    bug.expected_behavior = String(row[mapping.expected_behavior]).trim();
                }
                if (mapping.actual_behavior && row[mapping.actual_behavior]) {
                    bug.actual_behavior = String(row[mapping.actual_behavior]).trim();
                }
                if (mapping.environment && row[mapping.environment]) {
                    bug.environment = String(row[mapping.environment]).trim();
                }
                if (mapping.browser && row[mapping.browser]) {
                    bug.browser = String(row[mapping.browser]).trim();
                }
                if (mapping.os && row[mapping.os]) {
                    bug.os = String(row[mapping.os]).trim();
                }
                if (mapping.version && row[mapping.version]) {
                    bug.version = String(row[mapping.version]).trim();
                }

                // Steps: Always use user's data if available
                if (mapping.steps_to_reproduce && row[mapping.steps_to_reproduce]) {
                    const stepsValue = String(row[mapping.steps_to_reproduce]).trim();
                    if (stepsValue) {
                        bug.steps_to_reproduce = stepsValue
                            .split(/\n|;|\|/)
                            .map((s: string) => s.trim())
                            .filter((s: string) => s.length > 0);
                    }
                }

                // Tags: Always use user's data if available
                if (mapping.tags && row[mapping.tags]) {
                    const tagsValue = String(row[mapping.tags]).trim();
                    if (tagsValue) {
                        bug.tags = tagsValue
                            .split(',')
                            .map((t: string) => t.trim())
                            .filter((t: string) => t.length > 0);
                    }
                }

                return bug;
            }).filter(bug => bug.title && bug.title !== 'Untitled Bug');

            return parsed;

        } catch (error: any) {
            logger.log('Mapping failed, using basic parsing:', error);
            toast.info('Using basic column detection');

            // Fallback: simple heuristic matching
            return data.map((row, index) => {
                const keys = Object.keys(row);
                const title = String(row[keys[0]] || '').trim();
                const description = String(row[keys[1]] || '').trim();

                return {
                    title: title || 'Untitled Bug',
                    description: description || undefined,
                    severity: 'medium' as const,
                    priority: 'medium' as const,
                    status: 'open' as const,
                    row: index + 2
                };
            }).filter(bug => bug.title && bug.title !== 'Untitled Bug');
        }
    };

    const processFile = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);

        try {
            const fileContent = await selectedFile.arrayBuffer();
            let data: any[] = [];

            if (selectedFile.name.endsWith('.csv')) {
                const text = new TextDecoder().decode(fileContent);
                const parsed = Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: false
                });
                data = parsed.data;
            } else {
                const workbook = XLSX.read(fileContent);
                const sheetName = workbook.SheetNames[0];
                data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            }

            if (data.length === 0) {
                toast.error('No data found in file');
                setIsProcessing(false);
                return;
            }

            const parsedBugs = await parseData(data);

            if (parsedBugs.length === 0) {
                toast.error('No valid bugs found in file');
                setIsProcessing(false);
                return;
            }

            setPreviewData(parsedBugs);
            setShowPreview(true);
            toast.success(`Found ${parsedBugs.length} bug${parsedBugs.length === 1 ? '' : 's'} ready to import`);

        } catch (error: any) {
            logger.log('Error processing file:', error);
            toast.error('Failed to process file', { description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const importBugs = async () => {
        if (!user || previewData.length === 0) return;

        setIsProcessing(true);

        const result: ImportResult = {
            success: 0,
            failed: 0,
            errors: []
        };

        try {
            for (const bug of previewData) {
                try {
                    const bugData = {
                        suite_id: suite.id,
                        title: bug.title,
                        description: bug.description || null,
                        severity: bug.severity,
                        priority: bug.priority,
                        status: bug.status,
                        steps_to_reproduce: bug.steps_to_reproduce || [],
                        expected_behavior: bug.expected_behavior || null,
                        actual_behavior: bug.actual_behavior || null,
                        environment: bug.environment || null,
                        browser: bug.browser || null,
                        os: bug.os || null,
                        version: bug.version || null,
                        module: bug.module || null,
                        component: bug.component || null,
                        tags: bug.tags || [],
                        created_by: user.id
                    };

                    const { error } = await supabase
                        .from('bugs')
                        .insert([bugData]);

                    if (error) throw error;
                    result.success++;

                } catch (error: any) {
                    result.failed++;
                    result.errors.push({
                        row: bug.row || 0,
                        error: error.message
                    });
                    logger.log(`Failed to import bug from row ${bug.row}:`, error);
                }
            }

            setImportResult(result);

            if (result.success > 0) {
                toast.success(`Successfully imported ${result.success} bug(s)`);
                if (result.failed > 0) {
                    toast.warning(`${result.failed} bug(s) failed to import`);
                }
            } else {
                toast.error('Failed to import bugs');
            }

        } catch (error: any) {
            logger.log('Import error:', error);
            toast.error('Import failed', { description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/bugs"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Bugs
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Import Bugs</h1>
                        <p className="text-muted-foreground mt-1">
                            Upload any CSV or Excel file. Columns will be intelligently mapped to bug fields.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-card border border-border rounded-xl p-8 space-y-6">
                {!showPreview && !importResult && (
                    <>
                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Upload File
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {!selectedFile ? (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-muted/50 transition-colors"
                                >
                                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <div className="text-base font-medium text-foreground">Click to upload file</div>
                                    <div className="text-sm text-muted-foreground mt-2">
                                        CSV or Excel files • Any column format accepted
                                    </div>
                                </button>
                            ) : (
                                <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-primary" />
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{selectedFile.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFile(null)}
                                        className="p-2 hover:bg-muted rounded transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="bg-muted/30 border border-border rounded-lg p-4">
                            <div className="text-xs font-semibold text-foreground mb-2">
                                Smart Column Detection & Auto-Inference
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Columns are auto-mapped. Missing priority/severity will be inferred from content. Your steps and data are always preserved.
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard/bugs')}
                                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={processFile}
                                disabled={!selectedFile || isProcessing}
                                className="btn-primary px-6 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    'Process File'
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Preview */}
                {showPreview && !importResult && (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-foreground">
                                Preview {previewData.length} bugs
                            </div>
                        </div>
                        <div className="border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted border-b border-border sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-foreground">Title</th>
                                        <th className="px-4 py-3 text-left font-medium text-foreground">Severity</th>
                                        <th className="px-4 py-3 text-left font-medium text-foreground">Priority</th>
                                        <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((bug, i) => (
                                        <tr key={i} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3 text-foreground">{bug.title}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    bug.severity === 'critical' ? 'bg-error/20 text-error' :
                                                    bug.severity === 'high' ? 'bg-warning/20 text-warning' :
                                                    bug.severity === 'medium' ? 'bg-primary/20 text-primary' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                    {bug.severity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    bug.priority === 'critical' ? 'bg-error/20 text-error' :
                                                    bug.priority === 'high' ? 'bg-warning/20 text-warning' :
                                                    bug.priority === 'medium' ? 'bg-primary/20 text-primary' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                    {bug.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-foreground">
                                                    {bug.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPreview(false);
                                    setPreviewData([]);
                                }}
                                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={importBugs}
                                disabled={isProcessing}
                                className="btn-primary px-6 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    `Import ${previewData.length} Bugs`
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Import Result */}
                {importResult && (
                    <>
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                            <div className="text-xl font-semibold text-foreground mb-2">Import Complete</div>
                            <div className="text-sm">
                                <span className="text-success font-medium">{importResult.success} imported</span>
                                {importResult.failed > 0 && (
                                    <span className="text-error ml-3 font-medium">{importResult.failed} failed</span>
                                )}
                            </div>
                            {importResult.errors.length > 0 && (
                                <div className="mt-4 border border-error/30 rounded-lg p-4 bg-error/5 max-h-40 overflow-y-auto text-left">
                                    <div className="text-xs font-semibold text-error mb-2">Errors:</div>
                                    <ul className="text-xs text-error/80 space-y-1">
                                        {importResult.errors.slice(0, 5).map((err, i) => (
                                            <li key={i}>Row {err.row}: {err.error}</li>
                                        ))}
                                        {importResult.errors.length > 5 && (
                                            <li>...and {importResult.errors.length - 5} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard/bugs')}
                                className="flex-1 btn-primary px-4 py-2 text-sm font-semibold"
                            >
                                Done
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}