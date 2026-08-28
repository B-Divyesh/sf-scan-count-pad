import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LOCAL = 'http://127.0.0.1:4173';
const LIVE = 'https://scan-count-pad.sociobot.in';
const results = { assertions: 0, axe: [], network: {}, errors: [], observations: {} };
const ok = (value, message) => { assert.ok(value, message); results.assertions += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); results.assertions += 1; };

async function axe(page, state) {
  const report = await new AxeBuilder({ page }).analyze();
  results.axe.push({ state, violations: report.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })) });
  equal(report.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).length, 0, `${state}: serious/critical axe`);
}

async function importCsv(page, csv) {
  await page.locator('#csv-file').setInputFiles({ name: 'catalog.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Import and review' }).click();
}

async function scan(page, code) {
  await page.locator('#scan-input').fill(code);
  await page.locator('#scan-input').press('Enter');
}

async function mainFlow(browser) {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  await page.goto(LOCAL);
  equal(await page.title(), 'Scan Count Pad — offline shelf counts', 'document title');
  equal(await page.locator('html').getAttribute('lang'), 'en', 'html lang');
  equal(await page.locator('main').count(), 1, 'one main');
  equal(await page.locator('h1').count(), 1, 'one h1');
  equal(await page.locator('img:not([alt])').count(), 0, 'all images have alt');
  await axe(page, 'local onboarding desktop');

  await page.keyboard.press('Tab');
  equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Skip to counting pad', 'skip link is first focus');
  const focusStyle = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor }; });
  equal(focusStyle.width, '3px', 'visible 3px focus ring');
  await page.keyboard.press('Enter');
  const skipFocusTarget = await page.evaluate(() => document.activeElement?.id);
  results.observations.skipLinkFocusTarget = skipFocusTarget;
  ok(['', 'main'].includes(skipFocusTarget), 'skip link activation completed');

  await importCsv(page, 'sku,name\nA,"not closed');
  await page.locator('#import-error').filter({ hasText: 'not closed' }).waitFor();
  ok((await page.locator('#import-error').textContent()).includes('not closed'), 'unclosed quote gives actionable error');
  await importCsv(page, 'sku,name,expected\nA,One,-1');
  await page.locator('#import-error').filter({ hasText: 'invalid expected' }).waitFor();
  ok((await page.locator('#import-error').textContent()).includes('invalid expected'), 'negative expected rejected');
  await importCsv(page, 'sku,barcode,name,expected\nA,dup,One,1\nDUP,dup,Two,2');
  await page.locator('#import-error').filter({ hasText: 'Duplicate' }).waitFor();
  ok((await page.locator('#import-error').textContent()).includes('Duplicate'), 'duplicate identifier rejected');

  const csv = 'sku,barcode,name,expected\nZERO,0000,Zero item,0\nMAX,9999,"Nuts, steel",9999\nSKU-3,abc,Paper roll,2\n=2+2,,Formula label,1';
  await importCsv(page, csv);
  await page.getByRole('heading', { level: 1 }).filter({ hasText: '4 items' }).waitFor();
  ok((await page.getByRole('heading', { level: 1 }).textContent()).includes('4 items'), 'valid catalog imported');
  await page.locator('#session-name').fill('Independent QA');
  await page.getByRole('button', { name: 'Start counting' }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'scan-input');
  equal(await page.evaluate(() => document.activeElement?.id), 'scan-input', 'scan field receives focus');

  await page.getByRole('heading', { level: 1 }).click();
  await page.keyboard.type('zero');
  await page.keyboard.press('Enter');
  await page.getByText(/Zero item · \+1 · now 1/).waitFor();
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByText('Last scan undone.').waitFor();
  equal(await page.locator('[data-product-row]').filter({ hasText: 'Zero item' }).locator('input[name=count]').inputValue(), '0', 'undo restores zero');

  await page.locator('#scan-quantity').fill('9999');
  await page.locator('#scan-quantity').press('Tab');
  await scan(page, '9999');
  await page.getByText(/Nuts, steel · \+9999 · now 9999/).waitFor();
  ok((await page.locator('[data-product-row]').filter({ hasText: 'Nuts, steel' }).locator('.variance').textContent()).includes('On target'), 'maximum quantity counts correctly');

  await page.locator('#scan-quantity').fill('10000');
  await page.locator('#scan-quantity').press('Tab');
  await page.getByRole('heading', { level: 1 }).click();
  await page.keyboard.type('abc');
  await page.keyboard.press('Enter');
  await page.locator('#scan-quantity-error').filter({ hasText: 'whole quantity from 1 to 9999' }).waitFor();
  const paperInput = page.locator('[data-product-row]').filter({ hasText: 'Paper roll' }).locator('input[name=count]');
  equal(await paperInput.inputValue(), '', 'global scanner rejects quantity above 9999');
  await paperInput.fill('2');
  await paperInput.press('Tab');
  await page.locator('[data-product-row]').filter({ hasText: 'Paper roll' }).getByText('On target').waitFor();

  await page.locator('#scan-quantity').fill('1');
  await page.locator('#scan-quantity').press('Tab');
  await scan(page, 'UNKNOWN');
  await page.getByText('Scanned × 1').waitFor();
  await scan(page, 'unknown');
  await page.getByText('Scanned × 2').waitFor();
  ok((await page.locator('.unknown-panel').textContent()).includes('Scanned × 2'), 'repeated unknowns accumulate case-insensitively');
  equal(await page.getByRole('button', { name: 'Finish count' }).isDisabled(), true, 'finish blocked by unresolved unknown');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Ignore this code' }).click();
  ok((await page.locator('.unknown-panel').textContent()).includes('UNKNOWN'), 'cancelled ignore preserves unknown');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Ignore this code' }).click();
  await page.getByText('Nothing waiting').waitFor();

  await scan(page, 'NEW-ITEM');
  await page.getByRole('button', { name: 'Add as new item' }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'new-name');
  equal(await page.evaluate(() => document.activeElement?.id), 'new-name', 'new-item dialog focuses first data field');
  await page.locator('#new-name').fill('Added locally');
  await page.locator('#new-sku').fill('ZERO');
  await page.getByRole('button', { name: 'Add and apply count' }).click();
  ok((await page.locator('#announcer').textContent()).includes('unique SKU'), 'duplicate new SKU announced');
  ok(await page.locator('#new-item-error').isVisible(), 'duplicate new SKU has a visible error');
  equal(await page.locator('#new-sku').getAttribute('aria-invalid'), 'true', 'duplicate new SKU marks its field invalid');
  await page.locator('#new-sku').fill('NEW-SKU');
  await page.locator('#new-expected').fill('1');
  await page.getByRole('button', { name: 'Add and apply count' }).click();
  await page.getByText('Nothing waiting').waitFor();
  ok((await page.locator('.product-list').textContent()).includes('Added locally'), 'unknown can be reconciled as new item');

  await page.locator('#product-search').fill('does not exist');
  await page.getByText('No item matches that search.').waitFor();
  await page.locator('#product-search').fill('');
  await page.reload();
  await page.getByRole('heading', { name: 'Independent QA' }).waitFor();
  equal(await page.locator('[data-product-row]').filter({ hasText: 'Nuts, steel' }).locator('input[name=count]').inputValue(), '9999', 'counts persist across reload');
  await scan(page, '=2+2');
  await page.getByText(/Formula label · \+1 · now 1/).waitFor();
  await axe(page, 'local active count desktop');

  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(LOCAL);
  const motion = await reducedPage.locator('button').first().evaluate((el) => ({ transition: getComputedStyle(el).transitionDuration, animation: getComputedStyle(el).animationDuration, scroll: getComputedStyle(document.documentElement).scrollBehavior }));
  ok(['0s', '1e-05s', '0.00001s'].includes(motion.transition), `reduced transition is effectively instant (${motion.transition})`);
  equal(motion.scroll, 'auto', 'reduced motion removes smooth scroll');
  await reduced.close();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Finish count' }).click();
  await page.getByText('Count complete').waitFor();
  await axe(page, 'local completed summary desktop');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export adjustments CSV' }).click();
  const csvDownload = await downloadPromise;
  const exported = await readFile(await csvDownload.path(), 'utf8');
  ok(exported.includes('MAX,9999,"Nuts, steel",9999,9999,0'), 'export contains correct quoted adjustment');
  ok(exported.includes("'=2+2"), 'formula-leading cell is neutralized in CSV');
  ok(!exported.includes('\r\n=2+2'), 'CSV contains no executable formula-leading row');

  await page.getByRole('button', { name: 'Start another count' }).click();
  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const backup = await backupPromise;
  const backupText = await readFile(await backup.path(), 'utf8');
  ok(JSON.parse(backupText).data.products.length === 5, 'backup contains local catalog');
  await page.locator('#restore-json').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"data":{"products":[],"sessions":"bad"}}') });
  ok((await page.locator('#manage-error').textContent()).includes('not a Scan Count Pad'), 'invalid backup rejected with recovery message');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#restore-json').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backupText) });
  await page.getByText('Latest').waitFor();

  await page.getByRole('button', { name: 'Unlock' }).click();
  equal(await page.locator('#license-dialog').getAttribute('open'), '', 'license dialog opens');
  await page.keyboard.press('Escape');
  equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Unlock', 'dialog returns focus to opener');

  await page.getByRole('button', { name: /View summary|Continue/ }).click();
  await page.getByRole('button', { name: 'Start another count' }).click();
  await page.locator('#session-name').fill('Replacement');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Start counting' }).click();
  ok((await page.getByRole('heading', { level: 1 }).textContent()).includes('5 items'), 'cancel keeps prior session');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start counting' }).click();
  await page.getByRole('heading', { name: 'Replacement' }).waitFor();

  await page.getByRole('button', { name: 'Use camera' }).click();
  const cameraStatus = await page.locator('#camera-status').textContent();
  ok(cameraStatus.includes('not supported') || cameraStatus.includes('not available'), 'camera unsupported/denied state gives fallback');
  await page.getByRole('button', { name: 'Stop camera' }).click();

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const updateResult = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    let updateFound = false;
    registration.addEventListener('updatefound', () => { updateFound = true; });
    await navigator.serviceWorker.register('/sw.js?qa-update=1', { scope: '/' });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { updateFound, toastVisible: !document.querySelector('#update-toast')?.hasAttribute('hidden'), controller: navigator.serviceWorker.controller?.scriptURL };
  });
  results.observations.serviceWorkerUpdateProbe = updateResult;
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'Replacement' }).waitFor();
  equal(await page.getByText('Offline', { exact: true }).count(), 1, 'offline state shown');
  await page.goto(`${LOCAL}/privacy`);
  await page.getByRole('heading', { name: 'Privacy' }).waitFor();
  await axe(page, 'local privacy offline');
  await context.setOffline(false);

  const external = [...new Set(requests.filter((url) => new URL(url).origin !== LOCAL).map((url) => new URL(url).origin))];
  equal(external.length, 0, `ordinary workflow makes no third-party requests: ${external.join(',')}`);
  results.network.localOrigins = [...new Set(requests.map((url) => new URL(url).origin))];
  results.errors.push(...errors);
  equal(errors.length, 0, `local console/page errors: ${errors.join('; ')}`);
  await context.close();
}

async function mobileLive(browser) {
  const context = await browser.newContext({ ...devices['Pixel 5'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  await page.goto(LIVE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/scan-count-pad-mobile-live.png', fullPage: true });
  equal(await page.locator('h1').count(), 1, 'live mobile one h1');
  equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'no mobile horizontal overflow');
  await axe(page, 'live onboarding mobile 390');
  const smallTargets = await page.locator('button:visible:not(.sr-only), input:visible, select:visible, a.primary-button:visible, a.secondary-button:visible').evaluateAll((els) => els.map((el) => ({ label: el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('type'), ...el.getBoundingClientRect().toJSON() })).filter((r) => r.width < 44 || r.height < 44));
  results.observations.mobileSmallTargets = smallTargets;

  await importCsv(page, 'sku,barcode,name,expected\nA,111,Alpha,1\nB,222,Beta,0');
  await page.locator('#session-name').fill('Live mobile QA');
  await page.getByRole('button', { name: 'Start counting' }).click();
  await scan(page, '111');
  await page.getByText(/Alpha · \+1 · now 1/).waitFor();
  await page.reload();
  equal(await page.locator('[data-product-row]').filter({ hasText: 'Alpha' }).locator('input[name=count]').inputValue(), '1', 'live mobile IndexedDB persistence');
  equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'active mobile has no horizontal overflow');
  await axe(page, 'live active mobile 390');
  const activeSmallTargets = await page.locator('button:visible:not(.sr-only), input:visible, select:visible, a.primary-button:visible, a.secondary-button:visible').evaluateAll((els) => els.map((el) => ({ label: el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('type'), ...el.getBoundingClientRect().toJSON() })).filter((r) => r.width < 44 || r.height < 44));
  results.observations.mobileActiveSmallTargets = activeSmallTargets;
  results.network.liveOrdinaryOrigins = [...new Set(requests.map((url) => new URL(url).origin))];
  results.errors.push(...errors);
  equal(errors.length, 0, `live console/page errors: ${errors.join('; ')}`);
  await context.close();
}

async function licenseFlow(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const verificationUrls = [];
  await page.route('https://api.sociobot.in/**', async (route) => {
    verificationUrls.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }), headers: { 'access-control-allow-origin': LIVE } });
  });
  await page.goto(`${LIVE}/?license=qa%20token`);
  await page.waitForFunction(() => !location.search.includes('license'));
  equal(page.url(), `${LIVE}/`, 'license removed from address bar');
  equal(await page.evaluate(() => localStorage.getItem('sb_license:scan-count-pad')), 'qa token', 'license stored locally');
  ok(verificationUrls.some((url) => url.includes('/products/scan-count-pad/verify?license=qa%20token')), 'license verified only through Sociobot endpoint');
  results.network.licenseUrls = verificationUrls;
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await mainFlow(browser);
  await mobileLive(browser);
  await licenseFlow(browser);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
