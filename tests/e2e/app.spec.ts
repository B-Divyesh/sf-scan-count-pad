import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('completes a count from import through reconciliation and export', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Count the shelf');
  await page.locator('#csv-file').setInputFiles('tests/fixtures/catalog.csv');
  await page.getByRole('button', { name: 'Import and review' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('3 items ready');

  await page.locator('#session-name').fill('Friday bay A');
  await page.getByRole('button', { name: 'Start counting' }).click();
  const activeA11y = await new AxeBuilder({ page }).analyze();
  expect(activeA11y.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.locator('#scan-input').fill('8901001');
  await page.locator('#scan-input').press('Enter');
  await expect(page.getByText(/Brass bolts · \+1 · now 1/)).toBeVisible();

  await page.locator('#scan-input').fill('NEW-999');
  await page.locator('#scan-input').press('Enter');
  await expect(page.getByText('NEW-999', { exact: true })).toBeVisible();
  await page.locator('.resolve-form select').selectOption({ label: 'Paper tape · TAPE-02' });
  await page.getByRole('button', { name: 'Apply 1' }).click();
  await expect(page.getByText('Nothing waiting')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Finish count' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Friday bay A');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export adjustments CSV' }).click();
  expect((await download).suggestedFilename()).toContain('adjustments.csv');
});

test('has no serious accessibility violations on onboarding and legal pages', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.goto('/privacy');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.goto('/terms');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('reloads the app shell offline after installation', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const cachedAssets = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find((name) => name.startsWith('scan-count-pad-'))!);
    const keys = await cache.keys();
    return Promise.all(keys.filter((request) => request.url.includes('/assets/')).map(async (request) => ({ url: request.url, bytes: (await (await cache.match(request))!.arrayBuffer()).byteLength })));
  });
  expect(cachedAssets.some((asset) => asset.url.endsWith('.js') && asset.bytes > 1000)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Count the shelf');
});
