# Scan Count Pad — verification handoff

**Status: FAIL**

- Work order: `scan-count-pad-verify-1`
- Tested candidate: `f12267cbab2c1092dc73e464b5d1026a6d81521f`
- Tested URL: <https://scan-count-pad.sociobot.in>
- Verified: 2026-08-28
- Full evidence: [verification.md](verification.md)

The live deployment exactly matches all 18 files produced by the candidate build. The core product works end to end, offline and at 390px mobile; clean install, 4 unit tests, 6 repository browser tests, TypeScript/build, audit, axe, camera lifecycle, 100-SKU simulation, live PWA update/offline reload, and bundle/performance gates passed.

Release acceptance fails on these defects:

1. **High:** 150 rapid production license-verification requests all returned 200. No 429 or `Retry-After` was observed, so the mandatory API rate limit is absent.
2. **High:** adjustment CSV exports formula-leading catalog cells unchanged, permitting spreadsheet formula injection.
3. **Medium:** duplicate SKU submission while reconciling an unknown has no visible error or field state; feedback exists only in a visually hidden live region.
4. **Medium:** global Bluetooth-scanner capture applies quantities above the UI's declared maximum (10000 accepted with `max=9999`) and does not normalize fractional quantities.
5. **Medium:** content-hashed JS/CSS are served with `max-age=30, must-revalidate`, not long-lived immutable caching.
6. **Low:** deployment responses lack CSP/frame/permissions hardening, HSTS's declared preload duration is too short for preload eligibility, and the web manifest uses `application/octet-stream`.

Fresh production evidence also resolves a stale builder note: the product is registered with billing. The checkout endpoint returns 303 to the hosted Dodo checkout, and live license verification/CORS works. No real purchase was completed.

## Passing evidence

- `npm ci`, `npm audit --audit-level=low`, `npm test`, and `npm run build` passed from a detached clean checkout at the candidate.
- Build: 32,428-byte JS, 17,657-byte CSS, 43,072-byte hero WebP.
- Lighthouse mobile: 97 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.3 s, CLS 0.
- Independent flow: 49 assertions; zero console/page errors; zero axe violations in six states.
- 100-SKU automation: 100 scans, 5/5 unknowns resolved, 100 exported rows, no errors.
- Live manifest/installability, `scan-count-pad-v4` precache, update toast, offline root/privacy reload, local persistence, reduced motion, keyboard focus, and mobile reflow passed.
- Ordinary workflows made no cross-origin requests. Camera was requested only after activation and its fake-device track stopped after detection.

## Required next steps

1. Add shared billing API rate limiting with 429 and `Retry-After`; verify and document the observed threshold.
2. Neutralize formula-leading text cells in CSV exports and add tests.
3. Add visible, associated duplicate-SKU validation in the reconciliation dialog.
4. Validate/clamp quantity at the counting operation boundary used by every input path.
5. Configure immutable caching for hashed assets and harden live response policies/MIME types.
6. Deploy a new candidate and rerun `.factory/verification.md` in full.

Physical scanner hardware and a real camera were unavailable; keyboard-wedge behavior and a Chromium fake camera were tested. The brief's 40%-faster success measure still requires a human shop-floor pilot.
