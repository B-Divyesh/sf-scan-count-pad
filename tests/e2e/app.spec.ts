import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:csv-export @claim:scanner-input @claim:unknown-reconcile completes a count and exports its reviewed rows', async ({ page }) => {
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
  const exported = await download;
  expect(exported.suggestedFilename()).toContain('adjustments.csv');
  const stream = await exported.createReadStream();
  let csv = '';
  for await (const chunk of stream) csv += chunk.toString();
  expect(csv).toContain('BOLT-01,8901001,Brass bolts,10,1,-9');
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

test('@claim:offline-reload reloads the app shell after the first visit', async ({ page, context }) => {
  await page.goto('/demo');
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Friday bay A sample');
  await expect(page.getByLabel('Demo mode')).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Count the shelf');
});

test('@claim:validated-quantity shows duplicate SKU recovery and rejects invalid scanner quantities', async ({ page }) => {
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles('tests/fixtures/catalog.csv');
  await page.getByRole('button', { name: 'Import and review' }).click();
  await page.getByRole('button', { name: 'Start counting' }).click();

  await page.locator('#scan-input').fill('NEW-999');
  await page.locator('#scan-input').press('Enter');
  await page.getByRole('button', { name: 'Add as new item' }).click();
  await page.locator('#new-name').fill('New shelf item');
  await page.locator('#new-sku').fill('BOLT-01');
  await page.getByRole('button', { name: 'Add and apply count' }).click();
  await expect(page.locator('#new-item-error')).toContainText('already in the catalog');
  await expect(page.locator('#new-sku')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#new-sku')).toBeFocused();
  await page.keyboard.press('Escape');

  for (const invalid of ['10000', '1.5']) {
    await page.locator('#scan-quantity').fill(invalid);
    await page.getByRole('heading', { level: 1 }).click();
    await page.keyboard.type('8901001');
    await page.keyboard.press('Enter');
    await expect(page.locator('#scan-quantity-error')).toContainText('whole quantity from 1 to 9999');
    await expect(page.locator('[data-product-row]').filter({ hasText: 'Brass bolts' }).locator('input[name=count]')).toHaveValue('');
  }

  await page.locator('#scan-quantity').fill('2');
  await page.getByRole('heading', { level: 1 }).click();
  await page.keyboard.type('8901001');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-product-row]').filter({ hasText: 'Brass bolts' }).locator('input[name=count]')).toHaveValue('2');
});

test('@claim:demo-isolation opens seeded sample data in a separate database', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByLabel('Demo mode')).toContainText('nothing is saved to your real counts');
  await expect(page.getByRole('heading', { name: 'Friday bay A sample' })).toBeVisible();
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((item) => item.name));
  expect(databases).toContain('demo:scan-count-pad');
  expect(databases).not.toContain('scan-count-pad');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Scanned × 2')).toBeVisible();
});

test('@claim:local-data keeps the demo flow on the product origin', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await page.locator('#scan-input').fill('8901001');
  await page.locator('#scan-input').press('Enter');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:camera-local requests the camera only on demand and stops its track', async ({ page, context }) => {
  await context.grantPermissions(['camera'], { origin: 'http://127.0.0.1:4173' });
  await page.addInitScript(() => {
    const state = window as unknown as { __cameraCalls: number; __cameraTrack?: MediaStreamTrack; BarcodeDetector?: unknown };
    state.__cameraCalls = 0;
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      state.__cameraCalls += 1;
      const stream = await original({ video: true });
      state.__cameraTrack = stream.getVideoTracks()[0];
      return stream;
    } });
    class Detector { async detect() { return [{ rawValue: '8901001' }]; } }
    Object.defineProperty(window, 'BarcodeDetector', { configurable: true, value: Detector });
  });
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles('tests/fixtures/catalog.csv');
  await page.getByRole('button', { name: 'Import and review' }).click();
  await page.getByRole('button', { name: 'Start counting' }).click();
  expect(await page.evaluate(() => (window as unknown as { __cameraCalls: number }).__cameraCalls)).toBe(0);
  await page.getByRole('button', { name: 'Use camera' }).click();
  await expect(page.getByText(/Brass bolts · \+1 · now 1/)).toBeVisible();
  expect(await page.evaluate(() => ({ calls: (window as unknown as { __cameraCalls: number }).__cameraCalls, state: (window as unknown as { __cameraTrack: MediaStreamTrack }).__cameraTrack.readyState }))).toEqual({ calls: 1, state: 'ended' });
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:license-unlock caches a valid license and honors Retry-After', async ({ page }) => {
  let response: 'valid' | 'limited' = 'valid';
  let requests = 0;
  await page.route('https://api.sociobot.in/**', async (route) => {
    requests += 1;
    if (response === 'limited') await route.fulfill({ status: 429, headers: { 'Retry-After': '60' }, body: 'Too many requests' });
    else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await page.goto('/?license=sample-valid-license');
  await expect(page.getByRole('button', { name: 'Bench unlocked' })).toBeVisible();
  expect(page.url()).not.toContain('license=');
  await page.reload();
  expect(requests).toBe(1);

  await page.waitForTimeout(1100);
  response = 'limited';
  await page.goto('/?license=sample-rate-limited-license');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('Too many license checks. Wait a minute, then try again.')).toBeVisible();
  expect(requests).toBe(2);
});
