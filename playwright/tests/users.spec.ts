import { test, expect } from '@playwright/test';

test.describe('Users (Employees)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
  });

  test('should display users list on page load', async ({ page }) => {
    await expect(page.locator('h1:has-text("Employees")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Employee' })).toBeVisible();
  });

  test('should display users table with headers when users are loaded', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Employee")')).toBeVisible();
    await expect(page.locator('th:has-text("Job Title")')).toBeVisible();
    await expect(page.locator('th:has-text("Department")')).toBeVisible();
    await expect(page.locator('th:has-text("Manager")')).toBeVisible();
    await expect(page.locator('th:has-text("Location")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should navigate to search page when clicking Search button', async ({ page }) => {
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL('/users/search');
  });

  test('should navigate to add employee page when clicking Add Employee button', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Employee' }).click();
    await expect(page).toHaveURL('/users/new');
  });

  test('should display user information in table rows when users exist', async ({ page }) => {
    const userRows = page.locator('tbody tr');
    const userCount = await userRows.count();

    if (userCount > 0) {
      const firstRow = userRows.first();
      await expect(firstRow).toBeVisible();

      const employeeCell = firstRow.locator('td').first();
      await expect(employeeCell).toBeVisible();
    }
  });

  test('should display user status badges when users exist', async ({ page }) => {
    const statusBadges = page.locator('.bg-green-100, .bg-red-100');
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      const firstBadge = statusBadges.first();
      await expect(firstBadge).toBeVisible();
      const badgeText = await firstBadge.textContent();
      expect(['Active', 'Inactive']).toContain(badgeText);
    }
  });

  test('should have edit and delete buttons when users exist', async ({ page }) => {
    const editButtons = page.locator('button:has-text("Edit")');
    const deleteButtons = page.locator('button:has-text("Delete")');

    const editCount = await editButtons.count();
    const deleteCount = await deleteButtons.count();

    if (editCount > 0) {
      await expect(editButtons.first()).toBeVisible();
    }

    if (deleteCount > 0) {
      await expect(deleteButtons.first()).toBeVisible();
    }
  });

  test('should show delete confirmation when clicking Delete button', async ({ page }) => {
    const deleteButtons = page.locator('button:has-text("Delete")');
    const deleteButtonCount = await deleteButtons.count();

    if (deleteButtonCount > 0) {
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Are you sure you want to delete this user?');
        await dialog.dismiss();
      });

      const firstDeleteButton = deleteButtons.first();
      await firstDeleteButton.click();
    }
  });

  test('should display error message when users fail to load', async ({ page }) => {
    await page.route('**/api/users', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/users');
    await expect(page.locator('text=Failed to load users')).toBeVisible({ timeout: 10000 });
  });

  test('should display loading state initially', async ({ page }) => {
    // Set up route interception before navigation
    await page.route('**/api/users', async route => {
      // Add a longer delay to ensure we can catch the loading state
      await page.waitForTimeout(3000);
      route.continue();
    });

    // Navigate to the page
    await page.goto('/users');

    // Check for loading state with a shorter timeout since we know it should appear
    await expect(page.locator('text=Loading users...')).toBeVisible({ timeout: 5000 });

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
  });
});
