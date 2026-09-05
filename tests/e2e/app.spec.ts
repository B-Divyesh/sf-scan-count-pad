import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:csv-export @claim:unknown-reconcile completes a count and exports its reviewed rows', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Count stock at');
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
  await page.goto('/404.html');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('primary navigation gives keyboard access to Demo and Privacy on every page', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) {
    await page.goto(path);
    const navigation = page.getByRole('navigation', { name: 'Primary' });
    await expect(navigation).toBeVisible();
    const demo = navigation.getByRole('link', { name: 'Demo' });
    const privacy = navigation.getByRole('link', { name: 'Privacy' });
    await expect(demo).toBeVisible();
    await expect(privacy).toBeVisible();
    for (const link of [demo, privacy]) {
      const box = await link.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    await demo.focus();
    await expect(demo).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Friday bay A sample' })).toBeVisible();

    await privacy.focus();
    await expect(privacy).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeFocused();
  }
});

test('browser Back and Forward focus and announce the restored route heading', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 400 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Count stock at the shelf/ })).toBeVisible();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.locator('footer').getByRole('link', { name: 'Privacy' }).click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeFocused();
  await expect(page.locator('#announcer')).toHaveText('Privacy — Scan Count Pad');

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { level: 1, name: /Count stock at the shelf/ })).toBeFocused();
  await expect(page.locator('#announcer')).toHaveText('Scan Count Pad — offline shelf counts');

  await page.goForward();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeFocused();
  await expect(page.locator('#announcer')).toHaveText('Privacy — Scan Count Pad');
});

test('@claim:offline-reload @claim:data-persistence reloads saved demo data after the first visit', async ({ page, context }) => {
  await page.goto('/demo');
  await page.locator('#scan-input').fill('8901001');
  await page.locator('#scan-input').press('Enter');
  await expect(page.locator('[data-product-row]').filter({ hasText: 'Brass bolts' }).locator('input[name=count]')).toHaveValue('119');
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
  await expect(page.locator('[data-product-row]').filter({ hasText: 'Brass bolts' }).locator('input[name=count]')).toHaveValue('119');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Count stock at');
});

test('@claim:validated-quantity @claim:scanner-input shows duplicate SKU recovery and rejects invalid scanner quantities', async ({ page }) => {
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

test('@claim:demo-isolation resets sample data without changing a real count', async ({ page }) => {
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles('tests/fixtures/catalog.csv');
  await page.getByRole('button', { name: 'Import and review' }).click();
  await page.locator('#session-name').fill('Real shelf count');
  await page.getByRole('button', { name: 'Start counting' }).click();
  await page.locator('#scan-input').fill('8901001');
  await page.locator('#scan-input').press('Enter');
  const realCount = page.locator('[data-product-row]').filter({ hasText: 'Brass bolts' }).locator('input[name=count]');
  await expect(realCount).toHaveValue('1');

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Demo' }).click();
  await expect(page.getByLabel('Demo mode')).toContainText('nothing is saved to your real counts');
  await expect(page.getByRole('heading', { name: 'Friday bay A sample' })).toBeVisible();
  const sampleCount = page.locator('[data-product-row]').filter({ hasText: 'Brass bolts' }).locator('input[name=count]');
  await expect(sampleCount).toHaveValue('118');
  await page.locator('#scan-input').fill('8901001');
  await page.locator('#scan-input').press('Enter');
  await expect(sampleCount).toHaveValue('119');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(sampleCount).toHaveValue('118');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByRole('heading', { name: 'Real shelf count' })).toBeVisible();
  await expect(realCount).toHaveValue('1');
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

test('@claim:license-unlock @claim:paid-price caches a valid license and honors Retry-After', async ({ page }) => {
  let response: 'valid' | 'limited' = 'valid';
  let requests = 0;
  await page.route('https://api.sociobot.in/**', async (route) => {
    requests += 1;
    if (response === 'limited') await route.fulfill({ status: 429, headers: { 'Retry-After': '60' }, body: 'Too many requests' });
    else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await page.goto('/?license=sample-valid-license');
  await expect(page.getByRole('button', { name: 'License active' })).toBeVisible();
  expect(page.url()).not.toContain('license=');
  await page.locator('#csv-file').setInputFiles('tests/fixtures/catalog.csv');
  await page.getByRole('button', { name: 'Import and review' }).click();
  await page.getByRole('button', { name: 'Start counting' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Finish count' }).click();
  await page.getByRole('button', { name: 'Start another count' }).click();
  await page.locator('#session-name').fill('Second licensed count');
  await page.getByRole('button', { name: 'Start counting' }).click();
  expect(await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('scan-count-pad', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Promise<number>((resolve, reject) => {
      const request = database.transaction('local-data').objectStore('local-data').get('app');
      request.onsuccess = () => resolve(request.result.sessions.length);
      request.onerror = () => reject(request.error);
    });
  })).toBe(2);
  await page.reload();
  expect(requests).toBe(1);

  await page.waitForTimeout(1100);
  response = 'limited';
  await page.goto('/?license=sample-rate-limited-license');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('Too many license checks. Wait a minute, then try again.')).toBeVisible();
  await expect(page.getByText('$19 one-time license', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy the $19 license' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/scan-count-pad/checkout');
  expect(requests).toBe(2);
});

test('@claim:backup-restore exports and restores a local JSON backup', async ({ page }) => {
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles('tests/fixtures/catalog.csv');
  await page.getByRole('button', { name: 'Import and review' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const stream = await (await downloadPromise).createReadStream();
  let backup = '';
  for await (const chunk of stream) backup += chunk.toString();
  expect(JSON.parse(backup).data.products).toHaveLength(3);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#restore-json').setInputFiles('tests/fixtures/backup.json');
  await expect(page.getByRole('heading', { name: '1 items ready to count' })).toBeVisible();
});
