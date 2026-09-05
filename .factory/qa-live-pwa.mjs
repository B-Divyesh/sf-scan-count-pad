import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

await page.goto('https://scan-count-pad.sociobot.in', { waitUntil: 'networkidle' });
const cdp = await context.newCDPSession(page);
const manifest = await cdp.send('Page.getAppManifest');
const installability = await cdp.send('Page.getInstallabilityErrors');
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
const cachesBefore = await page.evaluate(async () => {
  const names = await caches.keys();
  const entries = {};
  for (const name of names) {
    entries[name] = (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname);
  }
  return { names, entries };
});
const update = await page.evaluate(async () => {
  let found = false;
  const registration = await navigator.serviceWorker.ready;
  registration.addEventListener('updatefound', () => { found = true; });
  await navigator.serviceWorker.register('/sw.js?qa-live-update=1', { scope: '/' });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    found,
    toast: !document.querySelector('#update-toast')?.hasAttribute('hidden'),
    controller: navigator.serviceWorker.controller?.scriptURL,
  };
});
await context.setOffline(true);
await page.reload();
const offline = {
  title: await page.title(),
  h1: await page.locator('h1').innerText(),
  badge: await page.getByText('Offline', { exact: true }).count(),
};
await page.goto('https://scan-count-pad.sociobot.in/privacy');
offline.privacy = await page.locator('h1').innerText();
console.log(JSON.stringify({
  manifestUrl: manifest.url,
  manifestErrors: manifest.errors,
  installability,
  cachesBefore,
  update,
  offline,
  errors,
}, null, 2));

const licenseContext = await browser.newContext();
const licensePage = await licenseContext.newPage();
let verifyRequests = 0;
await licensePage.route('https://api.sociobot.in/**', async (route) => {
  verifyRequests += 1;
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  });
});
await licensePage.goto('https://scan-count-pad.sociobot.in/?license=qa-valid-token');
await licensePage.getByRole('button', { name: 'License active' }).waitFor();
const cleanedUrl = licensePage.url();
await licensePage.reload();
await licensePage.getByRole('button', { name: 'License active' }).waitFor();
console.log(JSON.stringify({ license: { cleanedUrl, verifyRequests, cachedAcrossReload: true } }, null, 2));
await licenseContext.close();
await browser.close();
