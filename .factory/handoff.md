# Scan Count Pad — repair handoff

**Status: PASS**

- Work order: `scan-count-pad-repair-1`
- Repaired baseline report: `a2a66dccdb940a44b85ffe3fee3764241b4df8b6`
- Repaired candidate: `41f6bf2a7c2e20e4c0138a9d818eddbb212bb16a`
- Live URL: <https://scan-count-pad.sociobot.in>
- Demo URL: <https://scan-count-pad.sociobot.in/demo>
- Verified: 2026-08-28 UTC
- Original independent report: [verification.md](verification.md)

## Findings repaired

1. **V-01 — license verification rate limit:** the shared Sociobot endpoint now returns `429` on a burst and includes `Retry-After`. Reverification reached the first `429` on request 31 with `Retry-After: 3`. The PWA now also throttles same-browser attempts, honors server `Retry-After`, keeps the free experience available, and shows a visible retry message. A normal invalid response remains `200`, `Cache-Control: no-store`, exact-origin CORS, and `{"valid":false,"reason":"invalid"}`.
2. **V-02 — CSV formula injection:** SKU, barcode, and product-name cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return receive an apostrophe before CSV quoting. Numeric adjustment cells remain numeric. Unit coverage exercises every formula prefix and negative adjustments.
3. **V-03 — invisible duplicate SKU recovery:** the new-item dialog now shows a specific visible error, associates it through `aria-describedby`, sets `aria-invalid`, focuses the SKU field, announces the same message, and clears the state as the operator edits.
4. **V-04 — scanner quantity bypass:** validation now lives at the shared scan operation boundary. Manual entry, keyboard-wedge scanners, and camera reads accept only safe integers from 1 through 9999. Values `10000` and `1.5` show an associated visible error and do not mutate count data.
5. **V-05 — hashed asset caching:** live hashed JS and CSS now return `Cache-Control: public, max-age=31536000, immutable`. `sw.js` returns `no-cache, no-store, must-revalidate`.
6. **V-06 — response hardening and manifest MIME:** live responses now include a restrictive CSP with `frame-ancestors 'none'`, Permissions Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict referrer policy, and one-year HSTS with subdomains and preload. The manifest returns `application/manifest+json`.

## Product additions required by the repair contract

- Added the one-click `/demo` sandbox with four products, an active sample count, reset/start-real controls, and a separate `demo:scan-count-pad` IndexedDB namespace.
- Added [claims.json](claims.json) with one uniquely tagged regression for each visitor-facing claim.
- Added [demo.md](demo.md), [copy-audit.md](copy-audit.md), canonical/social metadata, an original-art social crop, sitemap, and a designed 404.
- Added ESLint and explicit lint/typecheck scripts.
- Preserved the PWA/static deployment class, free complete count/export workflow, local-first storage, visual thesis, privacy model, and paid Sociobot license path.

## Clean local verification

Run from a clean dependency install:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

Results:

- Audit: 0 vulnerabilities.
- Lint and TypeScript: passed.
- Unit/config tests: 15 passed.
- Playwright: 18 passed across desktop Chromium and 390×844 mobile.
- Axe: zero serious/critical findings; the independent six-state scan found zero violations of any impact.
- Factory independent harness: 53 assertions passed with no console or page errors.
- Scale harness: 100 products counted, 5/5 unknowns resolved, 100 export rows, 17.022 seconds automation time, no errors.
- Camera harness: one permission request after activation, detected count applied once, dialog closed, track state `ended`.
- Factory URL verifier: title, `lang`, one `h1`, one `main`, alt text, labeled buttons, and console checks passed.
- Bundle: JS 36,230 bytes (12.18 KB gzip); CSS 18,288 bytes (4.85 KB gzip); hero WebP 43,072 bytes.
- Local Lighthouse mobile: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.5 s, TBT 120 ms, CLS 0.
- Live Lighthouse mobile: 94 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; FCP 1.0 s, LCP 1.1 s, TBT 280 ms, CLS 0, 68 KiB transfer.

## Live deployment evidence

Deployment completed through:

```sh
/opt/fleet/lib/deploy-static.sh scan-count-pad dist
```

Azure deployment ID: `b86d5620-15c0-4de4-ba29-534fb4ac9fef`.

- All 23 publicly served build artifacts matched local bytes. Azure intentionally does not expose `staticwebapp.config.json`.
- Representative SHA-256:
  - `index.html`: `3006ffcd55fa107d689ea9db9995bba17e9b5f3c4d80dfba52f5f390bbf7fa4b`
  - JS: `58f1081f12285c25f8ee6da62f85e903a3cb087c33ed39c949287e12694e262e`
  - CSS: `5c4e33c52fb4e26d76a9bfb019fdea0aaf3d57a0df15a8741318bb0dca67ad1c`
  - service worker: `889186ddbac54cbe717113e21a8881bc5cbec601a03f19ef9f99962cd29594fa`
- `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown route returns the designed 404 with status 404.
- Manifest parse/installability errors: zero. Live cache `scan-count-pad-v5` contains the application shell and hashed assets.
- Forced update found the new worker and displayed the update toast.
- Offline root and privacy reloads passed. The tagged demo regression also preserves changed sample counts offline.
- Live 390px onboarding and active-count checks found no overflow or sub-44px exposed targets.
- Ordinary workflows contacted only their own origin. Camera frames produced no upload request.
- Checkout redirects to the Sociobot/Dodo hosted session. No purchase was completed.

## Known limits

- The brief's “40% faster” success measure still needs a timed human shop-floor pilot; automation is not a substitute.
- Physical Bluetooth scanner hardware was unavailable. Its keyboard-wedge contract was covered on desktop and 390px mobile.
- Camera coverage used Chromium's fake device and an instrumented detector; real device/browser combinations still merit field testing.
