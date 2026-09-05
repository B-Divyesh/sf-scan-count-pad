# Count stock at the shelf — independent verification 3

**Verdict: PASS**

- Work order: `scan-count-pad-verify-3`
- Job: count stock at the shelf.
- Audience: small shops using phones or Bluetooth scanners.
- First action before scrolling: **Try it with sample data**.
- Findings: **0** (high 0, medium 0, low 0)
- Untested public claims: **0**
- Implementation candidate: `8a8b8a15bffbe0bb260d02a5e4cd5fcb736dc168`
- Documentation commit reviewed: `822fe343c2414ca5f3af1e3cfa4068b2f9015dc6`
- Live URL: <https://scan-count-pad.sociobot.in>
- Verified: 2026-09-05 22:42 UTC
- Environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2 Chromium, Lighthouse 13.4.1

The later documentation commit changes only `.factory/handoff.md`; the deployed product code is the stated implementation candidate. The live deployment matches that candidate.

## Fresh phone and desktop check

Fresh 1440×900 desktop and 390×844 phone contexts opened the live root before any scrolling. Both showed the same job, audience, and first action above the fold. The action occupied a 48 px-high target at y=508 on desktop and y=476 on the phone. Both layouts had one `h1`, one `main`, `lang="en"`, no horizontal overflow, and no unexpected browser errors.

The first action opened `/demo` in one click. The page immediately showed the realistic `Friday bay A sample`, four products, three populated counts (`118`, `18`, and `34`), and unresolved code `8901999`. The persistent banner said `Demo — sample data, nothing is saved to your real counts` and provided **Reset demo** and **Start for real**.

Isolation was tested after creating a separate real catalog and count. Brass bolts changed from 118 to 119 in the demo, Reset demo returned it to 118, and Start for real returned to the real count of 1. The demo object store then contained zero records; the real count remained 1. Ordinary landing and demo traffic contacted only `https://scan-count-pad.sociobot.in`.

## Clean checkout and every claim

A fresh clone of `822fe34` was installed with `npm ci`. The checkout was clean before and after verification. Since `822fe34` differs from `8a8b8a1` only in the handoff report, this exercised the implementation candidate.

Quality gates:

```text
npm audit --audit-level=low  PASS, 0 vulnerabilities
npm run lint                PASS
npm run typecheck           PASS
npm test                    PASS, 15 unit/config + 20 browser tests
npm run build               PASS, dist/ produced
```

The build contained 36,467 bytes of JavaScript (12.26 KB gzip), 18,288 bytes of CSS (4.85 KB gzip), and a 43,072-byte hero WebP.

Every command in `.factory/claims.json` was then run separately and passed:

| Claim | Exact command | Result |
| --- | --- | --- |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS, 2 browser projects |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS, 2 browser projects |
| `formula-safe-export` | `npm run test:unit -- --testNamePattern @claim:formula-safe-export` | PASS, 1 tagged unit test |
| `scanner-input` | `npm run test:e2e -- --grep @claim:scanner-input` | PASS, 2 browser projects |
| `data-persistence` | `npm run test:e2e -- --grep @claim:data-persistence` | PASS, 2 browser projects |
| `unknown-reconcile` | `npm run test:e2e -- --grep @claim:unknown-reconcile` | PASS, 2 browser projects |
| `validated-quantity` | `npm run test:e2e -- --grep @claim:validated-quantity` | PASS, 2 browser projects |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | PASS, 2 browser projects |
| `local-data` | `npm run test:e2e -- --grep @claim:local-data` | PASS, 2 browser projects |
| `camera-local` | `npm run test:e2e -- --grep @claim:camera-local --project=chromium` | PASS, 1 browser project |
| `license-unlock` | `npm run test:e2e -- --grep @claim:license-unlock --project=chromium` | PASS, 1 browser project |
| `paid-price` | `npm run test:e2e -- --grep @claim:paid-price --project=chromium` | PASS, 1 browser project |
| `backup-restore` | `npm run test:e2e -- --grep @claim:backup-restore` | PASS, 2 browser projects |

Each of the 13 claim tags occurs in exactly one test definition. A separate cross-check of the live copy, README, Privacy, Terms, manifest, and claim list found no missing, false, incomplete, or untested public claim.

## Workflow, invalid input, boundaries, and recovery

The independent production-build harness passed 53 assertions without a console or page error. It covered malformed CSV, negative expected stock, duplicate identifiers, valid quoted CSV, manual and keyboard-wedge input, quantity 9999, rejection of 10000 and 1.5 without mutation, direct count edits, `+1` and `−1`, search empty state, undo, reload persistence, unknown accumulation, matching, ignore confirmation and cancellation, add-as-new recovery, finish blocking, completion, adjustment CSV, formula-safe cells, backup export, invalid backup rejection, restore, free-session replacement confirmation, unsupported-camera recovery, keyboard focus, and offline Privacy.

The scale harness imported and counted 100 products, created and resolved 5 of 5 unknowns, and exported 100 adjustment rows in 9.327 seconds with no errors. This is automated workflow evidence, not the brief's human speed comparison.

The camera harness recorded no request before activation, one request after activation, one applied barcode, a closed dialog, and an ended media track. No camera frame request left the product origin.

## Routes, accessibility, privacy, and PWA

The repaired route behavior passed on live desktop and phone contexts:

| Viewport | Root scroll before Privacy | Scroll after Back | Focus and announcement |
| --- | ---: | ---: | --- |
| Desktop, 900×400 | 1047 | 1047 | Destination `h1` focused; route title announced after link, Back, and Forward |
| Phone, 390×844 | 873 | 873 | Destination `h1` focused; route title announced after link, Back, and Forward |

Privacy and Terms returned 200 with distinct titles, one `h1`, and one `main`. The unknown route deliberately returned HTTP 404 with the designed `Page not found — Scan Count Pad` page and a working return link. Its expected failed-resource console message was classified as the requested 404, not a defect.

Accessibility evidence:

- Playwright axe reported zero violations across 15 desktop, phone, active-count, completed, offline, demo, legal, and 404 states.
- The factory URL check loaded in 626 ms with no errors and passed title, language, one-heading, main-landmark, alt-text, and button-label checks.
- Keyboard Tab reached the skip link first. Focus used a visible 3 px solid amber ring. Dialog focus return passed in the independent harness.
- Reduced motion produced effectively instant transitions and `scroll-behavior: auto`.
- The phone landing and active count had no undersized exposed controls in the tested control set. At 200% text size, the page retained the first action and had no horizontal overflow.
- Lighthouse mobile scored 100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO. FCP was 1.0 s, LCP 1.2 s, TBT 30 ms, CLS 0, and transfer size 68 KiB.

PWA evidence:

- Chromium reported no manifest or installability errors.
- Cache `scan-count-pad-v9` held the shell and hashed assets.
- A forced service-worker update raised `updatefound` and displayed the update toast.
- Root and Privacy reloaded while the browser context was offline, with saved state retained and the Offline status shown.
- The root, demo, Privacy, Terms, robots, sitemap, and manifest URLs returned their expected successful responses. The manifest MIME was `application/manifest+json`.

Privacy and security evidence:

- Ordinary count and demo flows made only same-origin requests. There were no analytics, CDN fonts, or third-party scripts.
- License capture removed the token from the URL, stored it under the product-specific key, contacted only the Sociobot endpoint, and reused the cached verdict for a day in the claim test.
- A normal invalid-license request returned 200 JSON with exact-origin CORS and `Cache-Control: no-store`.
- After that normal request, the burst's first `429` was request 30 and included `Retry-After: 3`.
- The checkout returned the expected 303 to Sociobot's hosted merchant checkout. No purchase was attempted.
- Live responses included CSP with `frame-ancestors 'none'`, camera-only Permissions Policy, `X-Frame-Options: DENY`, nosniff, strict referrer policy, and one-year preload HSTS.

This is a static, local-first PWA. It has no product backend, server tenant, health endpoint, SQLite service, or restart-persistence boundary, so backend-only checks do not apply. CSV import/export already covers the obvious useful adjacent step; adding AI or sync would not improve this narrow local shelf-count job and is not a missed-leverage finding.

## Live candidate match

All 23 served build artifacts matched the clean candidate build byte for byte. `staticwebapp.config.json` is deployment configuration and is correctly not exposed as a public file. Representative SHA-256 values:

- `index.html`: `70295496eb037a8afcb2f5a0ac303233ba5089475071b21345361997d79224ef`
- JavaScript: `7ce6615f2e53ca63eeb74dcb7bdc23c06c170be20367f282d40a58c58d2d3ee5`
- CSS: `5c4e33c52fb4e26d76a9bfb019fdea0aaf3d57a0df15a8741318bb0dca67ad1c`
- Service worker: `8fd12aeb781e7bf534f1c55b7aee6f4be9625eaa7a22e7fc0df96d246aa4abcf`

Hashed JavaScript and CSS used one-year immutable caching. The service worker used no-store caching. HTTP redirected to HTTPS with 301.

## Earlier finding disposition

| Earlier item | Current independent evidence |
| --- | --- |
| R1-01 Back/Forward focus and announcement | Resolved. Both viewports restored the exact saved scroll positions, focused the new `h1`, and announced the destination on link, Back, and Forward. |
| V-01 license rate limit | Resolved. The first burst `429` was request 30 after one normal probe and included `Retry-After: 3`. |
| V-02 CSV formula injection | Resolved. The dedicated claim passed for `=`, `+`, `-`, and `@`; the independent downloaded CSV contained neutralized formula text. |
| V-03 duplicate SKU recovery | Resolved. The dialog showed a visible error, marked the SKU invalid, moved focus to it, and announced the correction. |
| V-04 scanner quantity bounds | Resolved. The keyboard-wedge path rejected 10000 and 1.5 without mutation and accepted 9999. |
| V-05 immutable asset caching | Resolved. Live hashed JavaScript and CSS returned one-year immutable cache headers. |
| V-06 headers and manifest MIME | Resolved. Live security headers and `application/manifest+json` were present. |

## Remaining field validation

Physical Bluetooth scanner hardware and field phone-camera combinations were unavailable; their keyboard-wedge and instrumented browser paths passed. The brief's 40%-faster target remains a human shop-floor pilot measure and is not claimed in public copy. These are field-validation limits, not product findings or untested public claims.

**Final result: PASS — 0 findings and 0 untested claims.**
