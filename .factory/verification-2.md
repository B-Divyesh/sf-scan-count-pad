# Scan Count Pad — independent verification 2

**Verdict: PASS**

- Work order: `scan-count-pad-verify-2`
- Implementation candidate: `41f6bf2a7c2e20e4c0138a9d818eddbb212bb16a` (`fix: remove duplicate static route`)
- Documentation commit reviewed: `fa7f5ff6fd5f00b059ba2099f56b78f425859c93` (`docs: record repair verification and deployment`)
- Live URL: <https://scan-count-pad.sociobot.in>
- Demo URL: <https://scan-count-pad.sociobot.in/demo>
- Verified: 2026-09-05 UTC
- Findings: **0** (high 0, medium 0, low 0)
- Untested public claims: **0**

## First screen and demo

Fresh desktop and 390 px phone browser contexts opened the landing page before scrolling. The job is **counting shelf stock**; the audience is **small shops using a phone or Bluetooth scanner**; the first action is **Try it with sample data**. The title was `Scan Count Pad — offline shelf counts`, with one `h1`, one `main`, and `lang="en"`. The 390 px page had no horizontal overflow and no console or page errors.

The first action opens `/demo`. It immediately showed the realistic `Friday bay A sample` active count, four product rows, one unresolved code, and the persistent `Demo — sample data, nothing is saved to your real counts` banner with **Reset demo** and **Start for real**. A fresh `/demo` context opened only IndexedDB `demo:scan-count-pad`, not `scan-count-pad`. Scanning Brass bolts changed its count from 118 to 119; Reset demo restored 118. Ordinary live demo traffic used only `https://scan-count-pad.sociobot.in`.

## Claims and clean checkout

A clean, isolated clone at `fa7f5ff` was installed with `npm ci`. These commands passed:

```sh
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

The audit reported zero vulnerabilities. Lint and type checking passed. `npm test` passed 15 unit/config tests and 18 Playwright tests. The build produced `dist/`.

Every command declared in `.factory/claims.json` was run from that clone and passed: offline reload, CSV export, formula-safe export, scanner input, data persistence, unknown reconciliation, validated quantity, demo isolation, local data, camera-local handling, license unlock, paid price, and backup restore. Therefore all 13 public claims had their required tagged evidence.

The independent harness added 53 passing assertions across normal, invalid, boundary, and recovery paths. It covered malformed and duplicate CSV rejection, count/undo, quantity 9999 acceptance and 10000/1.5 rejection on the keyboard-wedge path, unknown reconciliation, duplicate-SKU visible recovery, completion/export/backup restore, keyboard skip link and focus ring, mobile target sizing, privacy traffic, and the update toast. The 100-SKU simulation counted 100 products, resolved 5/5 unknowns, exported 100 rows, and recorded no errors. Camera instrumentation made one permission request only after activation, applied one read, closed the dialog, and ended the media track.

## Accessibility, routes, privacy, and PWA

`verify-url.sh` passed for the live root: load 821 ms, no browser errors, descriptive title, `lang`, one `h1`, one `main`, no images missing `alt`, and no unlabeled buttons. Playwright axe ran on six local/live desktop and mobile states with zero violations; a separate live root axe scan also returned zero violations, including zero serious/critical issues. The standalone axe CLI could not start because its downloaded ChromeDriver only supports Chrome 152 while the preinstalled Playwright Chromium is 145; this is a verifier-tool version mismatch, not an unrun accessibility check, because the repository's Playwright axe integration completed successfully.

The live browser confirmed:

- `/privacy` — HTTP 200, title `Privacy — Scan Count Pad`, one `h1` and `main`.
- `/terms` — HTTP 200, title `Terms — Scan Count Pad`, one `h1` and `main`.
- `/not-a-real-route` — deliberate HTTP 404 with the designed `Page not found — Scan Count Pad` page, one `h1` and `main`.

Fresh PWA evidence found valid manifest/installability results, cache `scan-count-pad-v5`, a successful update discovery and visible update toast, and an offline reload that retained the sample screen and demo banner. Privacy and terms also loaded from cache in the PWA harness. Local data stayed in IndexedDB; no analytics, CDN fonts, or ordinary outbound requests were observed. Camera frames were not uploaded.

## Deployment and prior findings

The clean candidate build was compared byte-for-byte with production: all 23 public artifacts matched. Representative SHA-256 values were `3006ffcd55fa107d689ea9db9995bba17e9b5f3c4d80dfba52f5f390bbf7fa4b` for `index.html`, `58f1081f12285c25f8ee6da62f85e903a3cb087c33ed39c949287e12694e262e` for the JS bundle, `5c4e33c52fb4e26d76a9bfb019fdea0aaf3d57a0df15a8741318bb0dca67ad1c` for CSS, and `889186ddbac54cbe717113e21a8881bc5cbec601a03f19ef9f99962cd29594fa` for `sw.js`.

Live hashed JS/CSS responses use `Cache-Control: public, max-age=31536000, immutable`; `sw.js` uses `no-cache, no-store, must-revalidate`; the manifest has `application/manifest+json`. Responses include CSP with `frame-ancestors 'none'`, `Permissions-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict referrer policy, and one-year preload HSTS.

All prior findings are resolved:

| Prior item | Current independent evidence |
| --- | --- |
| V-01 rate limit | Sequential invalid-license checks first returned `429` at request 31 with `Retry-After: 3`. A normal invalid check returned 200 JSON, exact-origin CORS, and `Cache-Control: no-store`. |
| V-02 CSV injection | Tagged formula-safe export unit claim passed for `=`, `+`, `-`, and `@` prefixes. |
| V-03 duplicate SKU recovery | Independent recovery flow showed the visible, focused, invalid SKU error. |
| V-04 scanner quantity bounds | Independent keyboard-wedge checks rejected 10000 and 1.5 without changing counts; 9999 succeeded. |
| V-05 asset caching | Live hashed asset headers are one-year immutable. |
| V-06 response headers and manifest MIME | Live CSP/frame protection/permissions/HSTS and `application/manifest+json` were present. |

The checkout endpoint returned its expected 303 to Sociobot's hosted Dodo checkout. No purchase was attempted. This static PWA has no product-owned backend, tenant database, health endpoint, or server-side restart persistence to test.

## Limits

The brief's 40% faster target still needs a real shop-floor comparison with a human operator. The automation's 100-SKU result and keyboard-wedge simulation do not substitute for physical Bluetooth scanner and field-camera coverage.
