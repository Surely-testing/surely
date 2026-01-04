// ============================================
// app/api/ai/column-mapping-testcases/route.ts
// Smart rule-based mapping for test cases
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

// Smart column mapping rules for test cases
const FIELD_PATTERNS = {
  title: [
    'title', 'name', 'test case', 'testcase', 'test', 'scenario',
    'case', 'test name', 'case name'
  ],
  description: [
    'description', 'details', 'desc', 'objective', 'purpose',
    'summary', 'notes', 'comments', 'what'
  ],
  priority: [
    'priority', 'importance', 'urgency', 'level'
  ],
  steps: [
    'steps', 'test steps', 'procedure', 'actions', 'how to test',
    'execution steps', 'test procedure'
  ],
  expected_result: [
    'expected result', 'expected', 'expected outcome', 'result',
    'expected behavior', 'should', 'expected output'
  ],
  preconditions: [
    'preconditions', 'prerequisites', 'setup', 'pre-requisites',
    'requirements', 'conditions', 'before'
  ],
  tags: [
    'tags', 'labels', 'categories', 'category', 'type'
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
    
    // Contains match
    if (normalized.includes(normalizedPattern) || normalizedPattern.includes(normalized)) {
      return true;
    }
  }
  
  return false;
}

function mapColumns(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  console.log('\n🔍 Mapping test case columns:');
  
  for (const column of columns) {
    console.log(`  Checking: "${column}"`);
    
    // Try to match against each field
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      if (matchColumn(column, patterns)) {
        mapping[field] = column;
        console.log(`    ✅ Mapped to: ${field}`);
        break;
      }
    }
  }
  
  console.log('\n📋 Final mapping:', mapping);
  return mapping;
}

export async function POST(request: NextRequest) {
  console.log('\n========================================');
  console.log('🚀 TEST CASES COLUMN MAPPING');
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

    console.log('📊 Input columns:', columns);
    console.log('📝 Sample row keys:', Object.keys(sampleRow));

    // Perform smart mapping
    const mapping = mapColumns(columns);

    // Ensure we have at least a title
    if (!mapping.title) {
      // Use first column as title if no match found
      mapping.title = columns[0];
      console.log(`⚠️  No title match found, using first column: ${columns[0]}`);
    }

    console.log('\n✅ Mapping complete');
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      data: {
        mapping,
        inferenceRules: {
          priority: "Will be inferred from test case description and title using keywords"
        },
        tokensUsed: 0,
        cost: 0,
        method: 'rule-based'
      }
    });

  } catch (error: any) {
    logger.log('❌ Mapping error:', error);
    console.log('❌ Error:', error.message);
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}