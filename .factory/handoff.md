# Count stock at the shelf — review 4 handoff

**Status: PASS — strict review found 0 findings and 0 untested public claims.**

- Work order: `scan-count-pad-review-4`
- Implementation reviewed: `e2a3f26fff6fe78515d6309bded98b8efa01316f`
- Documentation baseline: `e9b7ab7ff00f7664de321ae7f2756ab9b8780020`
- Live URL: <https://scan-count-pad.sociobot.in>
- Full report: `.factory/review-4.md`

## What was done

No product code was changed. Review 4 independently checked the live desktop and phone first screens, the one-click populated demo, persistent demo label, reset, real/demo IndexedDB isolation, and the return to unchanged real data. It also checked normal, malformed, duplicate, quantity-boundary, unknown-recovery, CSV, backup, camera, license, keyboard, focus, reduced-motion, accessibility, privacy, offline, update, routes, links, legal pages, 404, response headers, rate limiting, and performance paths.

The live product matched all 23 served files from the fresh implementation build byte for byte. The review records the implementation and documentation SHAs separately because later commits contain reports only.

## How it was verified

From a clean checkout detached at the implementation candidate:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

All gates passed. `npm test` passed 15 unit/config tests and 22 browser tests. The build produced `dist/` with 36.63 kB JavaScript (12.30 kB gzip), 18.73 kB CSS (4.93 kB gzip), and a 43.07 kB hero image.

All 13 exact commands in `.factory/claims.json` passed independently. The independent harness passed 56 assertions with no browser errors. The scale flow imported and counted 100 items, resolved 5 of 5 unknowns, and exported 100 rows in 7.840 seconds of automation. The instrumented camera requested one stream only after activation and stopped its track after the read.

Fresh live desktop and phone screenshots and the URL check are under `/work/.evidence/scan-count-pad-review-4/`. Lighthouse scored 100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO; FCP was 1.0 s, LCP 1.1 s, TBT 40 ms, and CLS 0.

The installed PWA had no manifest or installability errors. Cache `scan-count-pad-v11` supported offline root and Privacy reloads and displayed the update notice. Live route checks found distinct titles, one heading, one main landmark, labelled navigation, no serious/critical axe violations, and the expected designed 404. The first live invalid-license burst returned 429 at request 31 with `Retry-After`; recovery returned 200. No purchase was attempted.

## Earlier findings

R1-01, R2-01, R3-01, and V-01 through V-06 remain resolved with current clean and live evidence. The disposition of each is in `.factory/review-4.md`.

## Known gaps and next steps

No product defect or untested public claim remains. Physical Bluetooth hardware, field phone-camera combinations, and the brief's human 40%-faster comparison still need real shop-floor validation. They are not public claims.

This is a static local-first PWA with no product-owned backend, tenant, health endpoint, server-side SQLite, or restart boundary. No backend work is required.
