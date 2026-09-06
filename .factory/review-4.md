# Count stock at the shelf — strict review 4

**Verdict: PASS — 0 findings and 0 untested public claims.**

- Work order: `scan-count-pad-review-4`
- Job: count and adjust stock at the shelf.
- Audience: a single-location shop or maker using a phone or Bluetooth scanner.
- First action before scrolling: **Try it with sample data**.
- Implementation candidate: `e2a3f26fff6fe78515d6309bded98b8efa01316f` (`fix: announce session archive availability`)
- Documentation baseline: `e9b7ab7ff00f7664de321ae7f2756ab9b8780020` (`docs: hand off license announcement repair`)
- Prior report commit: `dba5eadf4f2cc62f5dcf6a43d68bc7d6647fb092`
- Live URL: <https://scan-count-pad.sociobot.in>
- Reviewed: 2026-09-06 UTC
- Findings: **0** (high 0, medium 0, low 0)
- Untested public claims: **0**

The implementation SHA is the product code reviewed. Later commits through the assigned base are documentation only. A fresh build of the implementation candidate matched all 23 served live artifacts byte for byte; `staticwebapp.config.json` is deployment policy and is intentionally not public.

## First screen and demo sandbox

Fresh 1440×900 desktop and 390×844 phone contexts opened the live root at scroll position zero. Both showed **Count stock at the shelf**, **For small shops counting stock at the shelf with a phone or Bluetooth scanner**, and **Try it with sample data** before scrolling. The action ended at y=556 on desktop and y=524 on the phone. Neither view had horizontal overflow, console errors, or page errors.

The one-click action opened `/demo` on both devices. It immediately showed the realistic `Friday bay A sample`, four products, three populated counts, and one unresolved barcode. The persistent banner read **Demo — sample data, nothing is saved to your real counts** and provided **Reset demo** and **Start for real**.

Brass bolts started at 118, reached 119 after a scan, and returned to 118 after reset. A stronger live isolation flow first created a real two-item catalog and recorded Brass bolts at 1. Demo changes and reset did not change that real count. **Start for real** cleared the demo database record and returned to the real count at 1. The whole ordinary flow contacted only `https://scan-count-pad.sociobot.in`.

Screenshots are under `/work/.evidence/scan-count-pad-review-4/`.

## Clean checkout, gates, and public claims

A fresh GitHub checkout was detached at the exact implementation candidate. Documented prerequisites were installed with `npm ci` before measurement. These gates passed:

```text
npm ci                         PASS, 141 packages installed
npm audit --audit-level=low    PASS, 0 vulnerabilities
npm run lint                   PASS
npm run typecheck              PASS
npm test                       PASS, 15 unit/config and 22 browser tests
npm run build                  PASS, dist/ produced
```

The production build contains 36.63 kB JavaScript (12.30 kB gzip), 18.73 kB CSS (4.93 kB gzip), and a 43.07 kB hero image. These remain inside the static-product budgets.

Every command declared in `.factory/claims.json` was run separately and passed:

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

Each of the 13 claim IDs occurs in exactly one test definition. The live landing page, application states, README, Privacy, Terms, manifest, demo document, and claim list were cross-checked. No missing, false, incomplete, unlisted, or untested public claim was found.

## Normal, invalid, boundary, and recovery paths

The independent workflow harness passed 56 assertions with no browser error. It covered valid and malformed quoted CSV, negative expected stock, duplicate identifiers, manual and keyboard-wedge input, direct count edits, undo, reload persistence, search empty state, unknown accumulation, match/add/ignore recovery, finish blocking, completion, adjustment export, formula-safe CSV, backup export and restore, invalid backup rejection, free-session replacement confirmation, license-dialog focus return, unsupported-camera recovery, offline Privacy, and update feedback.

Quantity 9999 was accepted. Quantities 10000 and 1.5 were rejected without changing a count. Duplicate-SKU recovery showed a visible error, marked the field invalid, moved focus to it, and announced the correction.

The scale run imported and counted 100 products, created and resolved 5 of 5 unknown codes, and exported 100 adjustment rows in 7.840 seconds without an error. This is automation evidence, not a human speed claim. Instrumented camera testing recorded no request before activation, one camera request after activation, one applied read, a closed dialog, and an ended media track.

## Accessibility, routes, privacy, and links

Root, Demo, Privacy, Terms, and the unknown route were checked live. Root, Demo, Privacy, and Terms returned 200. The unknown route deliberately returned HTTP 404 with the designed `Page not found — Scan Count Pad` page and a working return path; this expected 404 is not a defect. Every page had its distinct title, one `h1`, one `main`, and labelled Primary navigation.

Playwright Axe found zero serious or critical violations across the live route set and the desktop/mobile workflow states. The factory URL check loaded the root in 690 ms with no console errors and confirmed `lang="en"`, title, one heading, a main landmark, image alternatives, and labelled buttons. Keyboard checks covered the skip link, visible 3 px focus treatment, scanner focus, dialogs, all controls, and browser Back/Forward focus and announcements. All measured phone targets were at least 44 px. A 200% desktop page-zoom check retained every control without horizontal overflow. Reduced motion shortened transitions and animation to effectively zero and changed smooth scrolling to `auto`.

Every discovered internal link returned 200 except the deliberate 404 page's self-targeting skip link, which correctly stayed 404. Both mail links were valid `mailto:` targets. The purchase link returned the expected 303 to hosted checkout; no purchase was attempted.

Ordinary landing, count, camera, and demo flows contacted only the product origin. License verification was the only product request to `api.sociobot.in`. There were no analytics, third-party fonts, or third-party scripts. A live mocked-valid check proved both repaired announcements:

- Returned purchase: `Purchase restored. Your session archive is available.`
- Pasted license: `License verified. Your session archive is available.`

The license token was removed from the address bar and its valid verdict was cached across reload. A live invalid-license burst returned its first 429 at request 31 with `Retry-After`; a later request after the stated recovery interval returned 200 with `Cache-Control: no-store` and exact-origin CORS.

## PWA, response policy, and performance

Chromium reported no manifest or installability errors. Live cache `scan-count-pad-v11` contained the shell and hashed assets. A forced service-worker update emitted `updatefound` and showed the update notice. Root and Privacy reloaded offline, saved state remained available, and the Offline status appeared.

Live responses include CSP with `frame-ancestors 'none'`, camera-only Permissions Policy, HSTS preload, `X-Content-Type-Options: nosniff`, strict referrer policy, and `X-Frame-Options: DENY`. Hashed JavaScript and CSS use one-year immutable caching, `sw.js` uses no-store, the manifest uses `application/manifest+json`, and HTTP redirects to HTTPS.

Fresh mobile Lighthouse results:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.0 s |
| Largest Contentful Paint | 1.1 s |
| Total Blocking Time | 40 ms |
| Cumulative Layout Shift | 0 |

The Lighthouse JSON is `/work/.evidence/scan-count-pad-review-4/lighthouse.json`.

## Earlier findings

| Earlier item | Current disposition |
| --- | --- |
| R3-01 unclear license success announcement | Resolved. Fresh live checks of returned and pasted valid licenses name the session archive; the clean regression passes. |
| R2-01 missing primary navigation | Resolved. Every live route, including 404, exposes labelled keyboard-operable Demo and Privacy links. |
| R1-01 Back/Forward focus and announcement | Resolved. The two-project clean regression passes; the fresh live desktop flow also focused the restored heading and announced its title in both directions. |
| V-01 license rate limit | Resolved. A live burst first returned 429 at request 31 with `Retry-After`, then recovered to 200 after the interval. |
| V-02 CSV formula injection | Resolved. The dedicated claim passed for `=`, `+`, `-`, and `@`; the independent export contained neutralized text. |
| V-03 duplicate-SKU recovery | Resolved. The visible, announced, focused, invalid-field recovery passed. |
| V-04 scanner quantity bounds | Resolved. 9999 worked; 10000 and 1.5 were rejected without mutation. |
| V-05 immutable asset caching | Resolved. Live hashed JavaScript and CSS return one-year immutable caching. |
| V-06 response headers and manifest MIME | Resolved. Required security headers and `application/manifest+json` are live. |

## Scope and field limits

This is a static local-first PWA. It has no product backend, tenant database, health endpoint, server-side SQLite service, or restart-persistence boundary, so backend-only checks do not apply. CSV import/export already supplies the adjacent step implied by the brief; AI or online sync would not improve this narrow local task.

Physical Bluetooth hardware, field phone-camera combinations, and the brief's 40%-faster human shop-floor comparison remain field-validation work. Their keyboard-wedge and instrumented-camera paths pass. These are not public claims, findings, or untested claims.

**Final result: PASS — 0 findings and 0 untested public claims.**
