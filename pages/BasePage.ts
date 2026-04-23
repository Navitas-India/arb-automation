import { Page, expect } from '@playwright/test';

/**
 * BasePage — shared helpers for all page objects.
 * Page objects are optional when using Passmark runSteps(),
 * but useful for pure Playwright API tests and shared utilities.
 */
export class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string): Promise<void> {
    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    await this.page.goto(`${base}${path}`);
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }
}
