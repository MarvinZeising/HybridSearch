import { test, expect } from '@playwright/test';

test.describe('Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages');
    await expect(page.locator('h2')).toContainText('Pages');
  });

  test('should display pages list on page load', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'Pages' })).toBeVisible();
    await expect(page.locator('input[placeholder="Search..."]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Page' })).toBeVisible();
  });

  test('should perform search and display results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');

    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/.*\/pages\?q=test.*/);
    await page.waitForLoadState('networkidle');

    const hasResults = await page.locator('article').count() > 0;
    const hasNoResultsMessage = await page.locator('text=No pages found.').isVisible();

    expect(hasResults || hasNoResultsMessage).toBeTruthy();
  });

  test('should clear search when input is emptied', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');

    await searchInput.fill('test');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*\/pages\?q=test.*/);

    await searchInput.clear();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL('/pages');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to page detail when clicking View Page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const pageCount = await page.locator('article').count();

    if (pageCount > 0) {
      const firstViewButton = page.getByRole('link', { name: 'View Page' }).first();
      await expect(firstViewButton).toBeVisible();
      await firstViewButton.click();
      await expect(page).toHaveURL(/.*\/pages\/.*/);
    }
  });

  test('should navigate to edit page when clicking Edit', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const pageCount = await page.locator('article').count();

    if (pageCount > 0) {
      const firstEditButton = page.getByRole('link', { name: 'Edit' }).first();
      await expect(firstEditButton).toBeVisible();
      await firstEditButton.click();
      await expect(page).toHaveURL(/.*\/pages\/edit\/.*/);
    }
  });

  test('should navigate to create page', async ({ page }) => {
    await page.getByRole('link', { name: 'Create Page' }).click();
    await expect(page).toHaveURL('/pages/create');
  });

  test('should display page status badges', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const pageCount = await page.locator('article').count();

    if (pageCount > 0) {
      const statusBadges = page.locator('.rounded-full');
      const badgeCount = await statusBadges.count();

      if (badgeCount > 0) {
        const firstBadge = statusBadges.first();
        await expect(firstBadge).toBeVisible();
        const badgeText = await firstBadge.textContent();
        expect(['Published', 'Draft']).toContain(badgeText);
      }
    }
  });

  test('should display page categories and tags', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const pageCount = await page.locator('article').count();

    if (pageCount > 0) {
      const categoryTags = page.locator('.bg-blue-100').first();
      if (await categoryTags.isVisible()) {
        await expect(categoryTags).toBeVisible();
      }

      const tags = page.locator('.bg-gray-100');
      const tagCount = await tags.count();
      if (tagCount > 0) {
        await expect(tags.first()).toBeVisible();
      }
    }
  });

  test('should display error message when search fails', async ({ page }) => {
    await page.route('**/api/pages/search', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    const searchInput = page.locator('input[placeholder="Search..."]');
    await searchInput.fill('error');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Failed to search pages')).toBeVisible();
  });

  test('should maintain search state when navigating back', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');

    await searchInput.fill('documentation');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*\/pages\?q=documentation.*/);

    await page.getByRole('link', { name: 'Create Page' }).click();
    await expect(page).toHaveURL('/pages/create');

    await page.goBack();
    await expect(page).toHaveURL(/.*\/pages\?q=documentation.*/);
    await expect(searchInput).toHaveValue('documentation');
  });
});
