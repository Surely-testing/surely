// ============================================
// app/api/ai/column-mapping/route.ts
// Smart rule-based mapping (COMPLETE field coverage)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

// COMPLETE field patterns for bug tracking
const FIELD_PATTERNS = {
  title: [
    'title', 'name', 'summary', 'issue', 'bug', 'subject', 
    'heading', 'bug name', 'issue name'
  ],
  description: [
    'description', 'details', 'desc', 'console message', 'consolemessage',
    'message', 'notes', 'comments', 'body', 'content', 'detail'
  ],
  severity: [
    'severity', 'level', 'criticality', 'impact', 'severity level'
  ],
  priority: [
    'priority', 'importance', 'urgency', 'prio'
  ],
  status: [
    'status', 'state', 'condition'
  ],
  steps_to_reproduce: [
    'steps', 'steps to reproduce', 'reproduction steps', 'repro',
    'how to reproduce', 'reproduction', 'reproduce', 'stepstoreproduce',
    'steps_to_reproduce', 'test steps'
  ],
  expected_behavior: [
    'expected', 'expected behavior', 'expected result', 
    'expected outcome', 'should be', 'expectedbehavior',
    'expected_behavior'
  ],
  actual_behavior: [
    'actual', 'actual behavior', 'actual result', 
    'actual outcome', 'what happened', 'actual results',
    'actualbehavior', 'actual_behavior'
  ],
  environment: [
    'environment', 'env', 'test environment', 'testing environment'
  ],
  browser: [
    'browser', 'web browser', 'browser version'
  ],
  os: [
    'os', 'operating system', 'platform', 'operatingsystem'
  ],
  version: [
    'version', 'ver', 'app version', 'build', 'release'
  ],
  module: [
    'module', 'area', 'section', 'feature', 'component area',
    'application area'
  ],
  component: [
    'component', 'comp', 'part', 'sub module', 'submodule'
  ],
  tags: [
    'tags', 'labels', 'categories', 'category', 'keywords'
  ]
};

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[*_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchColumn(columnName: string, patterns: string[]): boolean {
  const normalized = normalizeColumnName(columnName);
  
  for (const pattern of patterns) {
    const normalizedPattern = normalizeColumnName(pattern);
    
    // Exact match
    if (normalized === normalizedPattern) {
      return true;
    }
    
    // Contains match (more flexible)
    if (normalized.includes(normalizedPattern) || normalizedPattern.includes(normalized)) {
      return true;
    }
  }
  
  return false;
}

function mapColumns(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedColumns = new Set<string>();
  
  console.log('\ Mapping bug columns:');
  
  // First pass: exact and strong matches
  for (const column of columns) {
    if (usedColumns.has(column)) continue;
    
    console.log(`  Checking: "${column}"`);
    
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      if (mapping[field]) continue; // Field already mapped
      
      if (matchColumn(column, patterns)) {
        mapping[field] = column;
        usedColumns.add(column);
        console.log(`    ✅ Mapped to: ${field}`);
        break;
      }
    }
  }
  
  console.log('\n Final mapping:', mapping);
  console.log('Mapped', Object.keys(mapping).length, 'of', columns.length, 'columns');
  return mapping;
}

export async function POST(request: NextRequest) {
  console.log('\n========================================');
  console.log('SMART BUG COLUMN MAPPING');
  console.log('========================================\n');

  try {
    const body = await request.json();
    const { columns, sampleRow } = body;

    if (!columns || !Array.isArray(columns)) {
      return NextResponse.json(
        { success: false, error: 'Columns array required' },
        { status: 400 }
      );
    }

    if (!sampleRow || typeof sampleRow !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Sample row required' },
        { status: 400 }
      );
    }

    console.log('Input columns:', columns);
    console.log('Sample row keys:', Object.keys(sampleRow));

    // Perform smart mapping
    const mapping = mapColumns(columns);

    // Ensure we have at least a title
    if (!mapping.title) {
      // Use first non-empty column as title
      const firstColumn = columns[0];
      mapping.title = firstColumn;
      console.log(`⚠️  No title match found, using first column: ${firstColumn}`);
    }

    // Log what wasn't mapped
    const unmappedColumns = columns.filter(col => !Object.values(mapping).includes(col));
    if (unmappedColumns.length > 0) {
      console.log('ℹ️  Unmapped columns:', unmappedColumns);
    }

    console.log('\n✅ Mapping complete');
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      data: {
        mapping,
        inferenceRules: {
          severity: "Inferred from bug description using keywords (crash, error, etc.)",
          status: "Defaults to 'open' for new bugs unless specified",
          priority: "Auto-matched to severity or inferred from content"
        },
        tokensUsed: 0,
        cost: 0,
        method: 'rule-based',
        coverage: {
          mapped: Object.keys(mapping).length,
          total: columns.length,
          unmapped: unmappedColumns
        }
      }
    });

  } catch (error: any) {
    logger.log('Mapping error:', error);
    console.log('Error:', error.message);
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}