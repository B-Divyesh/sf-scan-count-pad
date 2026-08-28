import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const context = await browser.newContext();
await context.grantPermissions(['camera'], { origin: 'http://127.0.0.1:4173' });
const page = await context.newPage();
await page.addInitScript(() => {
  class Detector {
    async detect() { return [{ rawValue: '111' }]; }
  }
  Object.defineProperty(window, 'BarcodeDetector', { value: Detector, configurable: true });
  const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  window.__qaCameraCalls = 0;
  navigator.mediaDevices.getUserMedia = async (...args) => {
    window.__qaCameraCalls += 1;
    const stream = await original(...args);
    window.__qaCameraStream = stream;
    return stream;
  };
});
await page.goto('http://127.0.0.1:4173');
await page.locator('#csv-file').setInputFiles({
  name: 'camera.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from('sku,barcode,name,expected\nA,111,Camera target,1'),
});
await page.getByRole('button', { name: 'Import and review' }).click();
await page.locator('#session-name').fill('Camera QA');
await page.getByRole('button', { name: 'Start counting' }).click();
assert.equal(await page.evaluate(() => window.__qaCameraCalls), 0);
await page.getByRole('button', { name: 'Use camera' }).click();
await page.getByText(/Camera target · \+1 · now 1/).waitFor();
const result = await page.evaluate(() => ({
  calls: window.__qaCameraCalls,
  trackStates: window.__qaCameraStream.getTracks().map((track) => track.readyState),
  dialogOpen: document.querySelector('#camera-dialog').open,
}));
assert.equal(result.calls, 1);
assert.deepEqual(result.trackStates, ['ended']);
assert.equal(result.dialogOpen, false);
console.log(JSON.stringify(result, null, 2));
await browser.close();
