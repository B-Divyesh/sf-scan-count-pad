# Review 1 — count shelf stock with a phone or scanner

**Verdict: FAIL**

- Work order: `scan-count-pad-review-1`
- Implementation candidate: `41f6bf2a7c2e20e4c0138a9d818eddbb212bb16a`
- Documentation baseline: `fa7f5ff6fd5f00b059ba2099f56b78f425859c93`
- Prior verification report commit: `c8590a62c46539729b09446c15597e1dfa12c2af`
- Live URL: <https://scan-count-pad.sociobot.in>
- Reviewed: 2026-09-05 UTC
- Findings: **1** (high 0, medium 1, low 0)
- Untested public claims: **0**

The product cannot pass this strict review because one route-navigation accessibility defect remains. Every declared public claim was tested and passed.

## Finding

### Medium — R1-01: Back and Forward do not move focus or announce the route

The in-app Privacy link uses History API navigation correctly: it changes the URL and title, moves focus to the new `h1`, and puts `Privacy — Scan Count Pad` in the polite live region. Browser Back and Forward do not provide the same accessible route change.

Reproduction in a fresh Chromium context:

1. Open `/` and activate the Privacy link.
2. Confirm `/privacy`, its route title, focused `h1`, and live-region announcement.
3. Use browser Back.
4. Use browser Forward.

Observed after both history traversals: the URL, title, heading, and page content changed, but `document.activeElement` was `BODY` and `#announcer` was empty. Source inspection confirms that click navigation performs focus and announcement work, while the `popstate` handler only calls `render()`.

Impact: keyboard and screen-reader users receive no programmatic focus or announcement when they use Back or Forward, so the new page context is not made clear. This fails the required route focus behavior. Add the same heading-focus and polite announcement behavior to history traversal, then add a browser regression for both directions.

## First screen and demo

Fresh 1440×900 desktop and 390×844 phone contexts were opened before scrolling.

- Job: count stock at the shelf.
- Audience: small shops using a phone or Bluetooth scanner.
- First action: **Try it with sample data**, visible above the fold on both sizes.
- Root title: `Scan Count Pad — offline shelf counts`; `lang="en"`; one `h1`; one `main`.
- The phone layout had no horizontal overflow or exposed target below 44×44 CSS pixels.

The one-click action opened `/demo` and immediately showed `Friday bay A sample`, four products, three populated counts, and one unresolved code. The persistent banner read `Demo — sample data, nothing is saved to your real counts` and exposed **Reset demo** and **Start for real**.

A stronger isolation check created a real three-product count, recorded Brass bolts at 1, entered the demo, changed its sample count from 118 to 119, reset it to 118, and selected **Start for real**. The real count was still 1 and the demo store was empty. The two IndexedDB namespaces remained separate.

## Clean checkout and claims

A fresh GitHub clone at `c8590a6` was installed with `npm ci`. The only changes after implementation commit `41f6bf2` are reports, so the built product is the stated candidate.

Quality gates passed:

```text
npm audit --audit-level=low  PASS, 0 vulnerabilities
npm run lint                PASS
npm run typecheck           PASS
npm test                    PASS, 15 unit/config and 18 browser tests
npm run build               PASS, dist/ produced
```

Every command declared in `.factory/claims.json` was run separately and passed:

| Claim | Declared command | Result |
| --- | --- | --- |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS |
| `formula-safe-export` | `npm run test:unit -- --testNamePattern @claim:formula-safe-export` | PASS |
| `scanner-input` | `npm run test:e2e -- --grep @claim:scanner-input` | PASS |
| `data-persistence` | `npm run test:e2e -- --grep @claim:data-persistence` | PASS |
| `unknown-reconcile` | `npm run test:e2e -- --grep @claim:unknown-reconcile` | PASS |
| `validated-quantity` | `npm run test:e2e -- --grep @claim:validated-quantity` | PASS |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | PASS |
| `local-data` | `npm run test:e2e -- --grep @claim:local-data` | PASS |
| `camera-local` | `npm run test:e2e -- --grep @claim:camera-local --project=chromium` | PASS |
| `license-unlock` | `npm run test:e2e -- --grep @claim:license-unlock --project=chromium` | PASS |
| `paid-price` | `npm run test:e2e -- --grep @claim:paid-price --project=chromium` | PASS |
| `backup-restore` | `npm run test:e2e -- --grep @claim:backup-restore` | PASS |

Each claim ID appears in one test definition. A cross-check of the rendered copy, legal pages, README, and claim list found no missing public claim. Untested claim count is zero.

## Workflow, accessibility, privacy, and PWA evidence

The independent harness passed 53 assertions with no console or page errors. It covered valid, malformed, duplicate, boundary, recovery, and destructive-confirmation paths; known and unknown scans; reconciliation; undo; persistence; completion; CSV export; backup restore; unsupported camera fallback; keyboard use; focus styling; reduced motion; mobile targets; and update discovery.

Additional checks passed:

- 100 products counted, 5/5 unknowns resolved, and 100 adjustment rows exported in 7.872 seconds of automation with no errors. This is workflow evidence, not a human speed claim.
- Camera access occurred once after activation, the detected code was applied once, the dialog closed, and the media track ended.
- Playwright axe found zero violations on desktop onboarding, active count, completed summary, offline privacy, live phone onboarding, live phone count, live legal routes, and live phone demo.
- Keyboard focus exposed a visible 3 px amber ring. Reduced motion reduced transitions and animations to effectively zero and disabled smooth scrolling. Dialog focus return passed.
- The factory URL verifier loaded the root in 613 ms with no browser errors and passed title, language, landmark, alt-text, and button-label checks.
- Live Lighthouse scored 99 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO. FCP was 1.0 s, LCP 1.3 s, TBT 110 ms, and CLS 0.
- The production bundle was 36,230 bytes of JS (12,184 gzip), 18,288 bytes of CSS (4,873 gzip), and a 43,072-byte hero image.
- The PWA manifest had no parse or installability errors. Cache `scan-count-pad-v5` held the shell and built assets. Demo and Privacy reloaded offline.
- A state-based update probe showed the visible update toast in 5/5 fresh contexts. The older fixed 1.5-second harness sampled it too early once; its `updatefound` event still fired.
- Ordinary count and demo flows contacted only the product origin. Camera instrumentation produced no upload. The only allowed cross-origin product request is explicit license verification through `api.sociobot.in`.
- `/privacy` and `/terms` returned 200 with distinct titles, one `h1`, one `main`, and no axe violations. The deliberate unknown route returned HTTP 404 with the designed `Page not found — Scan Count Pad` page; its expected failed-resource console entry is not a defect.
- All internal HTTP links returned 200. The checkout endpoint returned the expected 303 to the hosted merchant checkout; no purchase was attempted.

This static PWA has no product-owned backend, tenant database, health endpoint, or server restart boundary. SQLite and backend tenant-isolation checks do not apply. The shared license endpoint was checked separately: a normal invalid request returned 200 JSON with exact-origin CORS and `Cache-Control: no-store`; the first 429 occurred on overall request 31 and included `Retry-After: 4`.

## Candidate parity and earlier findings

All 23 public files from the clean candidate build matched the live response bodies byte for byte. Representative SHA-256 values were:

- `index.html`: `3006ffcd55fa107d689ea9db9995bba17e9b5f3c4d80dfba52f5f390bbf7fa4b`
- JavaScript: `58f1081f12285c25f8ee6da62f85e903a3cb087c33ed39c949287e12694e262e`
- CSS: `5c4e33c52fb4e26d76a9bfb019fdea0aaf3d57a0df15a8741318bb0dca67ad1c`
- Service worker: `889186ddbac54cbe717113e21a8881bc5cbec601a03f19ef9f99962cd29594fa`

All six earlier findings remain resolved:

| Earlier item | Current disposition |
| --- | --- |
| V-01 rate limit | Resolved: first 429 at overall request 31 with `Retry-After: 4`. |
| V-02 CSV formula injection | Resolved: the tagged unit claim passed for all documented formula prefixes. |
| V-03 duplicate SKU recovery | Resolved: visible error, invalid state, focus, and announcement passed. |
| V-04 scanner quantity bounds | Resolved: 9999 passed; 10000 and 1.5 were rejected without a count change. |
| V-05 immutable asset caching | Resolved: live hashed JS and CSS use one-year immutable caching. |
| V-06 headers and manifest MIME | Resolved: CSP, frame protection, permissions, nosniff, referrer policy, one-year HSTS, and `application/manifest+json` were present. |

## Limits

- The brief's 40% faster target still needs a timed human shop-floor comparison.
- Physical Bluetooth scanner and field-camera combinations were unavailable; keyboard-wedge and instrumented camera paths passed.
- R1-01 must be repaired and independently retested before a PASS verdict.
