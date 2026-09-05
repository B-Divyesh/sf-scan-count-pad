# Scan Count Pad — review handoff

**Status: FAIL — one medium accessibility finding**

- Work order: `scan-count-pad-review-1`
- Implementation candidate: `41f6bf2a7c2e20e4c0138a9d818eddbb212bb16a`
- Documentation baseline: `fa7f5ff6fd5f00b059ba2099f56b78f425859c93`
- Prior verification report commit: `c8590a62c46539729b09446c15597e1dfa12c2af`
- Live URL: <https://scan-count-pad.sociobot.in>
- Full report: [review-1.md](review-1.md)

## What this review did

- Opened the live root and demo in fresh desktop and 390×844 phone contexts.
- Verified the one-click populated demo, persistent sample label, reset, exit, and preservation of real IndexedDB data.
- Installed a fresh checkout with `npm ci`, ran audit, lint, type checking, the complete test suite, and the production build.
- Ran every one of the 13 commands declared in `claims.json`; all passed and no public claim was left untested.
- Ran the independent 53-assertion workflow harness, 100-product scale flow, camera lifecycle harness, PWA/offline checks, factory URL verifier, axe scans, and Lighthouse.
- Compared all 23 built public files with production byte for byte.
- Rechecked the shared license endpoint and all six earlier findings.
- Did not change product code.

## Current finding

R1-01 (medium): browser Back and Forward update route content and titles, but leave focus on `BODY` and do not announce the route. Direct in-app link navigation correctly focuses and announces the new `h1`. Repair the `popstate` path so it applies the same focus and live-region behavior, and add a regression for both history directions.

## Verified results

- Quality gates: audit 0 vulnerabilities; lint PASS; typecheck PASS; 15 unit/config tests PASS; 18 browser tests PASS; build PASS with `dist/`.
- Claims: 13/13 declared commands PASS; untested public claims 0.
- Live parity: 23/23 public files match candidate output.
- Accessibility: axe found zero violations in the tested page states; R1-01 was found by the manual keyboard/history check.
- Live Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.3 s, TBT 110 ms, CLS 0.
- PWA: manifest/installability PASS, cache `scan-count-pad-v5`, offline demo and Privacy PASS, update toast observed in 5/5 state-based probes.
- Privacy: ordinary workflows remained same-origin; camera frames were not uploaded.
- Rate limit: the first 429 was overall request 31 and included `Retry-After: 4`.
- Earlier findings V-01 through V-06 remain resolved.

## How to verify

From a clean checkout:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

Run each exact command in `.factory/claims.json`. For the new finding, open `/`, activate Privacy, then use Back and Forward while inspecting `document.activeElement` and `#announcer`.

## Next steps and limits

1. Fix R1-01 without changing the otherwise verified route behavior.
2. Add a Playwright regression that expects the destination `h1` to receive focus and the route title to be announced after both Back and Forward.
3. Rerun all quality gates, all 13 claim commands, the route accessibility check, and live parity after deployment.

The brief's 40% faster success target still needs a timed human shop-floor pilot. Physical Bluetooth scanner and field-camera combinations were unavailable; keyboard-wedge and instrumented camera paths passed.
