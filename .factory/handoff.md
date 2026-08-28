# Scan Count Pad — build handoff

Work order: `scan-count-pad-build-1`
Completed: 2026-08-28

## Shipped

- Vite + TypeScript offline PWA with install manifest, 192/512/maskable icons, versioned service-worker cache, offline fallback, and update notification.
- Validated CSV catalog import with duplicate detection and actionable row errors.
- Named local count sessions stored in IndexedDB; state survives reload, tab close, and installation.
- Bluetooth scanner / keyboard capture, explicit scan quantity, direct set/±1 controls, last-scan feedback, and undo.
- Browser-native camera barcode scan where `BarcodeDetector` is available. Permission is requested only after “Use camera”; tracks stop on read or close; frames never leave the device.
- Human reconciliation queue for unknown codes: match to a product, add a new item, or explicitly ignore. Unknown codes never alter inventory automatically.
- Completion guard, variance summary, and CSV export that omits untouched products instead of treating them as zero.
- JSON backup and restore for user-owned local data.
- $19 one-time paid unlock through the Sociobot product checkout/verify contract, daily cached verification, URL token capture/cleanup, offline optimistic use of a cached valid verdict, and paste-to-restore. Free mode retains the latest session; the full count and export workflow stays free.
- Direct-build `/privacy/` and `/terms/` pages, no analytics, trackers, runtime CDN assets, or third-party fonts.
- Product-specific surreal editorial art direction and original generated shelf illustration. Provenance, prompt, review, palette, type, spacing, and motion policy are recorded in `.factory/design.md`.

## Verification

Commands run from a clean dependency install:

```sh
npm install
npm test
npm run build
```

Results:

- Unit: 4/4 passed (quoted CSV, malformed CSV, duplicate identifiers, adjustment export).
- Browser: 6/6 passed using Playwright 1.58.2 Chromium.
- Full count flow passed at desktop and 390 × 844 mobile.
- Axe: no serious or critical violations on onboarding, active counting, privacy, or terms paths; the full automated scan also reports no WCAG color-contrast violations on checked pages.
- Offline: production service worker installed, hashed JS/CSS confirmed non-empty in Cache Storage, then the app shell reloaded with the browser context fully offline at desktop and mobile.
- No console or page errors observed during the browser suite.
- `npm audit`: 0 vulnerabilities.
- Production build: initial JS 32.43 KB (11.01 KB gzip), CSS 17.66 KB (4.71 KB gzip), hero WebP 43.1 KB. All are well below the 200/50/300 KB budgets.
- Lighthouse 13.4.1, mobile defaults, local production preview: Performance 99, Accessibility 100, Best Practices 100, SEO 100. FCP 0.9 s, LCP 1.5 s, CLS 0, TBT 130 ms. Lab INP is unavailable without interaction; TBT is below the 200 ms interaction budget.
- `npm run build` reproducibly creates `dist/index.html`, `dist/privacy/index.html`, and `dist/terms/index.html`.

## Known gaps / release notes

- Camera scanning depends on the browser's native `BarcodeDetector`; Chromium-based Android browsers are the intended camera path. Unsupported browsers get a clear fallback to manual or Bluetooth scanning. Physical camera permission and scanner hardware were not available in the container; lifecycle behavior is implemented but not device-lab tested.
- The factory still needs to register the paid product/return URL. The code intentionally uses the slug endpoint and contains no provider or product ID. Checkout and live license verification were not exercised against an unregistered production product.
- Performance figures are lab results on the onboarding page, not field data from a real 100-SKU pilot. The success measure should be validated with an actual shop count after deployment.

## Next steps

1. Register `scan-count-pad` with the Sociobot billing factory and confirm the production return URL.
2. Test one common Bluetooth scanner and camera scanning on an Android phone in the pilot shop.
3. Run the 100-SKU timing pilot and use the local session/export workflow to measure unknown-resolution rate.
