// ============================================
// 2. lib/test-executor/adapter.ts
// ============================================
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { TestCase, TestStep, TestStepAction } from './types';

export interface DatabaseTestCase {
  id: string;
  title: string;
  description: string | null;
  steps: any;
  expected_result: string | null;
  priority?: string | null;
  status?: string | null;
}

export class TestCaseAdapter {
  /**
   * Resolve test data references to actual values
   */
  static async resolveTestData(
    step: any,
    supabase: SupabaseClient<Database>
  ): Promise<{ value?: string; url?: string }> {
    if (!step.useTestData || !step.testDataRef) {
      return {
        value: step.value,
        url: step.url,
      };
    }

    try {
      const { data: testDataItem, error } = await supabase
        .from('test_data_items')
        .select('value')
        .eq('id', step.testDataRef.itemId)
        .single();

      if (error) {
        console.error('Failed to resolve test data:', error);
        return {
          value: step.value,
          url: step.url,
        };
      }

      if (step.action === 'navigate') {
        return {
          url: testDataItem.value,
          value: step.value,
        };
      } else if (step.action === 'fill') {
        return {
          value: testDataItem.value,
          url: step.url,
        };
      }

      return {
        value: testDataItem.value,
        url: step.url,
      };
    } catch (error) {
      console.error('Error resolving test data:', error);
      return {
        value: step.value,
        url: step.url,
      };
    }
  }

  /**
   * Convert database test case to executor format
   */
  static async toExecutorFormat(
    dbTestCase: DatabaseTestCase,
    supabase: SupabaseClient<Database>
  ): Promise<TestCase> {
    let steps: any[] = [];
    
    if (typeof dbTestCase.steps === 'string') {
      try {
        steps = JSON.parse(dbTestCase.steps);
      } catch (error) {
        console.error('Failed to parse test steps:', error);
        steps = [];
      }
    } else if (Array.isArray(dbTestCase.steps)) {
      steps = dbTestCase.steps;
    } else if (dbTestCase.steps && typeof dbTestCase.steps === 'object') {
      steps = (dbTestCase.steps as any).steps || [];
    }

    steps.sort((a, b) => (a.order || 0) - (b.order || 0));

    const resolvedSteps: TestStep[] = [];
    
    for (const step of steps) {
      const validated = this.validateStep(step);
      if (!validated) continue;

      const resolved = await this.resolveTestData(step, supabase);
      
      resolvedSteps.push({
        ...validated,
        value: resolved.value || validated.value,
        url: resolved.url || validated.url,
      });
    }

    return {
      id: dbTestCase.id,
      title: dbTestCase.title,
      description: dbTestCase.description || '',
      steps: resolvedSteps,
      expectedResult: dbTestCase.expected_result || '',
      priority: dbTestCase.priority,
      status: dbTestCase.status,
    };
  }

  private static validateStep(step: any): TestStep | null {
    if (!step.action) {
      console.warn('Step missing action:', step);
      return null;
    }

    const validActions: TestStepAction[] = [
      'navigate', 'click', 'fill', 'select', 'wait', 
      'assert', 'screenshot', 'scroll', 'hover'
    ];

    if (!validActions.includes(step.action)) {
      console.warn('Invalid action:', step.action);
      return null;
    }

    return {
      id: step.id || `step-${Date.now()}-${Math.random()}`,
      order: step.order,
      action: step.action,
      selector: step.selector,
      value: step.value,
      url: step.url,
      timeout: step.timeout || 30000,
      expectedValue: step.expectedValue,
      assertionType: step.assertionType || 'exists',
      description: step.description,
      screenshot: step.screenshot,
      useTestData: step.useTestData,
      testDataRef: step.testDataRef,
    };
  }

  static async toExecutorFormatBatch(
    dbTestCases: DatabaseTestCase[],
    supabase: SupabaseClient<Database>
  ): Promise<TestCase[]> {
    const converted = await Promise.all(
      dbTestCases.map(tc => this.toExecutorFormat(tc, supabase))
    );
    
    return converted.filter(tc => tc.steps.length > 0);
  }
}