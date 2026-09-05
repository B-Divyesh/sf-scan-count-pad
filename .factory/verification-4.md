# Count stock at the shelf — independent verification 4

**Verdict: PASS**

- Work order: `scan-count-pad-verify-4`
- Job: count stock at the shelf.
- Audience: small shops using phones or Bluetooth scanners.
- First action before scrolling: **Try it with sample data**.
- Findings: **0** (high 0, medium 0, low 0)
- Untested public claims: **0**
- Implementation candidate: `cfb1a0f47bd836b61a4f577c8abede23df1a0857`
- Documentation baseline reviewed: `e0e4141896dc7b4a3f25b1252ca08cb30f6eafb3`
- Live URL: <https://scan-count-pad.sociobot.in>
- Verified: 2026-09-05 UTC

The commits after the implementation candidate change tests and reports only. They do not change `src/`, `public/`, or the built product. All 23 served build files match the clean candidate build byte for byte.

## First screen and sample data

Fresh 1440×900 desktop and 390×844 phone contexts opened at scroll position zero. Both showed the job **Count stock at the shelf**, the audience sentence **For small shops counting stock at the shelf with a phone or Bluetooth scanner**, and **Try it with sample data** before scrolling. The action ended at y=556 on desktop and y=524 on the 844 px phone screen. Both views had one `h1`, one `main`, `lang="en"`, one labelled primary navigation, no horizontal overflow, and no console or page errors.

The first action opens `/demo` in one click. The first populated screen showed `Friday bay A sample`, four products, counts of 118, 18, and 34, and unresolved code `8901999`. The persistent banner said `Demo — sample data, nothing is saved to your real counts` and exposed **Reset demo** and **Start for real**.

Isolation was tested after creating a separate real catalog and count. The sample Brass bolts count changed from 118 to 119. **Reset demo** restored 118. **Start for real** returned to the real count, which remained 1. The browser contained separate `demo:scan-count-pad` and `scan-count-pad` databases, and ordinary demo traffic used only the product origin.

## Clean checkout and claim commands

A fresh GitHub checkout at documentation baseline `e0e4141` was installed with Node 22.23.2 and npm 10.9.8. The checkout stayed clean. The documented gates passed:

```text
npm ci                       PASS, 0 vulnerabilities
npm audit --audit-level=low  PASS, 0 vulnerabilities
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS, 15 unit/config + 22 browser tests
npm run build                PASS, dist/ produced
```

The build contains 36,614 bytes of JavaScript (12.29 KB gzip), 18,728 bytes of CSS (4.93 KB gzip), and a 43,072-byte hero image. These are inside the static product budgets.

Every declared claim command ran separately from the clean checkout:

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

Each of the 13 claim IDs occurs in one test definition. The live landing page, app states, README, Privacy, Terms, manifest, demo document, and claim list were compared. No missing, false, incomplete, or untested public claim was found.

## Normal, invalid, boundary, and recovery paths

The independent workflow harness passed 56 assertions with no browser error. It covered malformed quoted CSV, negative expected stock, duplicate identifiers, valid quoted fields, manual input, scanner-as-keyboard input, direct edits, undo, reload persistence, search empty state, unknown accumulation, match/add/ignore recovery, finish blocking, finish and export, formula-safe CSV, backup export, invalid backup rejection, restore, free-session replacement confirmation, license dialog focus return, unsupported-camera recovery, and offline Privacy.

Quantity 9999 was accepted. Quantities 10000 and 1.5 were rejected without changing the count. Duplicate SKU recovery showed a visible error, set the field invalid, moved focus to it, and announced the correction.

The scale run imported and counted 100 products, created and resolved 5 of 5 unknowns, and exported 100 rows in 8.696 seconds without errors. This is workflow evidence, not a human speed claim. Camera instrumentation recorded one request after activation, one applied read, a closed dialog, and an ended media track.

## Routes, keyboard, accessibility, and privacy

Root, Demo, Privacy, Terms, and the designed unknown route were checked on desktop and phone. Root, Demo, Privacy, and Terms returned 200. The unknown route deliberately returned HTTP 404 with `Page not found — Scan Count Pad`; this is the expected result, not a defect. Each route had its distinct title, one `h1`, one `main`, the shared primary navigation, visible 3 px focus treatment, and keyboard-operable Demo and Privacy links.

Browser Back and Forward restored scroll positions of y=1047 on desktop and y=873 on phone. Both focused the destination `h1` and announced its route title. All exposed phone controls tested at least 44 px. At 200% text size the first action remained available without horizontal overflow. Reduced motion shortened transitions and animations to effectively zero and changed smooth scrolling to `auto`.

Playwright Axe found zero violations across ten live route/device states, two separate first-screen scans, and six additional workflow states. The factory URL check loaded the root in 887 ms with no console errors and passed title, language, one heading, main landmark, alt text, and button labels.

Ordinary landing, count, camera, and demo flows contacted only the product origin. The only allowed cross-origin product request is explicit license verification at `api.sociobot.in`. The license test removed the token from the address bar, stored it under the product-specific key, verified it through Sociobot, cached the verdict, and showed rate-limit recovery text. There are no analytics, third-party fonts, or third-party scripts.

## PWA, network policy, and performance

Chromium reported no manifest or installability errors. Cache `scan-count-pad-v10` contained the app shell and hashed assets. A forced update produced `updatefound` and displayed the update notice. Root and Privacy reloaded offline, retained saved state, and showed the Offline status.

Live responses include CSP with `frame-ancestors 'none'`, camera-only Permissions Policy, HSTS, `X-Content-Type-Options: nosniff`, strict referrer policy, and `X-Frame-Options: DENY`. Hashed JavaScript and CSS use one-year immutable caching. `sw.js` uses no-store caching. The manifest MIME is `application/manifest+json`. HTTP redirects to HTTPS with 301.

A normal invalid-license request returned 200 JSON, exact-origin CORS, and `Cache-Control: no-store`. In a fresh burst, request 31 was the first 429 and included `Retry-After: 3`. The buy link returned the expected 303 to Sociobot's hosted checkout. No purchase was attempted.

Lighthouse mobile completed successfully:

| Category or metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.0 s |
| Largest Contentful Paint | 1.2 s |
| Total Blocking Time | 100 ms |
| Cumulative Layout Shift | 0 |

## Candidate match and earlier findings

The clean build and live HTTPS responses matched byte for byte for all 23 public files. `staticwebapp.config.json` is deployment policy and is correctly not served. The designed unknown route body matched `404.html`.

| Earlier item | Current disposition |
| --- | --- |
| R2-01 missing header navigation | Resolved. Every live route, including the 404, has one labelled primary navigation with keyboard-operable Demo and Privacy links on desktop and phone. |
| R1-01 Back/Forward focus and announcement | Resolved. Clean regression tests pass; live desktop and phone restore scroll, focus the destination heading, and announce the title in both directions. |
| V-01 license rate limit | Resolved. The first fresh-burst 429 was request 31 and included `Retry-After: 3`. |
| V-02 CSV formula injection | Resolved. The claim test passes for `=`, `+`, `-`, and `@`; the independent CSV contained neutralized formula-leading text. |
| V-03 duplicate SKU recovery | Resolved. The error is visible and announced, the field is invalid, and focus moves to it. |
| V-04 scanner quantity bounds | Resolved. The keyboard-wedge path accepts 9999 and rejects 10000 and 1.5 without mutation. |
| V-05 immutable asset caching | Resolved. Live hashed JavaScript and CSS return one-year immutable caching. |
| V-06 headers and manifest MIME | Resolved. Required security headers and `application/manifest+json` are present. |

The prior handoff's expanded implementation hash was inaccurate. Git resolves the assigned candidate `cfb1a0f` to `cfb1a0f47bd836b61a4f577c8abede23df1a0857`; this report records that exact commit. The short SHA, product code, and live artifact are consistent.

## Field limits

Physical Bluetooth hardware and field phone-camera combinations were unavailable. Their keyboard-wedge and instrumented camera paths passed. The brief's 40%-faster target still needs a timed human shop-floor comparison. It is not a public performance claim. These are field-validation limits, not findings or untested public claims.

This is a static local-first PWA. It has no product backend, server tenant, health endpoint, SQLite service, or restart-persistence boundary. Backend-only checks do not apply. CSV import/export already covers the useful adjacent step in the brief; AI and online sync would not improve this narrow local job.

**Final result: PASS — 0 findings and 0 untested claims.**
