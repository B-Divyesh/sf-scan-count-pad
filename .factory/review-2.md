# Count stock at the shelf — review 2

**Verdict: FAIL**

- Work order: `scan-count-pad-review-2`
- Job: count stock at the shelf.
- Audience: small shops using phones or Bluetooth scanners.
- First action before scrolling: **Try it with sample data**.
- Findings: **1** (high 0, medium 1, low 0)
- Untested public claims: **0**
- Implementation candidate: `8a8b8a15bffbe0bb260d02a5e4cd5fcb736dc168`
- Documentation commit reviewed: `8da5ae125ebba2c33cca400f39d26a5ac4ecbb90`
- Live URL: <https://scan-count-pad.sociobot.in>
- Reviewed: 2026-09-05 UTC

The product works for the shelf-count job and every declared public claim passed. It does not pass this strict review because the required navigation landmark and header navigation are absent on every page.

## Finding

### Medium — R2-01: Every page lacks a navigation landmark and header navigation

The live root, Demo, Privacy, Terms, and designed 404 pages each have `0` `nav` elements. The common header contains the wordmark, the offline-ready status, and **Unlock**, but no navigation links. Privacy and Terms are available only in the footer; Demo is reachable from the first-screen action but not from the header.

This violates the accessibility contract's required `header/nav/main/footer` landmarks and the site-structure contract requiring the consistent header navigation. Screen-reader landmark navigation cannot jump to site navigation, and a visitor already in a count has no header path to Demo or Privacy.

Reproduction:

1. Open <https://scan-count-pad.sociobot.in>, `/privacy`, `/terms`, or an unknown route in a fresh browser.
2. Inspect landmarks with `document.querySelectorAll('nav').length`.
3. Each result is `0`.

Add a semantic `<nav aria-label="Primary">` to the shared header. Keep the wordmark home link and expose the appropriate header links, including Demo and Privacy, with the existing visible focus treatment. Retest desktop, phone, keyboard traversal, and the 404 page.

## Fresh phone and desktop check

Fresh 1440×900 desktop and 390×844 phone contexts opened the live root at scroll position zero. Both showed, before scrolling:

- Job: **Count stock at the shelf.**
- Audience: **For small shops counting stock at the shelf with a phone or Bluetooth scanner.**
- First action: **Try it with sample data**, a 48 px-high target at y=508 desktop and y=476 phone.

Both had `lang="en"`, one `h1`, one `main`, no horizontal overflow, and no console or page errors. The first-screen action opened `/demo` in one click.

The live demo immediately showed the `Friday bay A sample` session, four products, counts of 118 brass bolts, 18 paper tape, and 34 shipping boxes, plus unresolved code `8901999`. The persistent label read `Demo — sample data, nothing is saved to your real counts` and contained **Reset demo** and **Start for real**.

After a sample brass-bolt scan changed 118 to 119, **Reset demo** restored 118. A separately imported real session was counted to 1, the demo was reopened and changed, and **Start for real** returned to the real session still at 1. IndexedDB contained separate `demo:scan-count-pad` and `scan-count-pad` databases. No console or page error occurred.

## Clean checkout and public claims

A new GitHub clone at documentation commit `8da5ae1` was clean before and after verification. `8da5ae1` differs from implementation candidate `8a8b8a1` only in factory reports and handoff documentation, so the built product under review is the stated implementation candidate.

The documented clean setup passed:

```text
npm ci                       PASS, 0 vulnerabilities
npm audit --audit-level=low  PASS, 0 vulnerabilities
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS, 15 unit/config + 20 browser tests
npm run build                PASS, dist/ produced
```

The production build contains 36,467 bytes JavaScript (12.26 KB gzip), 18,288 bytes CSS (4.85 KB gzip), and a 43,072-byte hero WebP.

Every command in `.factory/claims.json` ran separately and passed:

| Claim | Exact declared command | Result |
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

Each of the 13 IDs appears in one test definition. Cross-checking the live landing copy, app copy, README, Privacy, Terms, manifest, and claims list found no unlisted public claim. Untested public claims: **0**.

## Workflow, recovery, accessibility, privacy, and PWA

- The independent production-build harness passed 53 assertions with no console or page error. It covered malformed and duplicate CSV recovery, negative expected stock, manual and keyboard-wedge scanning, 9999, rejection of 10000 and 1.5 without mutation, direct edits, increments, search empty state, undo, unknown reconciliation and cancellation, add-as-new recovery, completion, CSV formula protection, backup export/restore, free-session replacement, camera fallback, keyboard focus, reduced motion, and offline Privacy.
- The scale harness imported and counted 100 products, resolved 5 of 5 unknowns, and exported 100 rows in 8.914 seconds of automation. This is workflow evidence, not the brief's human speed claim.
- The camera harness made one on-demand request, applied one code, closed the dialog, and left the media track `ended`.
- Bundled Playwright axe checks found zero violations at local onboarding, active count, completed summary, offline Privacy, live 390 px onboarding, and live 390 px active count. The required standalone Axe CLI could not start its Selenium Chrome binary in this container; this was a tool-environment error, not a product result. The repository's Playwright Axe integration supplied the accessibility evidence.
- The factory URL check passed at 746 ms with no browser errors, title, language, one heading, main landmark, alt text, and button labels. Its basic landmark check does not assert a `nav`; the manual landmark inspection found R2-01.
- The prior verified Lighthouse 100/100/100/100 result remains applicable because representative live `index.html`, JavaScript, CSS, service worker, and manifest bytes match the clean candidate. A fresh Lighthouse CLI run could not maintain a CDP connection to the supplied Chrome-for-Testing binary, so no new Lighthouse score is claimed.
- Privacy and Terms return 200 with route-specific titles, one `h1`, and one `main`. Back and Forward restored the saved desktop and phone scroll positions, focused the destination `h1`, and announced the title. The unknown route deliberately returns HTTP 404 and shows the designed page with a working **Back to the counting pad** link; its expected failed-resource console message is not a defect.
- Root, Demo, Privacy, Terms, and 404 links were crawled. Same-origin links returned 200, mail links were explicit, and the checkout returned the expected 303 to Sociobot hosted checkout. No purchase was attempted.
- Ordinary local and live count flows made only same-origin requests. There are no analytics, third-party fonts, or third-party scripts. The license test uses the stated Sociobot endpoint only.
- The live PWA has no manifest or installability errors. Cache `scan-count-pad-v9` contains the shell and assets; forced service-worker update showed `updatefound` and the update toast; root and Privacy reloaded offline with the Offline indicator. The manifest is served correctly.
- Live immutable assets use one-year caching. CSP, `frame-ancestors 'none'`, camera-only Permissions Policy, HSTS, nosniff, strict referrer policy, and X-Frame-Options are present.
- A normal invalid license response used `Cache-Control: no-store`. A fresh sequential burst returned its first 429 on request 31 with `Retry-After: 4`, satisfying the rate-limit check.

This is a static local-first PWA. It has no product backend, tenant database, health endpoint, server restart boundary, or SQLite service, so backend-only tenant, health, and restart checks do not apply.

## Candidate parity

Representative clean-build and live response SHA-256 hashes match exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `70295496eb037a8afcb2f5a0ac303233ba5089475071b21345361997d79224ef` |
| `assets/main-DtLeghhT.js` | `7ce6615f2e53ca63eeb74dcb7bdc23c06c170be20367f282d40a58c58d2d3ee5` |
| `assets/main-DovrGf69.css` | `5c4e33c52fb4e26d76a9bfb019fdea0aaf3d57a0df15a8741318bb0dca67ad1c` |
| `sw.js` | `8fd12aeb781e7bf534f1c55b7aee6f4be9625eaa7a22e7fc0df96d246aa4abcf` |
| `manifest.webmanifest` | `f3f92225ee0fdfbaadcfdb18f0f333002af5ab4b594ebdb10eebc3e3e9b39db0` |

## Earlier finding disposition

| Earlier item | Current evidence |
| --- | --- |
| R1-01 Back/Forward focus and announcement | Resolved. Desktop and phone Back and Forward focused the destination heading and announced the route title; desktop restored y=1047 and phone restored y=873. |
| V-01 license rate limit | Resolved. Fresh burst first returned 429 at request 31 with `Retry-After: 4`. |
| V-02 CSV formula injection | Resolved. The dedicated tagged unit claim passed and the independent exported CSV confirmed neutralized formula-leading text. |
| V-03 duplicate SKU recovery | Resolved. The independent harness confirmed visible error, invalid state, focus, and announcement. |
| V-04 scanner quantity bounds | Resolved. 9999 worked; 10000 and 1.5 were rejected without count mutation. |
| V-05 immutable asset caching | Resolved. Hashed live JavaScript and CSS use one-year immutable caching. |
| V-06 headers and manifest MIME | Resolved. Required security headers and manifest MIME are present. |

## Remaining field validation

Physical Bluetooth scanner hardware and field phone-camera combinations were unavailable. Their keyboard-wedge and instrumented browser paths passed. The brief's 40%-faster target still needs a timed human shop-floor comparison. These are field-validation limits, not untested public claims.

**Final result: FAIL — 1 medium finding and 0 untested public claims.**
