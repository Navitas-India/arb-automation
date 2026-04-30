import { Page, expect } from '@playwright/test';

/**
 * BasePage — shared helpers for all page objects.
 * Useful for pure Playwright UI tests and shared utilities.
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
