# Count stock at the shelf — review 3

**Verdict: FAIL**

- Work order: `scan-count-pad-review-3`
- Job: count stock at the shelf.
- Audience: a single-location shop or maker using a phone or Bluetooth scanner.
- First action before scrolling: **Try it with sample data**.
- Findings: **1** (high 0, medium 0, low 1)
- Untested public claims: **0**
- Implementation candidate: `cfb1a0f47bd836b61a4f577c8abede23df1a0857`
- Documentation/review baseline: `51f3ddabc5ef3c93d4d1f0d3a879bcdb861ff26a`
- Live URL: <https://scan-count-pad.sociobot.in>
- Reviewed: 2026-09-05 UTC

## Finding

### Low — R3-01: Successful license announcements use unexplained product lore

The polite live region announces `License verified. Bench unlocked.` after a pasted valid license and `Purchase restored. Bench unlocked.` after a returned valid purchase. A bench is not a product state or an action in Scan Count Pad, so this is unclear to a screen-reader user and violates the plain-words rule that every sentence must carry useful information. The tested paths are in `src/main.ts` lines 453 and 493; the region is `aria-live="polite"` in the shared shell.

Replace the metaphor with the actual result, for example `License verified. Your session archive is available.` and `Purchase restored. Your session archive is available.` Keep the existing clear visual `License active` state.

## Fresh live checks

Fresh 1440×900 desktop and 390×844 phone contexts opened the live root at scroll position zero. Both showed one `h1`, one `main`, `lang="en"`, no horizontal overflow, the job **Count stock at the shelf**, the audience sentence **For small shops counting stock at the shelf with a phone or Bluetooth scanner**, and the visible first action **Try it with sample data**. Neither context produced a page error or console error.

The one-click sample opened `/demo` with `Friday bay A sample`, four realistic products, starting counts including Brass bolts at 118, and the unresolved code `8901999`. Its persistent banner said **Demo — sample data, nothing is saved to your real counts** and exposed **Reset demo** and **Start for real**.

In a separate fresh live context, a real catalog was imported and Brass bolts was counted to 1. The sample then changed Brass bolts 118 → 119; **Reset demo** restored 118; **Start for real** returned to the real session, still at 1. IndexedDB contained separate `demo:scan-count-pad` and `scan-count-pad` databases. This verifies the sample, reset, and real-data isolation path.

Root, Demo, Privacy, and Terms each returned 200 on both devices, with their own title, one `h1`, one `main`, and one labelled Primary navigation landmark. The designed unknown route returned HTTP 404 with `Page not found — Scan Count Pad`, one `h1`, one `main`, and a route back. The browser's expected failed-resource console line for that deliberate 404 is not a defect. Axe found no serious or critical issue in any of the ten route/device states.

The live response has the expected CSP, frame protection, permissions policy, HSTS, nosniff, and strict referrer headers. The manifest is `application/manifest+json`; hashed JavaScript and CSS have one-year immutable caching. A clean build at the documentation baseline matched all 23 served public files byte for byte. The candidate differs from that baseline only in product code; commits after the candidate affect tests and reports, not the built product.

## Clean checkout and claims

A new local clone at `51f3dda` was installed with `npm ci` and remained clean. These documented gates passed:

```text
npm ci                       PASS, 0 vulnerabilities
npm audit --audit-level=low  PASS, 0 vulnerabilities
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS, 15 unit/config + 22 browser tests
npm run build                PASS, dist/ produced
```

All declared commands in `.factory/claims.json` were invoked separately from that clone. Every one passed: `offline-reload`, `csv-export`, `formula-safe-export`, `scanner-input`, `data-persistence`, `unknown-reconcile`, `validated-quantity`, `demo-isolation`, `local-data`, `camera-local`, `license-unlock`, `paid-price`, and `backup-restore`. The full suite also exercised CSV errors and duplicate recovery, scanner input, quantities 9999 / 10000 / 1.5, unknown reconciliation, camera recovery, count completion, CSV and backup export/restore, dialogs, navigation history, keyboard operation, offline reload, and reduced-motion/accessibility checks. No visitor-facing promise was missing a matching declared test, and no declared command was untested.

The static local-first PWA has no product backend, tenant, health endpoint, or SQLite service; backend-only tenant, restart, and request-rate checks do not apply. The license verification client is covered by its declared mocked success and `429`/`Retry-After` claim test. Physical scanner hardware and a shop-floor speed study remain field-validation limits, not public claims.

## Accessibility and performance

Live Axe had zero serious/critical violations across desktop and phone root, Demo, Privacy, Terms, and 404. The fresh mobile Lighthouse retry reported Performance 100, Accessibility 100, Best Practices 100, and SEO 100; FCP was 0.9 s, LCP 1.2 s, total blocking time 0 ms, and CLS 0.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| R1-01 Back/Forward focus and announcement | Resolved. The clean browser regression passes; current route titles and live shared page structure are present. |
| R2-01 missing header navigation | Resolved. Live desktop and phone root, Demo, Privacy, Terms, and 404 each expose labelled Primary navigation. |
| V-01 license rate limit | Resolved by the declared regression: its mocked 429 response includes and is honoured through `Retry-After`. |
| V-02 CSV formula injection | Resolved. The separately run formula-safe export claim passed for `=`, `+`, `-`, and `@`. |
| V-03 duplicate SKU recovery | Resolved. The clean regression asserts visible error, invalid state, focus, and announcement. |
| V-04 scanner quantity bounds | Resolved. The clean regression accepts 9999 and rejects 10000 and 1.5 without mutating the count. |
| V-05 immutable asset caching | Resolved. Live hashed JS and CSS return `public, max-age=31536000, immutable`. |
| V-06 response headers and manifest MIME | Resolved. Current live headers and `application/manifest+json` were checked. |

**Final result: FAIL — 1 low finding and 0 untested public claims.**
