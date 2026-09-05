# Count stock at the shelf — repair 3 handoff

**Status: PASS**

- Work order: `scan-count-pad-repair-3`
- Job: count stock at the shelf.
- Audience: small shops using phones or Bluetooth scanners.
- First action before scrolling: **Try it with sample data**.
- Implementation SHA: `cfb1a0f4d7ad16d3e998f55cd98acb49fb45399b` (`fix: add accessible header navigation`)
- Verification baseline SHA: `6397af2148aaebcc8a82f0fbd794f4acc8a62605` (`test: cover real data through demo reset`)
- Live URL: <https://scan-count-pad.sociobot.in>
- Deployment ID: `1a835c86-c744-4368-8896-ea764a2c052c`
- Deployment result: succeeded; HTTPS root returned 200.
- Findings remaining: 0 product findings; 0 untested public claims.

## What changed

- Added `<nav aria-label="Primary">` with **Demo** and **Privacy** to the shared app header. The wordmark remains the Home link.
- Added the same header navigation, skip link, footer, touch targets, and focus treatment to the designed 404 page.
- Kept the Demo link as a normal navigation so entering demo starts its separate storage mode with a clean page load.
- Bumped the service-worker cache to `scan-count-pad-v10` so installed apps receive the updated shell.
- Added a keyboard regression covering Demo and Privacy on root, demo, privacy, terms, and 404 screens at desktop and 390 px widths.
- Strengthened the demo-isolation claim regression: it creates a real count, changes and resets the sample count, exits demo, and confirms the real count still has its original value.

## Clean verification

From a fresh clone of verification baseline `6397af2`:

```text
npm ci                       PASS, 0 vulnerabilities
npm audit --audit-level=low  PASS, 0 vulnerabilities
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS, 15 unit/config + 22 browser tests
npm run build                PASS, dist/ produced
```

All 13 commands in `.factory/claims.json` were run separately and passed: offline reload, CSV export, formula-safe export, scanner input, persistence, unknown reconciliation, quantity validation, demo isolation, local data, camera-local handling, license unlock, paid price, and backup restore. Every claim continues to have one tagged outcome test.

The production build is 36,614 bytes of JavaScript (12.29 KB gzip), 18,730 bytes of CSS (4.93 KB gzip), and a 43,072-byte hero image. The initial JavaScript and CSS remain inside the product budget.

## Current live checks

- Fresh 1440×900 desktop and 390×844 phone contexts opened the HTTPS root at scroll position zero. Both showed `Count stock at the shelf`, the small-shop phone/scanner audience sentence, and **Try it with sample data** without horizontal overflow or console errors.
- Both fresh contexts had exactly one labelled primary navigation landmark containing **Demo** and **Privacy**. Root, Demo, Privacy, Terms, and the deliberate 404 each had the same navigation landmark. Keyboard activation reaches Demo, then Privacy; Privacy's heading receives focus.
- The sample flow showed `Friday bay A sample`, four products, three populated counts, one unknown code, and the persistent demo banner. Brass bolts changed 118 → 119 → 118 after **Reset demo**. **Start for real** returned to the real workspace without sample data.
- Playwright Axe found zero violations across root, demo, privacy, terms, and the deliberate 404 on both desktop and phone (10 scanned states).
- `/opt/fleet/lib/verify-url.sh` passed against the live root: 823 ms load, no browser errors, title, `lang`, one `h1`, `main`, image alt text, and button labels all passed.
- The live PWA harness found no manifest or installability errors; cache `scan-count-pad-v10` contains the shell and assets; update discovery displayed the update toast; root and Privacy reloaded offline with the offline badge.
- Live response checks confirm immutable hashed assets, no-store `sw.js`, `application/manifest+json`, CSP with `frame-ancestors 'none'`, camera-only Permissions Policy, HSTS, nosniff, strict referrer policy, and `X-Frame-Options: DENY`.
- Local candidate and live HTTPS responses matched byte-for-byte for `index.html`, the JavaScript, CSS, `sw.js`, `404.html`, and `404.css`. The designed unknown route deliberately returned HTTP 404 and matched `404.html`.
- A normal invalid license request returned 200 with `Cache-Control: no-store`. A fresh product-specific burst first returned 429 on request 30 with `Retry-After: 3`. The hosted checkout returned 303; no purchase was attempted.

## Earlier finding disposition

| Item | Current disposition |
| --- | --- |
| R2-01 header navigation landmark | Resolved. The shared app shell and 404 now have one labelled primary `<nav>` with keyboard-operable Demo and Privacy links. Live desktop and phone checks cover every route. |
| R1-01 Back/Forward focus and announcement | Resolved. The current clean browser suite still passes the Back/Forward heading-focus and polite-announcement regression. |
| V-01 license rate limit | Resolved. Current live burst first returned 429 on request 30 with `Retry-After: 3`. |
| V-02 CSV formula injection | Resolved. The dedicated clean-clone claim neutralized `=`, `+`, `-`, and `@` text. |
| V-03 duplicate SKU recovery | Resolved. The clean suite confirms visible error, invalid state, and focused SKU field. |
| V-04 scanner quantity bounds | Resolved. The clean suite accepts 9999 and rejects 10000 and 1.5 without mutation. |
| V-05 immutable asset caching | Resolved. The deployed hashed JavaScript response has one-year immutable caching. |
| V-06 headers and manifest MIME | Resolved. Current live headers and `application/manifest+json` match the deployment policy. |

## Tool limits and field validation

- `npx @axe-core/cli` was attempted against the live site, but its Selenium Chrome process could not find a Chrome binary in this worker. The repository's Playwright Axe integration completed the live 10-state scan with zero violations.
- Lighthouse was attempted with the preinstalled Playwright Chromium. Its direct launch and a remote-debugging fallback both failed in this worker (`Unable to connect to Chrome` / crashed tab), so no new Lighthouse score is claimed. The live browser load check, bundle sizes, and all functional browser checks above passed.
- Physical Bluetooth scanner hardware and field phone-camera combinations still need shop-floor validation. The keyboard-wedge and instrumented camera paths pass.
- The brief's 40%-faster target needs a timed human comparison with spreadsheet entry. It is not public copy or a claimed benchmark.

This is a static local-first PWA. It has no product-owned backend, tenant database, health endpoint, or server-side restart persistence boundary; backend-only checks do not apply.
