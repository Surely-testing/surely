// ============================================
// 3. lib/test-executor/executor.ts
// ============================================
import { chromium, Browser, Page } from 'playwright';
import type { TestCase, TestExecutionResult, StepResult, Environment } from './types';

export class TestExecutor {
  private browser: Browser | null = null;

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async executeTestCases(
    testCases: TestCase[],
    environment: Environment,
    onProgress?: (current: number, total: number, result: TestExecutionResult) => Promise<void>
  ): Promise<TestExecutionResult[]> {
    await this.initialize();
    const results: TestExecutionResult[] = [];

    try {
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const result = await this.executeTestCase(testCase, environment);
        results.push(result);

        if (onProgress) {
          await onProgress(i + 1, testCases.length, result);
        }
      }
    } finally {
      await this.cleanup();
    }

    return results;
  }

  async executeTestCase(
    testCase: TestCase,
    environment: Environment
  ): Promise<TestExecutionResult> {
    const startTime = new Date().toISOString();
    const startMs = Date.now();
    const logs: string[] = [];
    const screenshots: string[] = [];
    const stepResults: StepResult[] = [];

    logs.push(`Starting test: ${testCase.title}`);
    logs.push(`Environment: ${environment.name} (${environment.base_url})`);

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport: environment.viewport || { width: 1920, height: 1080 },
      extraHTTPHeaders: environment.headers || {},
    });

    const page = await context.newPage();

    try {
      for (const step of testCase.steps) {
        const stepStart = Date.now();
        logs.push(`Step ${step.order}: ${step.description || step.action}`);

        try {
          await this.executeStep(page, step, environment, logs, screenshots);
          
          stepResults.push({
            stepId: step.id,
            status: 'passed',
            duration: Date.now() - stepStart,
          });

          logs.push(`✓ Step ${step.order} passed`);
        } catch (error: any) {
          logs.push(`✗ Step ${step.order} failed: ${error.message}`);
          
          const failureScreenshotBuffer = await page.screenshot({ 
            fullPage: true 
          });
          const failureScreenshot = failureScreenshotBuffer.toString('base64');
          screenshots.push(failureScreenshot);

          stepResults.push({
            stepId: step.id,
            status: 'failed',
            duration: Date.now() - stepStart,
            error: error.message,
            screenshot: failureScreenshot,
          });

          throw error;
        }
      }

      const endTime = new Date().toISOString();
      const duration = Date.now() - startMs;

      return {
        testCaseId: testCase.id,
        status: 'passed',
        duration,
        startTime,
        endTime,
        steps: stepResults,
        screenshots,
        logs,
      };
    } catch (error: any) {
      const endTime = new Date().toISOString();
      const duration = Date.now() - startMs;

      return {
        testCaseId: testCase.id,
        status: 'failed',
        duration,
        startTime,
        endTime,
        steps: stepResults,
        screenshots,
        logs,
        error: error.message,
      };
    } finally {
      await context.close();
    }
  }

  private async executeStep(
    page: Page,
    step: any,
    environment: Environment,
    logs: string[],
    screenshots: string[]
  ): Promise<void> {
    const timeout = step.timeout || 30000;

    switch (step.action) {
      case 'navigate':
        let url: string;
        
        if (!step.url) {
          throw new Error('Navigate action requires a URL');
        }
        
        // If URL starts with http:// or https://, use it as absolute
        if (step.url.startsWith('http://') || step.url.startsWith('https://')) {
          url = step.url;
        } 
        // If URL starts with /, combine with base URL
        else if (step.url.startsWith('/')) {
          url = `${environment.base_url}${step.url}`;
        }
        // Otherwise, use as-is (might be relative or full URL)
        else {
          url = step.url;
        }
        
        logs.push(`  Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout });
        break;

      case 'click':
        logs.push(`  Clicking: ${step.selector}`);
        await page.click(step.selector, { timeout });
        break;

      case 'fill':
        logs.push(`  Filling ${step.selector} with: ${step.value}`);
        await page.fill(step.selector, step.value, { timeout });
        break;

      case 'select':
        logs.push(`  Selecting ${step.value} in: ${step.selector}`);
        await page.selectOption(step.selector, step.value, { timeout });
        break;

      case 'hover':
        logs.push(`  Hovering: ${step.selector}`);
        await page.hover(step.selector, { timeout });
        break;

      case 'scroll':
        logs.push(`  Scrolling to: ${step.selector}`);
        await page.locator(step.selector).scrollIntoViewIfNeeded({ timeout });
        break;

      case 'wait':
        if (step.selector) {
          logs.push(`  Waiting for: ${step.selector}`);
          await page.waitForSelector(step.selector, { timeout });
        } else {
          logs.push(`  Waiting: ${timeout}ms`);
          await page.waitForTimeout(timeout);
        }
        break;

      case 'assert':
        await this.performAssertion(page, step, logs, timeout);
        break;

      case 'screenshot':
        logs.push(`  Taking screenshot`);
        const screenshotBuffer = await page.screenshot({ 
          fullPage: true 
        });
        const screenshotData = screenshotBuffer.toString('base64');
        screenshots.push(screenshotData);
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  private async performAssertion(
    page: Page,
    step: any,
    logs: string[],
    timeout: number
  ): Promise<void> {
    const assertionType = step.assertionType || 'exists';
    logs.push(`  Asserting ${assertionType}: ${step.selector}`);

    const element = page.locator(step.selector);

    switch (assertionType) {
      case 'exists':
        await element.waitFor({ state: 'attached', timeout });
        break;

      case 'visible':
        await element.waitFor({ state: 'visible', timeout });
        break;

      case 'enabled':
        await element.waitFor({ state: 'visible', timeout });
        const isEnabled = await element.isEnabled();
        if (!isEnabled) {
          throw new Error(`Element ${step.selector} is not enabled`);
        }
        break;

      case 'equals':
        const text = await element.textContent({ timeout });
        if (text !== step.expectedValue) {
          throw new Error(
            `Expected "${step.expectedValue}" but got "${text}"`
          );
        }
        break;

      case 'contains':
        const content = await element.textContent({ timeout });
        if (!content?.includes(step.expectedValue || '')) {
          throw new Error(
            `Expected text to contain "${step.expectedValue}" but got "${content}"`
          );
        }
        break;

      default:
        throw new Error(`Unknown assertion type: ${assertionType}`);
    }
  }
}
