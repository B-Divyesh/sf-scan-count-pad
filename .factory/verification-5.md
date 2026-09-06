# Count stock at the shelf — independent verification 5

**Verdict: PASS**

- Work order: `scan-count-pad-verify-5`
- Job: count stock at the shelf.
- Audience: a single-location shop or maker using a phone or Bluetooth scanner.
- First action before scrolling: **Try it with sample data**.
- Findings: **0** (high 0, medium 0, low 0)
- Untested public claims: **0**
- Implementation candidate: `e2a3f26fff6fe78515d6309bded98b8efa01316f` (`fix: announce session archive availability`)
- Documentation baseline reviewed: `e9b7ab7ff00f7664de321ae7f2756ab9b8780020` (`docs: hand off license announcement repair`)
- Live URL: <https://scan-count-pad.sociobot.in>
- Verified: 2026-09-06 UTC

The implementation candidate is the product code reviewed. The documentation commit is later handoff material. The live site matches the fresh candidate build for all 23 public build artifacts.

## First screen and demo sandbox

Fresh 1440×900 desktop and 390×844 phone browser contexts opened the live root at scroll position zero. Both showed **Count stock at the shelf**, the audience sentence **For small shops counting stock at the shelf with a phone or Bluetooth scanner**, and **Try it with sample data** before scrolling. The action ended at y=556 on desktop and y=524 on the phone. There were no console or page errors.

The one-click action opens `/demo` with the realistic `Friday bay A sample`, four products, and a persistent **Demo — sample data, nothing is saved to your real counts** banner. In a fresh isolated browser context, Brass bolts began at 118, reached 119 after a scan, and returned to 118 after **Reset demo**. A separate real count remained at 1 after **Start for real**. IndexedDB contained separate `demo:scan-count-pad` and `scan-count-pad` databases. Ordinary demo traffic contacted only the product origin.

## Clean checkout and claims

From the clean checkout, the following commands passed:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

`npm audit` reported zero vulnerabilities. The final full suite passed 15 unit/config tests and 22 Chromium browser tests. The build produced `dist/` with 36.63 kB JavaScript (12.30 kB gzip) and 18.73 kB CSS (4.93 kB gzip), within the static-product budget.

Every exact command declared in `.factory/claims.json` was run separately and passed: `offline-reload`, `csv-export`, `formula-safe-export`, `scanner-input`, `data-persistence`, `unknown-reconcile`, `validated-quantity`, `demo-isolation`, `local-data`, `camera-local`, `license-unlock`, `paid-price`, and `backup-restore`. There are no untested, missing, or unlisted public claims in the live copy, README, legal pages, demo documentation, or manifest.

## Workflow, access, privacy, and PWA

The independent workflow harness passed 56 assertions with no browser errors. It covered normal count flow, malformed and duplicate CSV recovery, manual and keyboard-wedge input, 9999 acceptance, 10000 and 1.5 rejection without count mutation, unknown reconciliation, visible duplicate-SKU recovery, undo, backup restore, keyboard and focus behavior, reduced motion, privacy traffic, offline reload, and update feedback.

The scale check imported and counted 100 products, reconciled 5 of 5 unknown codes, and exported 100 rows in 8.114 seconds of automation. This is workflow evidence, not a human speed claim. The camera check requested one stream only after activation, applied one result, closed the dialog, and ended the track.

The live PWA reported a valid manifest and no installability errors. Cache `scan-count-pad-v11` contained the shell and hashed assets. A forced update displayed the update notice. Root and Privacy reloaded offline with the Offline state. Browser Axe found zero serious or critical violations across root, Demo, Privacy, Terms, and the 404 page on both desktop and phone. The worker URL check loaded the root in 837 ms with no console errors and passed title, language, heading, main, image-alt, and button-label checks.

Fresh mocked valid-license checks proved both repaired announcements and archive availability:

- Returned purchase: `Purchase restored. Your session archive is available.`
- Pasted license: `License verified. Your session archive is available.`

The returned token was removed from the address bar. The active license state persisted through reload. Ordinary flows use only the product origin; the explicit license verification flow uses only `api.sociobot.in`. No analytics, third-party fonts, or third-party scripts were observed.

## Routes, links, response policy, and performance

Root, Demo, Privacy, and Terms returned HTTP 200. Each had its route-specific title, one `h1`, one `main`, and labelled Primary navigation. `/not-a-real-route` returned its designed `Page not found — Scan Count Pad` page with HTTP 404 and a working way back. The browser's failed-resource console entry for that deliberate 404 is expected and not a defect. All collected product links resolved as expected; the checkout link returned the expected 303 to hosted Dodo checkout, and no purchase was attempted.

HTTP redirects to HTTPS. Live headers include CSP with `frame-ancestors 'none'`, camera-only Permissions Policy, HSTS preload, `X-Content-Type-Options: nosniff`, strict referrer policy, and `X-Frame-Options: DENY`. The manifest is `application/manifest+json`, hashed JavaScript and CSS are one-year immutable, and `sw.js` is no-store. All 23 public `dist/` artifacts matched the live HTTPS bodies byte-for-byte; `staticwebapp.config.json` is deployment policy and intentionally is not a served artifact.

A fresh invalid-license burst first returned HTTP 429 at request 31 with `Retry-After: 3`; after waiting, a normal invalid request returned HTTP 200 with `Cache-Control: no-store`. This static PWA has no product-owned backend, tenant database, health endpoint, server-side SQLite service, or restart boundary, so backend-only tenant, health, and persistence checks do not apply.

Live mobile Lighthouse scored Performance 99, Accessibility 100, Best Practices 100, and SEO 100. FCP was 1.0 s, LCP 1.3 s, total blocking time 110 ms, and CLS 0.

## Earlier findings

| Earlier item | Current disposition |
| --- | --- |
| R3-01 unclear license success announcement | Resolved. Both returned and pasted valid-license paths now name the available session archive and pass browser regression coverage. |
| R2-01 missing primary navigation | Resolved. Every live route, including 404, exposes labelled keyboard-operable Primary navigation. |
| R1-01 Back/Forward focus and announcement | Resolved by the passing browser navigation regression. |
| V-01 license rate limit | Resolved. Fresh live burst first returned 429 at request 31 with `Retry-After: 3`. |
| V-02 CSV formula injection | Resolved. The dedicated formula-safe export claim passed for `=`, `+`, `-`, and `@`. |
| V-03 duplicate-SKU recovery | Resolved. The error is visible, announced, focused, and marks the field invalid. |
| V-04 scanner quantity bounds | Resolved. 9999 works; 10000 and 1.5 are rejected without a count mutation. |
| V-05 immutable asset caching | Resolved. Live hashed JavaScript and CSS use one-year immutable caching. |
| V-06 headers and manifest MIME | Resolved. Required response headers and `application/manifest+json` are live. |

## Field limits

Physical Bluetooth hardware, field phone-camera combinations, and the brief's human 40%-faster shop-floor study still need real-world validation. The keyboard-wedge and instrumented-browser paths passed. These are not public claims, findings, or untested claims.

**Final result: PASS — 0 findings and 0 untested public claims.**
