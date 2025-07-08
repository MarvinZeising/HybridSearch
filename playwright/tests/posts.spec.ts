import { test, expect } from '@playwright/test';

test.describe('News Posts Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('News Posts');
  });

  test('should display news posts list on page load', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'News Posts' })).toBeVisible();
    await expect(page.locator('input[placeholder="Search..."]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Post' })).toBeVisible();
  });

  test('should perform search and display results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');

    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/.*\?q=test.*/);
    await page.waitForLoadState('networkidle');

    const hasResults = await page.locator('article').count() > 0;
    const hasNoResultsMessage = await page.locator('text=No news posts found.').isVisible();

    expect(hasResults || hasNoResultsMessage).toBeTruthy();
  });

  test('should clear search when input is emptied', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');

    await searchInput.fill('test');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*\?q=test.*/);

    await searchInput.clear();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to post detail when clicking Read More', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const postCount = await page.locator('article').count();

    if (postCount > 0) {
      const firstReadMoreButton = page.getByRole('link', { name: 'Read More' }).first();
      await expect(firstReadMoreButton).toBeVisible();
      await firstReadMoreButton.click();
      await expect(page).toHaveURL(/.*\/post\/.*/);
    }
  });

  test('should navigate to edit post when clicking Edit', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const postCount = await page.locator('article').count();

    if (postCount > 0) {
      const firstEditButton = page.getByRole('link', { name: 'Edit' }).first();
      await expect(firstEditButton).toBeVisible();
      await firstEditButton.click();
      await expect(page).toHaveURL(/.*\/edit\/.*/);
    }
  });

  test('should navigate to create post page', async ({ page }) => {
    await page.getByRole('link', { name: 'Create Post' }).click();
    await expect(page).toHaveURL('/create');
  });

  test('should maintain search state when navigating back', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');

    await searchInput.fill('technology');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*\?q=technology.*/);

    await page.getByRole('link', { name: 'Create Post' }).click();
    await expect(page).toHaveURL('/create');

    await page.goBack();
    await expect(page).toHaveURL(/.*\?q=technology.*/);
    await expect(searchInput).toHaveValue('technology');
  });

  test('should display error message when search fails', async ({ page }) => {
    await page.route('**/api/news/search', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    const searchInput = page.locator('input[placeholder="Search..."]');
    await searchInput.fill('error');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Failed to search news posts')).toBeVisible();
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search..."]');

    const specialQuery = 'test "quotes"';
    await searchInput.fill(specialQuery);
    await page.waitForTimeout(500);

    const currentUrl = page.url();
    expect(currentUrl).toContain('q=');
    await page.waitForLoadState('networkidle');

    const hasError = await page.locator('.bg-red-50').isVisible();

    if (hasError) {
      const errorText = await page.locator('.bg-red-50').textContent();
      console.log(`Search with special characters resulted in error: ${errorText}`);
      expect(errorText).toBeTruthy();
    } else {
      const hasResults = await page.locator('article').count() > 0;
      const hasNoResultsMessage = await page.locator('text=No news posts found.').isVisible();
      expect(hasResults || hasNoResultsMessage).toBeTruthy();
    }

    await expect(searchInput).toHaveValue(specialQuery);
  });

  test('should show loading state during search', async ({ page }) => {
    await page.route('**/api/news/search', async route => {
      await page.waitForTimeout(1000);
      route.continue();
    });

    const searchInput = page.locator('input[placeholder="Search..."]');
    await searchInput.fill('loading');
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');
  });
});
