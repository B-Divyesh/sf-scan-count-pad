# Count stock at the shelf — verification 4 handoff

**Status: PASS**

- Work order: `scan-count-pad-verify-4`
- Job: count stock at the shelf.
- Audience: small shops using phones or Bluetooth scanners.
- First action before scrolling: **Try it with sample data**.
- Implementation SHA: `cfb1a0f47bd836b61a4f577c8abede23df1a0857`
- Documentation baseline: `e0e4141896dc7b4a3f25b1252ca08cb30f6eafb3`
- Live URL: <https://scan-count-pad.sociobot.in>
- Findings: 0.
- Untested public claims: 0.
- Full report: [`.factory/verification-4.md`](verification-4.md)

## What was done

- Opened the live root in fresh desktop and 390×844 phone contexts before scrolling. Both named the job, audience, and first action clearly.
- Entered the sample in one click. Checked four realistic products, three populated counts, one unresolved code, the persistent sample banner, reset, exit, and separation from a real count.
- Ran all clean-checkout gates and each of the 13 claim commands separately.
- Exercised normal, invalid, boundary, destructive-confirmation, and recovery paths. The independent harness passed 56 assertions.
- Checked root, Demo, Privacy, Terms, and the designed HTTP 404 on desktop and phone, including titles, headings, landmarks, keyboard focus, Back/Forward behavior, 200% text, reduced motion, and links.
- Ran Playwright Axe across 18 states with zero violations. The factory URL verifier passed with no console errors.
- Checked camera cleanup, the 100-product flow, privacy traffic, license handling, checkout redirect, rate limiting, response headers, caching, installability, offline reload, and update discovery.
- Compared all 23 served files with the clean build byte for byte.
- Ran Lighthouse mobile: 99 Performance and 100 Accessibility, Best Practices, and SEO. LCP was 1.2 s and CLS was 0.
- Reviewed every earlier finding and proved it remains resolved.

No product code was modified.

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

Run every exact command in `.factory/claims.json` separately. Open <https://scan-count-pad.sociobot.in> and `/demo` in fresh desktop and phone contexts. The detailed route, PWA, accessibility, network, performance, and claim evidence is in `.factory/verification-4.md`.

## Known field limits

- Physical Bluetooth scanner hardware and field phone-camera combinations still need shop-floor checks. Keyboard-wedge and instrumented camera paths pass.
- The brief's 40%-faster target needs a timed human comparison with spreadsheet entry. It is not public copy or a claimed benchmark.

These limits are not product findings or untested public claims.
