import { test, expect } from '@playwright/test';

test('home page loads with SindhLearn branding', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SindhLearn/);
  await expect(page.getByRole('banner').getByText('SindhLearn', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explore Classes' })).toBeVisible();
});

test('desktop navigation opens textbook search and class library', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Search STBB Library' })).toBeVisible();
  await expect(page.getByPlaceholder(/Search by book name/)).toBeVisible();

  await page.getByRole('button', { name: 'Classes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Class Library (Grade 1 to 12)' })).toBeVisible();
});

test('mobile menu opens and navigates to search', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
  await page.getByRole('button', { name: 'Search Textbooks' }).click();
  await expect(page.getByRole('heading', { name: 'Search STBB Library' })).toBeVisible();
});
