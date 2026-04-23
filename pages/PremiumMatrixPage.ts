import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PremiumMatrixPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/premium-matrix');
  }

  async uploadFile(filePath: string): Promise<void> {
    await this.page.setInputFiles('input[type="file"]', filePath);
  }

  async selectYear(year: number): Promise<void> {
    await this.page.selectOption('select[name="year"], #year', String(year));
  }

  async clickUpload(): Promise<void> {
    await this.page.click('button:has-text("Upload")');
  }

  async expectSuccess(): Promise<void> {
    await expect(
      this.page.locator('[class*="success"], [class*="toast"], text=success').first()
    ).toBeVisible({ timeout: 10_000 });
  }

  async expectError(message?: string): Promise<void> {
    const locator = this.page.locator('[class*="error"], [role="alert"]').first();
    await expect(locator).toBeVisible();
    if (message) await expect(locator).toContainText(message);
  }
}
