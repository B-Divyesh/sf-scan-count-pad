# Scan Count Pad — review 2 handoff

**Status: FAIL**

- Work order: `scan-count-pad-review-2`
- Job: count stock at the shelf.
- Audience: small shops using phones or Bluetooth scanners.
- First action: **Try it with sample data**.
- Implementation SHA: `8a8b8a15bffbe0bb260d02a5e4cd5fcb736dc168`
- Documentation baseline: `8da5ae125ebba2c33cca400f39d26a5ac4ecbb90`
- Live URL: <https://scan-count-pad.sociobot.in>
- Deployment ID reviewed: `a0b3f3cd-6e89-4199-94d1-7fc108528492`
- Findings: 1 medium (`R2-01`: missing `nav` landmark and header navigation)
- Untested public claims: 0
- Full report: [review-2.md](review-2.md)

## What was verified

- Fresh desktop and phone first screens stated the job and audience and showed **Try it with sample data** before scrolling.
- The one-click demo showed four realistic products, three existing counts, one unknown, the persistent demo label, Reset demo, and Start for real.
- Demo changes and reset did not alter a separately created real count. Leaving the demo cleared its records.
- Browser link, Back, and Forward navigation restored exact scroll positions, focused the new heading, and announced the route on desktop and phone.
- All 13 declared claim commands passed separately from a clean clone. `npm test` passed 15 unit/config and 20 browser tests; lint, type checking, audit, and build passed.
- The independent harness passed 53 assertions. The 100-item flow counted 100 items, resolved 5 of 5 unknowns, and exported 100 rows. The instrumented camera stopped its track after one read.
- Axe reported zero violations across 15 tested states. The factory URL check found no browser errors. Reduced motion, keyboard focus, 200% text, legal routes, and the designed 404 passed.
- The PWA installed without manifest errors, showed its update notice, and reloaded root and Privacy offline.
- Lighthouse mobile scored 100/100/100/100 with 1.2 s LCP.
- All 23 served files matched the local candidate build. Security headers, immutable asset caching, license response behavior, rate limiting, and checkout redirect passed.
- Every earlier finding R1-01 and V-01 through V-06 is independently resolved.
- The strict review found `R2-01`: the shared header has no semantic `nav` or header links to Demo and Privacy. This fails the accessibility and site-structure contracts; add a labelled primary navigation landmark to all shared pages, then retest keyboard and phone behavior.

## Run again

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

Then run each command in `.factory/claims.json` separately. With `npm run preview -- --host 127.0.0.1` running, the additional repository harnesses are:

```sh
node .factory/qa-independent.mjs
node .factory/qa-scale.mjs
node .factory/qa-camera.mjs
node .factory/qa-live-pwa.mjs
```

## Remaining field validation

Physical Bluetooth scanner and field camera combinations still need shop-floor testing. The brief's 40%-faster measure needs a human comparison against spreadsheet entry. These are not public claims. The required repair is R2-01, documented in [review-2.md](review-2.md).
