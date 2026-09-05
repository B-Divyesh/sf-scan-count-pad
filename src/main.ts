import './style.css';
import { adjustmentsCsv, productsFromCsv } from './csv';
import { clearData, loadData, saveData } from './db';
import { cachedLicense, captureLicense, checkoutUrl, restoreLicense, verifyLicense, type LicenseState } from './license';
import { validScanQuantity } from './quantity';
import { EMPTY_DATA, type AppData, type CountSession, type Product, type UnknownScan } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const demoMode = location.pathname.replace(/\/$/, '') === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
let data: AppData = structuredClone(EMPTY_DATA);
let license: LicenseState = cachedLicense();
let lastResult: { kind: 'good' | 'warn'; text: string; eventId?: string } | undefined;
let scanQuantity = 1;
let search = '';
let online = navigator.onLine;
let scannerBuffer = '';
let scannerTimer = 0;
let pendingUnknownId = '';
let cameraStream: MediaStream | undefined;
let cameraFrame = 0;
let scanQuantityError = '';

interface RouteHistoryState { scrollX?: number; scrollY?: number }

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
const now = () => new Date().toISOString();
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const activeSession = (): CountSession | undefined => data.sessions.find((session) => session.id === data.activeSessionId);

function sampleData(): AppData {
  const timestamp = now();
  return {
    products: [
      { id: 'demo-bolts', sku: 'BOLT-01', barcode: '8901001', name: 'Brass bolts', expected: 120 },
      { id: 'demo-tape', sku: 'TAPE-02', barcode: '8901002', name: 'Paper tape', expected: 18 },
      { id: 'demo-boxes', sku: 'BOX-03', barcode: '8901003', name: 'Small shipping boxes', expected: 32 },
      { id: 'demo-gloves', sku: 'GLOVE-04', barcode: '8901004', name: 'Work gloves', expected: 12 },
    ],
    sessions: [{
      id: 'demo-session', name: 'Friday bay A sample', startedAt: timestamp, updatedAt: timestamp,
      counts: { 'demo-bolts': 118, 'demo-tape': 18, 'demo-boxes': 34 },
      unknowns: [{ id: 'demo-unknown', code: '8901999', quantity: 2, createdAt: timestamp, resolved: false }],
      history: [],
    }],
    activeSessionId: 'demo-session',
  };
}

function announce(message: string): void {
  const region = document.querySelector<HTMLElement>('#announcer');
  if (region) region.textContent = message;
}

async function persist(): Promise<void> {
  try { await saveData(data, demoMode); }
  catch { announce('Could not save on this device. Export a backup before closing.'); }
}

function shell(content: string): string {
  return `
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved to your real counts</strong><span><button type="button" class="text-button" data-reset-demo>Reset demo</button><button type="button" class="text-button" data-start-real>Start for real</button></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" href="${demoMode ? '/demo' : '/'}" data-nav aria-label="Scan Count Pad home">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 8h38v7H5zm0 13h28v7H5zm0 13h38v7H5z"/><path class="beam" d="m2 41 43-20 2 5L4 46z"/></svg>
        <span>Scan / Count / Pad</span>
      </a>
      <div class="header-actions">
        <span class="connection ${online ? 'online' : 'offline'}"><i></i>${online ? 'Ready offline' : 'Offline'}</span>
        <button class="quiet-button" type="button" data-open-license>${license.valid ? 'License active' : 'Unlock'}</button>
      </div>
    </header>
    ${content}
    <footer>
      <p>Counts stay on this device. <span aria-hidden="true">◇</span> <a href="/privacy" data-nav>Privacy</a> <a href="/terms" data-nav>Terms</a></p>
      <p>Original generated shelf artwork · Built by Param Factory · v1.0.2</p>
    </footer>
    <div id="announcer" class="sr-only" aria-live="polite"></div>
    <div id="update-toast" class="toast" hidden><span>An app update is ready.</span><button type="button" data-reload>Reload</button></div>
    ${licenseDialog()}
    ${cameraDialog()}
    ${newItemDialog()}`;
}

function licenseDialog(): string {
  return `<dialog id="license-dialog" class="modal" aria-labelledby="license-heading">
    <form method="dialog" class="modal-close"><button aria-label="Close license window">×</button></form>
    <p class="eyebrow">One-time license</p>
    <h2 id="license-heading">Keep every count on this device</h2>
    <p>The free pad completes and exports a full count. A <strong>$19 one-time license</strong> keeps an unlimited session archive on this device.</p>
    ${license.valid ? `<p class="license-good"><span aria-hidden="true">✓</span> This device has an active license.</p>` : `<a class="primary-button full" href="${checkoutUrl}">Buy the $19 license</a>`}
    ${license.token && !license.valid ? `<p class="notice">${license.reason === 'offline' ? 'License check will retry when online.' : license.reason === 'rate_limited' ? 'Too many license checks. Wait a minute, then try again.' : 'This license is no longer active.'}</p>` : ''}
    <form id="restore-form" class="stack-form">
      <label for="license-token">Have a license? Paste it here</label>
      <input id="license-token" name="token" autocomplete="off" required>
      <button type="submit" class="secondary-button">Verify license</button>
    </form>
    <p class="fine-print">Checkout is hosted by Sociobot. Dodo is the merchant of record; refunds are handled there and revoke the license. <a href="/privacy" data-nav>Privacy</a> · <a href="/terms" data-nav>Terms</a></p>
  </dialog>`;
}

function cameraDialog(): string {
  return `<dialog id="camera-dialog" class="modal camera-modal" aria-labelledby="camera-heading">
    <p class="eyebrow">Camera barcode scan</p><h2 id="camera-heading">Point at one barcode</h2>
    <video id="camera-video" autoplay muted playsinline aria-label="Live camera view for barcode scanning"></video>
    <p id="camera-status" class="notice">Starting camera…</p>
    <button type="button" class="secondary-button full" data-close-camera>Stop camera</button>
  </dialog>`;
}

function newItemDialog(): string {
  return `<dialog id="new-item-dialog" class="modal" aria-labelledby="new-item-heading">
    <form method="dialog" class="modal-close"><button aria-label="Close new item window">×</button></form>
    <p class="eyebrow">Reconcile unknown</p><h2 id="new-item-heading">Add it to this catalog</h2>
    <form id="new-item-form" class="stack-form">
      <label for="new-name">Product name</label><input id="new-name" name="name" required>
      <label for="new-sku">SKU</label><input id="new-sku" name="sku" required aria-describedby="new-item-error">
      <p id="new-item-error" class="form-error" role="alert"></p>
      <label for="new-expected">Expected quantity</label><input id="new-expected" name="expected" type="number" min="0" step="1" value="0" required>
      <button class="primary-button" type="submit">Add and apply count</button>
    </form>
  </dialog>`;
}

function legalPage(kind: 'privacy' | 'terms'): string {
  const privacy = `<main id="main" class="legal"><p class="eyebrow">Plain-language policy</p><h1>Privacy</h1><p class="lede">Your catalog and counts belong to you. Scan Count Pad stores them in this browser's IndexedDB and does not send them to us.</p><h2>What stays local</h2><p>Imported product names, SKUs, barcodes, expected quantities, sessions, and scan history remain on your device. Exports are created locally.</p><h2>Camera and network</h2><p>Camera access starts only after you press “Use camera” and stops when the camera window closes or a barcode is read. The app does not upload camera frames. A network request is made only to verify a pasted or purchased Sociobot license; the service receives the license token and standard request metadata.</p><h2>Your choices</h2><p>Use the backup export to take your data with you. Clear this site's storage in your browser to delete local data. Contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with policy questions.</p>`;
  const terms = `<main id="main" class="legal"><p class="eyebrow">Product terms</p><h1>Terms</h1><p class="lede">Scan Count Pad is a counting aid. Review every variance before you import its CSV into another system.</p><h2>Use of the utility</h2><p>You are responsible for catalog accuracy, physical counts, backups, and downstream stock adjustments. The software is provided “as is” without a guarantee that every scanner, barcode, or browser will be supported.</p><h2>One-time license</h2><p>The $19 purchase unlocks session history for this product. Sociobot's hosted checkout is used; Dodo is the merchant of record. Refunds are handled through the merchant and a refunded, expired, or revoked license stops unlocking paid features. Core counting and CSV export remain available.</p><h2>Acceptable use</h2><p>Do not attempt to interfere with the service or share a license outside your own shop. These terms are governed by applicable law. Questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`;
  return shell(`${kind === 'privacy' ? privacy : terms}<p><a class="secondary-button" href="/" data-nav>Back to the counting pad</a></p></main>`);
}

function emptyPage(): string {
  return shell(`<main id="main">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Shelf counting for small shops</p>
        <h1>Count stock at<br><em>the shelf.</em></h1>
        <p class="lede">For small shops counting stock at the shelf with a phone or Bluetooth scanner.</p>
        <div class="hero-actions"><a class="primary-button" href="/demo">Try it with sample data</a><span>Opens a separate sample count.</span></div>
        <ul class="feature-ticks"><li>Works offline after the first visit</li><li>Counts stay in this browser</li><li>Full count and CSV export are free</li></ul>
      </div>
      <picture class="hero-art"><img src="/art/counting-bay.webp" width="1152" height="768" alt="Surreal blue stockroom shelves folding upward beside a clipboard and a red scanner beam" fetchpriority="high" decoding="async"></picture>
    </section>
    <section class="import-bay" aria-labelledby="import-heading">
      <div><p class="step-mark">01 / Import the catalog</p><h2 id="import-heading">Start with a CSV</h2><p>Required columns: <code>sku</code> and <code>name</code>. Optional: <code>barcode</code> and <code>expected</code>.</p></div>
      <form id="csv-form" class="file-drop">
        <label for="csv-file"><span>Choose catalog CSV</span><small>Saved only on this device</small></label>
        <input id="csv-file" name="catalog" type="file" accept=".csv,text/csv" required>
        <button class="primary-button" type="submit">Import and review</button>
      </form>
      <p id="import-error" class="form-error" role="alert"></p>
    </section>
    <section class="how"><p class="step-mark">How it works</p><ol><li><b>01</b><span>Import the SKU sheet</span></li><li><b>02</b><span>Scan or tap counts</span></li><li><b>03</b><span>Resolve unknown codes</span></li><li><b>04</b><span>Export adjustments</span></li></ol></section>
  </main>`);
}

function readyPage(): string {
  const recent = data.sessions[0];
  return shell(`<main id="main" class="ready-page">
    <div class="ready-intro"><p class="eyebrow">Catalog on this device</p><h1>${data.products.length} items ready to count</h1><p class="lede">Name this count, then leave the cursor in the scan field. Most Bluetooth scanners send Enter for you.</p></div>
    <section class="start-panel" aria-labelledby="new-heading"><p class="step-mark">New count</p><h2 id="new-heading">Open a counting session</h2>
      <form id="session-form" class="start-form"><label for="session-name">Session name</label><div><input id="session-name" name="name" value="${esc(new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))} shelf count" required maxlength="80"><button class="primary-button" type="submit">Start counting</button></div></form>
      ${recent ? `<div class="recent"><span>Latest</span><strong>${esc(recent.name)}</strong><small>${recent.completedAt ? 'Completed' : 'In progress'} · ${formatDate(recent.updatedAt)}</small><button class="secondary-button" type="button" data-open-session="${recent.id}">${recent.completedAt ? 'View summary' : 'Continue'}</button></div>` : ''}
    </section>
    <section class="manage-panel"><div><p class="step-mark">Catalog & backup</p><h2>Manage your local data</h2><p>Replace the catalog from CSV or download a JSON backup of everything stored here.</p></div><div class="button-row"><label class="secondary-button file-button" for="replace-csv">Replace catalog<input id="replace-csv" type="file" accept=".csv,text/csv"></label><button type="button" class="secondary-button" data-export-backup>Export backup</button><label class="secondary-button file-button" for="restore-json">Restore backup<input id="restore-json" type="file" accept="application/json,.json"></label></div><p id="manage-error" class="form-error" role="alert"></p></section>
  </main>`);
}

function sessionPage(session: CountSession): string {
  if (session.completedAt) return summaryPage(session);
  const countedCount = Object.keys(session.counts).length;
  const unresolved = session.unknowns.filter((item) => !item.resolved);
  const rows = data.products.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search.toLowerCase()));
  return shell(`<main id="main" class="session-page">
    <div class="session-heading"><div><p class="eyebrow">Active shelf count</p><h1>${esc(session.name)}</h1><p>Started ${formatDate(session.startedAt)} · autosaved on this device</p></div><div class="session-progress"><strong>${countedCount}<small> / ${data.products.length}</small></strong><span>items touched</span></div></div>
    <div class="workspace">
      <div class="scan-column">
        <section class="scan-deck" aria-labelledby="scan-heading">
          <div class="scan-title"><div><p class="step-mark">Scanner ready</p><h2 id="scan-heading">Scan a code</h2></div><span class="pulse-label"><i></i>Listening</span></div>
          <form id="scan-form" novalidate><label for="scan-input">Barcode or SKU</label><div class="scan-line"><input id="scan-input" name="code" inputmode="numeric" autocomplete="off" autocapitalize="off" enterkeyhint="done" required placeholder="Scan or type, then Enter"><label class="quantity-label" for="scan-quantity">Qty<input id="scan-quantity" type="number" min="1" max="9999" step="1" value="${scanQuantity}" aria-describedby="scan-quantity-error" ${scanQuantityError ? 'aria-invalid="true"' : ''}></label><button class="primary-button" type="submit">Count</button></div><p id="scan-quantity-error" class="form-error scan-error" role="alert">${esc(scanQuantityError)}</p></form>
          <div class="scan-tools"><button type="button" class="quiet-button" data-camera>Use camera</button><span>Tip: press <kbd>/</kbd> to return here</span></div>
          ${lastResult ? `<div class="last-result ${lastResult.kind}" role="status"><span>${lastResult.kind === 'good' ? '✓' : '?'}</span><strong>${esc(lastResult.text)}</strong>${lastResult.eventId ? `<button type="button" data-undo="${lastResult.eventId}">Undo</button>` : ''}</div>` : ''}
        </section>
        ${unknownsPanel(unresolved)}
        <section class="finish-panel"><div><p class="step-mark">Finish this count</p><h2>Review, then finish</h2><p>${unresolved.length ? `${unresolved.length} unknown ${unresolved.length === 1 ? 'code needs' : 'codes need'} a decision.` : 'Every unknown scan has a decision.'}</p></div><button class="primary-button" type="button" data-complete ${unresolved.length ? 'disabled aria-describedby="finish-note"' : ''}>Finish count</button>${unresolved.length ? '<small id="finish-note">Resolve or ignore unknown codes first.</small>' : ''}</section>
      </div>
      <section class="count-sheet" aria-labelledby="sheet-heading">
        <div class="sheet-head"><div><p class="step-mark">Live count sheet</p><h2 id="sheet-heading">${countedCount} of ${data.products.length} touched</h2></div><label class="search-label" for="product-search">Find item<input id="product-search" type="search" value="${esc(search)}" placeholder="Name, SKU, barcode"></label></div>
        <div class="product-list">${rows.length ? rows.map((product) => productRow(product, session)).join('') : '<p class="empty-search">No item matches that search.</p>'}</div>
      </section>
    </div>
  </main>`);
}

function productRow(product: Product, session: CountSession): string {
  const touched = session.counts[product.id] !== undefined;
  const counted = session.counts[product.id] ?? 0;
  const variance = counted - product.expected;
  const varianceText = !touched ? 'Not counted' : variance === 0 ? 'On target' : `${variance > 0 ? '+' : ''}${variance} variance`;
  return `<article class="product-row ${touched ? 'touched' : ''}" data-product-row="${product.id}">
    <div class="product-ident"><h3>${esc(product.name)}</h3><p><span>${esc(product.sku)}</span>${product.barcode ? `<span>${esc(product.barcode)}</span>` : ''}</p></div>
    <div class="expected"><span>Expected</span><strong>${product.expected}</strong></div>
    <form class="set-count-form" data-product="${product.id}"><label for="count-${product.id}">Counted</label><input id="count-${product.id}" name="count" type="number" min="0" step="1" value="${touched ? counted : ''}" placeholder="—"><button type="submit" class="sr-only">Set count</button></form>
    <div class="variance ${!touched ? '' : variance === 0 ? 'even' : 'off'}"><span aria-hidden="true">${!touched ? '○' : variance === 0 ? '✓' : '◆'}</span>${varianceText}</div>
    <div class="row-actions"><button type="button" data-adjust="-1" data-product="${product.id}" aria-label="Remove one ${esc(product.name)}">−1</button><button type="button" data-adjust="1" data-product="${product.id}" aria-label="Add one ${esc(product.name)}">+1</button></div>
  </article>`;
}

function unknownsPanel(unknowns: UnknownScan[]): string {
  if (!unknowns.length) return `<section class="unknown-panel calm"><p class="step-mark">Unknown queue</p><h2>Nothing waiting</h2><p>Unrecognized scans appear here instead of changing stock silently.</p></section>`;
  return `<section class="unknown-panel" aria-labelledby="unknown-heading"><div class="unknown-title"><div><p class="step-mark">Review required</p><h2 id="unknown-heading">Unknown scans <span>${unknowns.length}</span></h2></div></div><ul>${unknowns.map((item) => `<li><div><code>${esc(item.code)}</code><span>Scanned × ${item.quantity}</span></div><form class="resolve-form" data-unknown="${item.id}"><label for="match-${item.id}">Match product</label><select id="match-${item.id}" name="product" required><option value="">Choose an item</option>${data.products.map((product) => `<option value="${product.id}">${esc(product.name)} · ${esc(product.sku)}</option>`).join('')}</select><button class="secondary-button" type="submit">Apply ${item.quantity}</button></form><div class="unknown-actions"><button type="button" class="text-button" data-add-unknown="${item.id}">Add as new item</button><button type="button" class="text-button danger" data-ignore="${item.id}">Ignore this code</button></div></li>`).join('')}</ul></section>`;
}

function summaryPage(session: CountSession): string {
  const touched = data.products.filter((product) => session.counts[product.id] !== undefined);
  const variants = touched.filter((product) => session.counts[product.id] !== product.expected);
  return shell(`<main id="main" class="summary-page"><div class="summary-hero"><p class="eyebrow">Count complete</p><h1>${esc(session.name)}</h1><p class="lede">This count is saved locally. Export the adjustments, then review them before changing your inventory system.</p><div class="summary-stats"><div><strong>${touched.length}</strong><span>items touched</span></div><div><strong>${variants.length}</strong><span>with variance</span></div><div><strong>${session.unknowns.length}</strong><span>unknown scans reviewed</span></div></div><div class="button-row"><button type="button" class="primary-button" data-export-csv>Export adjustments CSV</button><button type="button" class="secondary-button" data-new-session>Start another count</button></div></div>
    <section class="variance-sheet"><p class="step-mark">Adjustment preview</p><h2>${variants.length ? 'Check these variances' : 'No variances found'}</h2>${variants.length ? `<ul>${variants.map((product) => { const counted = session.counts[product.id]; const delta = counted - product.expected; return `<li><div><strong>${esc(product.name)}</strong><span>${esc(product.sku)}</span></div><span>${product.expected} → ${counted}</span><b>${delta > 0 ? '+' : ''}${delta}</b></li>`; }).join('')}</ul>` : '<p>Every touched item matched its expected quantity.</p>'}<p class="notice">Untouched products are omitted from the adjustment CSV; they are not silently treated as zero.</p></section>
  </main>`);
}

function render(): void {
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.title = path === '/privacy' ? 'Privacy — Scan Count Pad' : path === '/terms' ? 'Terms — Scan Count Pad' : demoMode ? 'Demo — Scan Count Pad' : 'Scan Count Pad — offline shelf counts';
  if (path === '/privacy' || path === '/terms') app.innerHTML = legalPage(path.slice(1) as 'privacy' | 'terms');
  else if (!data.products.length) app.innerHTML = emptyPage();
  else app.innerHTML = activeSession() ? sessionPage(activeSession()!) : readyPage();
  bindEvents();
}

function completeRouteChange(scrollX = 0, scrollY = 0): void {
  render();
  const heading = document.querySelector<HTMLElement>('h1');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
  scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
  announce(document.title);
}

function bindEvents(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); history.pushState({ scrollX: 0, scrollY: 0 } satisfies RouteHistoryState, '', link.pathname); completeRouteChange(); }));
  document.querySelector('[data-reset-demo]')?.addEventListener('click', resetDemo);
  document.querySelector('[data-start-real]')?.addEventListener('click', startForReal);
  document.querySelector('[data-open-license]')?.addEventListener('click', () => (document.querySelector<HTMLDialogElement>('#license-dialog')?.showModal()));
  document.querySelector('[data-reload]')?.addEventListener('click', () => location.reload());
  document.querySelector('#restore-form')?.addEventListener('submit', handleRestoreLicense);
  document.querySelector('#csv-form')?.addEventListener('submit', handleCsvImport);
  document.querySelector('#session-form')?.addEventListener('submit', handleStartSession);
  document.querySelector('#scan-form')?.addEventListener('submit', (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const code = new FormData(form).get('code')?.toString() || ''; processScan(code, scanQuantity); });
  document.querySelector<HTMLInputElement>('#scan-quantity')?.addEventListener('input', (event) => { scanQuantity = Number((event.target as HTMLInputElement).value); scanQuantityError = ''; (event.target as HTMLInputElement).removeAttribute('aria-invalid'); document.querySelector('#scan-quantity-error')!.textContent = ''; });
  document.querySelector<HTMLInputElement>('#new-sku')?.addEventListener('input', (event) => { (event.target as HTMLInputElement).removeAttribute('aria-invalid'); const error = document.querySelector('#new-item-error'); if (error) error.textContent = ''; });
  document.querySelector<HTMLInputElement>('#product-search')?.addEventListener('input', (event) => { search = (event.target as HTMLInputElement).value; const focusAt = search.length; render(); const field = document.querySelector<HTMLInputElement>('#product-search'); field?.focus(); field?.setSelectionRange(focusAt, focusAt); });
  document.querySelectorAll<HTMLButtonElement>('[data-adjust]').forEach((button) => button.addEventListener('click', () => adjustProduct(button.dataset.product!, Number(button.dataset.adjust))));
  document.querySelectorAll<HTMLFormElement>('.set-count-form').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); const value = Number(new FormData(form).get('count')); setProductCount(form.dataset.product!, value); }));
  document.querySelectorAll<HTMLFormElement>('.set-count-form input').forEach((input) => input.addEventListener('change', () => (input.closest('form') as HTMLFormElement).requestSubmit()));
  document.querySelectorAll<HTMLFormElement>('.resolve-form').forEach((form) => form.addEventListener('submit', handleResolve));
  document.querySelectorAll<HTMLButtonElement>('[data-ignore]').forEach((button) => button.addEventListener('click', () => ignoreUnknown(button.dataset.ignore!)));
  document.querySelectorAll<HTMLButtonElement>('[data-add-unknown]').forEach((button) => button.addEventListener('click', () => openNewItem(button.dataset.addUnknown!)));
  document.querySelector('#new-item-form')?.addEventListener('submit', handleNewItem);
  document.querySelector('[data-complete]')?.addEventListener('click', completeSession);
  document.querySelector('[data-export-csv]')?.addEventListener('click', exportCsv);
  document.querySelector('[data-new-session]')?.addEventListener('click', prepareNewSession);
  document.querySelectorAll<HTMLElement>('[data-open-session]').forEach((button) => button.addEventListener('click', () => { data.activeSessionId = button.dataset.openSession; persist(); render(); }));
  document.querySelector('[data-export-backup]')?.addEventListener('click', exportBackup);
  document.querySelector<HTMLInputElement>('#replace-csv')?.addEventListener('change', replaceCatalog);
  document.querySelector<HTMLInputElement>('#restore-json')?.addEventListener('change', restoreBackup);
  document.querySelector('[data-camera]')?.addEventListener('click', startCamera);
  document.querySelector('[data-close-camera]')?.addEventListener('click', stopCamera);
  document.querySelector<HTMLDialogElement>('#camera-dialog')?.addEventListener('close', stopCamera);
  document.querySelectorAll<HTMLButtonElement>('[data-undo]').forEach((button) => button.addEventListener('click', () => undoEvent(button.dataset.undo!)));
}

async function fileText(input: HTMLInputElement): Promise<string> {
  const file = input.files?.[0];
  if (!file) throw new Error('Choose a file first.');
  if (file.size > 5_000_000) throw new Error('That file is over 5 MB. Split it into a smaller catalog.');
  return file.text();
}

async function handleCsvImport(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const error = document.querySelector('#import-error')!;
  try { data.products = productsFromCsv(await fileText(form.elements.namedItem('catalog') as HTMLInputElement)); await persist(); render(); }
  catch (cause) { error.textContent = cause instanceof Error ? cause.message : 'Could not import that CSV.'; }
}

async function replaceCatalog(event: Event): Promise<void> {
  const error = document.querySelector('#manage-error')!;
  try {
    const products = productsFromCsv(await fileText(event.target as HTMLInputElement));
    if (!confirm(`Replace the catalog with ${products.length} items? Existing session history will be cleared.`)) return;
    data = { products, sessions: [] }; await persist(); render();
  } catch (cause) { error.textContent = cause instanceof Error ? cause.message : 'Could not replace the catalog.'; }
}

async function handleStartSession(event: Event): Promise<void> {
  event.preventDefault();
  const name = new FormData(event.currentTarget as HTMLFormElement).get('name')?.toString().trim();
  if (!name) return;
  if (!license.valid && data.sessions.length && !confirm('Free mode keeps only the latest session. Export the previous count before replacing it. Continue?')) return;
  if (!license.valid) data.sessions = [];
  const timestamp = now();
  const session: CountSession = { id: crypto.randomUUID(), name, startedAt: timestamp, updatedAt: timestamp, counts: {}, unknowns: [], history: [] };
  data.sessions.unshift(session); data.activeSessionId = session.id; await persist(); render(); setTimeout(() => document.querySelector<HTMLInputElement>('#scan-input')?.focus(), 0);
}

async function processScan(rawCode: string, quantity = 1): Promise<void> {
  const session = activeSession();
  const code = rawCode.trim();
  if (!session || !code || session.completedAt) return;
  if (!validScanQuantity(quantity)) {
    scanQuantityError = 'Enter a whole quantity from 1 to 9999. Nothing was counted.';
    lastResult = { kind: 'warn', text: scanQuantityError };
    render();
    setTimeout(() => document.querySelector<HTMLInputElement>('#scan-quantity')?.focus(), 0);
    return;
  }
  scanQuantityError = '';
  const product = data.products.find((item) => item.sku.toLowerCase() === code.toLowerCase() || Boolean(item.barcode && item.barcode.toLowerCase() === code.toLowerCase()));
  session.updatedAt = now();
  if (product) {
    const eventId = crypto.randomUUID();
    session.counts[product.id] = (session.counts[product.id] ?? 0) + quantity;
    session.history.push({ id: eventId, at: session.updatedAt, type: 'scan', productId: product.id, delta: quantity, code });
    lastResult = { kind: 'good', text: `${product.name} · +${quantity} · now ${session.counts[product.id]}`, eventId };
  } else {
    const existing = session.unknowns.find((item) => !item.resolved && item.code.toLowerCase() === code.toLowerCase());
    if (existing) existing.quantity += quantity;
    else session.unknowns.push({ id: crypto.randomUUID(), code, quantity, createdAt: session.updatedAt, resolved: false });
    lastResult = { kind: 'warn', text: `${code} is unknown. No stock was changed.` };
  }
  await persist(); render(); setTimeout(() => document.querySelector<HTMLInputElement>('#scan-input')?.focus(), 0);
}

async function adjustProduct(productId: string, delta: number): Promise<void> {
  const session = activeSession(); if (!session) return;
  const current = session.counts[productId] ?? 0;
  const next = Math.max(0, current + delta);
  const actualDelta = next - current;
  session.counts[productId] = next; session.updatedAt = now();
  if (actualDelta) session.history.push({ id: crypto.randomUUID(), at: session.updatedAt, type: 'adjust', productId, delta: actualDelta });
  await persist(); render();
}

async function setProductCount(productId: string, value: number): Promise<void> {
  if (!Number.isFinite(value) || value < 0) return;
  const session = activeSession(); if (!session) return;
  const previous = session.counts[productId] ?? 0;
  session.counts[productId] = value; session.updatedAt = now();
  session.history.push({ id: crypto.randomUUID(), at: session.updatedAt, type: 'adjust', productId, delta: value - previous });
  await persist(); render();
}

async function handleResolve(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const session = activeSession(); const unknown = session?.unknowns.find((item) => item.id === form.dataset.unknown);
  const productId = new FormData(form).get('product')?.toString();
  if (!session || !unknown || !productId) return;
  session.counts[productId] = (session.counts[productId] ?? 0) + unknown.quantity;
  unknown.resolved = true; unknown.resolution = productId; session.updatedAt = now();
  session.history.push({ id: crypto.randomUUID(), at: session.updatedAt, type: 'reconcile', productId, delta: unknown.quantity, code: unknown.code });
  await persist(); render(); announce(`${unknown.code} matched and applied.`);
}

async function ignoreUnknown(id: string): Promise<void> {
  const session = activeSession(); const unknown = session?.unknowns.find((item) => item.id === id);
  if (!session || !unknown || !confirm(`Ignore ${unknown.code}? Its quantity will not be applied to any item.`)) return;
  unknown.resolved = true; unknown.resolution = 'ignored'; session.updatedAt = now(); await persist(); render(); announce(`${unknown.code} ignored.`);
}

function openNewItem(id: string): void {
  const session = activeSession(); const unknown = session?.unknowns.find((item) => item.id === id); if (!unknown) return;
  pendingUnknownId = id;
  const dialog = document.querySelector<HTMLDialogElement>('#new-item-dialog')!;
  (dialog.querySelector('#new-sku') as HTMLInputElement).value = unknown.code;
  dialog.showModal(); setTimeout(() => (dialog.querySelector('#new-name') as HTMLInputElement).focus(), 0);
}

async function handleNewItem(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement; const values = new FormData(form); const session = activeSession(); const unknown = session?.unknowns.find((item) => item.id === pendingUnknownId);
  if (!session || !unknown) return;
  const sku = values.get('sku')?.toString().trim() || ''; const name = values.get('name')?.toString().trim() || ''; const expected = Number(values.get('expected'));
  const skuInput = form.elements.namedItem('sku') as HTMLInputElement;
  const error = form.querySelector<HTMLElement>('#new-item-error')!;
  if (!sku || !name) { error.textContent = 'Enter a product name and SKU.'; announce(error.textContent); return; }
  if (data.products.some((product) => [product.sku, product.barcode].some((value) => value.toLowerCase() === sku.toLowerCase()))) {
    error.textContent = `SKU “${sku}” is already in the catalog. Enter a unique SKU.`;
    skuInput.setAttribute('aria-invalid', 'true');
    skuInput.focus();
    announce(error.textContent);
    return;
  }
  if (!Number.isSafeInteger(expected) || expected < 0) { error.textContent = 'Expected quantity must be a whole number of zero or more.'; announce(error.textContent); return; }
  const product: Product = { id: crypto.randomUUID(), sku, barcode: unknown.code === sku ? '' : unknown.code, name, expected };
  data.products.push(product); session.counts[product.id] = unknown.quantity; unknown.resolved = true; unknown.resolution = product.id; session.updatedAt = now();
  session.history.push({ id: crypto.randomUUID(), at: session.updatedAt, type: 'reconcile', productId: product.id, delta: unknown.quantity, code: unknown.code });
  await persist(); document.querySelector<HTMLDialogElement>('#new-item-dialog')?.close(); render(); announce(`${name} added and counted.`);
}

async function resetDemo(): Promise<void> {
  data = sampleData();
  lastResult = undefined;
  scanQuantity = 1;
  scanQuantityError = '';
  await persist();
  render();
  announce('Demo reset to the original sample count.');
}

async function startForReal(): Promise<void> {
  try { await clearData(true); } catch { /* The separate demo database remains isolated. */ }
  location.assign('/');
}

async function undoEvent(eventId: string): Promise<void> {
  const session = activeSession(); const index = session?.history.findIndex((item) => item.id === eventId) ?? -1; if (!session || index < 0) return;
  const item = session.history[index]; session.counts[item.productId] = Math.max(0, (session.counts[item.productId] ?? 0) - item.delta); session.history.splice(index, 1); session.updatedAt = now();
  lastResult = { kind: 'good', text: 'Last scan undone.' }; await persist(); render();
}

async function completeSession(): Promise<void> {
  const session = activeSession(); if (!session || session.unknowns.some((item) => !item.resolved)) return;
  if (!confirm(`Finish “${session.name}”? You can export it afterward, but counting will close.`)) return;
  session.completedAt = now(); session.updatedAt = session.completedAt; await persist(); render();
}

function download(name: string, content: string, type: string): void {
  const anchor = document.createElement('a'); const url = URL.createObjectURL(new Blob([content], { type })); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv(): void { const session = activeSession(); if (session) download(`${session.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-adjustments.csv`, adjustmentsCsv(data.products, session), 'text/csv;charset=utf-8'); }
function exportBackup(): void { download(`scan-count-pad-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ version: 1, exportedAt: now(), data }, null, 2), 'application/json'); }

async function restoreBackup(event: Event): Promise<void> {
  const error = document.querySelector('#manage-error')!;
  try {
    const parsed = JSON.parse(await fileText(event.target as HTMLInputElement)) as { version: number; data: AppData };
    if (parsed.version !== 1 || !Array.isArray(parsed.data?.products) || !Array.isArray(parsed.data?.sessions)) throw new Error('This is not a Scan Count Pad v1 backup.');
    if (!confirm(`Restore ${parsed.data.products.length} products? This replaces data on this device.`)) return;
    data = parsed.data; await persist(); render();
  } catch (cause) { error.textContent = cause instanceof Error ? cause.message : 'Could not restore that backup.'; }
}

async function prepareNewSession(): Promise<void> { data.activeSessionId = undefined; await persist(); render(); }

async function handleRestoreLicense(event: Event): Promise<void> {
  event.preventDefault(); const token = new FormData(event.currentTarget as HTMLFormElement).get('token')?.toString().trim(); if (!token) return;
  restoreLicense(token); license = await verifyLicense(token); render(); document.querySelector<HTMLDialogElement>('#license-dialog')?.showModal(); announce(license.valid ? 'License verified. Bench unlocked.' : 'That license could not be verified.');
}

async function startCamera(): Promise<void> {
  const dialog = document.querySelector<HTMLDialogElement>('#camera-dialog')!; dialog.showModal();
  const status = dialog.querySelector<HTMLElement>('#camera-status')!;
  const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
  if (!Detector || !navigator.mediaDevices?.getUserMedia) { status.textContent = 'Camera barcode scanning is not supported here. Use the scan field or a Bluetooth scanner.'; return; }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    const video = dialog.querySelector<HTMLVideoElement>('#camera-video')!; video.srcObject = cameraStream; await video.play();
    status.textContent = 'Looking for a barcode. No camera frames leave this device.';
    const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'codabar'] });
    const tick = async () => { if (!cameraStream) return; try { const codes = await detector.detect(video); if (codes[0]?.rawValue) { const value = codes[0].rawValue; stopCamera(); await processScan(value, scanQuantity); return; } } catch { status.textContent = 'Could not read that frame. Hold the barcode steady in good light.'; } cameraFrame = requestAnimationFrame(tick); };
    cameraFrame = requestAnimationFrame(tick);
  } catch { status.textContent = 'Camera access was not available. Allow it in browser settings, or use the scan field.'; }
}

function stopCamera(): void {
  cancelAnimationFrame(cameraFrame); cameraStream?.getTracks().forEach((track) => track.stop()); cameraStream = undefined;
  const dialog = document.querySelector<HTMLDialogElement>('#camera-dialog'); if (dialog?.open) dialog.close();
}

function handleGlobalScanner(event: KeyboardEvent): void {
  if (!activeSession() || activeSession()?.completedAt || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement;
  if (target.matches('input, textarea, select, button, a') || target.closest('dialog')) {
    if (event.key === '/' && !target.matches('input, textarea')) { event.preventDefault(); document.querySelector<HTMLInputElement>('#scan-input')?.focus(); }
    return;
  }
  if (event.key === '/') { event.preventDefault(); document.querySelector<HTMLInputElement>('#scan-input')?.focus(); return; }
  if (event.key === 'Enter' && scannerBuffer) { event.preventDefault(); const code = scannerBuffer; scannerBuffer = ''; processScan(code, scanQuantity); return; }
  if (event.key.length === 1) { scannerBuffer += event.key; clearTimeout(scannerTimer); scannerTimer = window.setTimeout(() => { scannerBuffer = ''; }, 1000); }
}

async function init(): Promise<void> {
  const token = captureLicense(); license = cachedLicense();
  try { data = await loadData(demoMode); } catch { data = structuredClone(EMPTY_DATA); }
  if (demoMode && !data.products.length) { data = sampleData(); await persist(); }
  render();
  if (token) { license = await verifyLicense(token); render(); announce(license.valid ? 'Purchase restored. Bench unlocked.' : 'License could not be verified.'); }
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            const toast = document.querySelector<HTMLElement>('#update-toast');
            if (toast) toast.hidden = false;
          }
        });
      });
    }).catch(() => undefined);
  }
}

history.scrollRestoration = 'manual';
addEventListener('scroll', () => history.replaceState({ ...(history.state || {}), scrollX, scrollY } satisfies RouteHistoryState, ''), { passive: true });
addEventListener('popstate', (event) => {
  const state = (event.state || {}) as RouteHistoryState;
  completeRouteChange(state.scrollX, state.scrollY);
});
addEventListener('online', () => { online = true; render(); });
addEventListener('offline', () => { online = false; render(); });
addEventListener('keydown', handleGlobalScanner);
init();
