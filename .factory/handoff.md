# Count stock at the shelf — review 3 handoff

**Status: FAIL**

- Work order: `scan-count-pad-review-3`
- Job: count stock at the shelf.
- Audience: a single-location shop or maker using a phone or Bluetooth scanner.
- First action before scrolling: **Try it with sample data**.
- Implementation SHA: `cfb1a0f47bd836b61a4f577c8abede23df1a0857`
- Documentation/review SHA: `51f3ddabc5ef3c93d4d1f0d3a879bcdb861ff26a`
- Live URL: <https://scan-count-pad.sociobot.in>
- Findings: 1 low.
- Untested public claims: 0.
- Full report: [`.factory/review-3.md`](review-3.md)

## What was done

- Opened the live root before scrolling in fresh desktop and 390 px phone contexts. Both named the job, audience, and first action and had no page or console errors.
- Entered the sample in one click and checked its realistic populated output, persistent sample banner, reset, exit, and separate IndexedDB namespace. A real Brass bolts count stayed at 1 while the sample changed 118 → 119, reset to 118, and exited.
- Created a clean clone and ran install, audit, lint, typecheck, the full 15-unit/22-browser suite, build, and all 13 exact declared claim commands. All passed.
- Checked normal, invalid, boundary, and recovery flows through the clean browser suite; checked live desktop and phone routes, titles, navigation, 404 behavior, headers, caching, manifest, candidate parity, Axe, and mobile Lighthouse.
- Reviewed all earlier review and verification items. They remain resolved.

## Blocking finding

R3-01 is a low-severity plain-language and screen-reader defect. After a successful license action, the polite live region says `Bench unlocked.` A bench is not a clear product state. Replace it with an explanation of the actual result, such as `Your session archive is available.` in both successful license announcements. This is the sole reason the review is not a PASS.

## How to verify after repair

From a clean checkout:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

Run every command in `.factory/claims.json` separately. Verify the valid-license mocked route or a valid returned license announces plain language to `#announcer`, then repeat the live root and `/demo` desktop/phone sample-isolation check. The detailed evidence and the exact finding are in `.factory/review-3.md`.

## Field limits

Physical Bluetooth hardware, field phone-camera combinations, and the brief's timed shop-floor comparison still need real-world validation. They are not public claims or additional review findings.
