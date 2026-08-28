import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
const lines = ['sku,barcode,name,expected'];
for (let i = 1; i <= 100; i += 1) lines.push(`SKU-${String(i).padStart(3, '0')},BC-${String(i).padStart(3, '0')},Product ${i},1`);
await page.goto('http://127.0.0.1:4173');
await page.locator('#csv-file').setInputFiles({ name: '100.csv', mimeType: 'text/csv', buffer: Buffer.from(lines.join('\n')) });
await page.getByRole('button', { name: 'Import and review' }).click();
await page.getByRole('heading', { level: 1 }).filter({ hasText: '100 items' }).waitFor();
await page.locator('#session-name').fill('100 SKU pilot simulation');
await page.getByRole('button', { name: 'Start counting' }).click();
await page.locator('#scan-input').waitFor();
const started = Date.now();
for (let i = 1; i <= 100; i += 1) {
  const code = `BC-${String(i).padStart(3, '0')}`;
  await page.locator('#scan-input').fill(code);
  await page.locator('#scan-input').press('Enter');
  await page.getByText(new RegExp(`Product ${i} · \\+1 · now 1$`)).waitFor();
}
for (let i = 1; i <= 5; i += 1) {
  await page.locator('#scan-input').fill(`UNKNOWN-${i}`);
  await page.locator('#scan-input').press('Enter');
  await page.getByText(`UNKNOWN-${i}`, { exact: true }).waitFor();
}
for (let i = 0; i < 5; i += 1) {
  const form = page.locator('.resolve-form').first();
  await form.locator('select').selectOption({ index: 1 });
  await form.locator('button').click();
  await page.waitForFunction((remaining) => document.querySelectorAll('.resolve-form').length === remaining, 4 - i);
}
await page.getByText('Nothing waiting').waitFor();
const elapsedMs = Date.now() - started;
assert.equal(await page.locator('.session-progress strong').innerText(), '100 / 100');
page.once('dialog', (dialog) => dialog.accept());
await page.getByRole('button', { name: 'Finish count' }).click();
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export adjustments CSV' }).click();
const download = await downloadPromise;
const exported = await readFile(await download.path(), 'utf8');
assert.equal(exported.trim().split(/\r?\n/).length, 101);
assert.equal(errors.length, 0);
console.log(JSON.stringify({ productsImported: 100, normalScans: 100, unknownsCreated: 5, unknownsResolved: 5, unknownResolutionRate: '100%', exportedRows: 100, elapsedMs, errors }, null, 2));
await browser.close();
