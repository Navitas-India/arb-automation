import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/login');
  }

  async loginAs(email: string, password: string): Promise<void> {
    await this.page.fill('input[type="email"], input[name="email"], #email', email);
    await this.page.fill('input[type="password"], input[name="password"], #password', password);
    await this.page.click('button[type="submit"]');
  }

  async expectLoginError(): Promise<void> {
    await expect(
      this.page.locator('[class*="error"], [class*="alert"], [role="alert"]').first()
    ).toBeVisible();
  }
}
