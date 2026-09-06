# Count stock at the shelf — repair 4 handoff

**Status: PASS**

- Work order: `scan-count-pad-repair-4`
- Job: count stock at the shelf.
- Audience: a single-location shop or maker using a phone or Bluetooth scanner.
- First action before scrolling: **Try it with sample data**.
- Implementation SHA: `e2a3f2600274230f6c3af67201fb6b99fc8e3459`
- Verification documentation SHA: `1a33b5e391f42b965293835c7a33b5c845603aee`
- Live URL: <https://scan-count-pad.sociobot.in>
- Deployed: 2026-09-06 UTC, static PWA build with its existing Static Web Apps configuration.
- Findings: 0. Untested public claims: 0.

## Repair completed

R3-01 is resolved at its source. Both valid-license success paths now explain the result in the polite live region:

- Returned purchase: `Purchase restored. Your session archive is available.`
- Pasted license: `License verified. Your session archive is available.`

The browser regression exercises both outcomes, proves that the archive becomes available, retains cached-license and `Retry-After` behavior, and does not inspect source text. The service-worker cache was advanced to `scan-count-pad-v11` so installed copies receive the updated bundle. The footer and copy audit are `v1.0.4`.

## Clean verification

From a locked dependency install, all of these passed:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

- Audit: 0 vulnerabilities.
- `npm test`: 15 unit/config and 22 Chromium desktop/390 px browser tests passed.
- Build: `dist/` produced. Initial JavaScript is 36.63 kB (12.30 kB gzip); CSS is 18.73 kB (4.93 kB gzip); the 43 kB hero image remains within budget.
- All 13 exact commands in `.factory/claims.json` were run separately and passed: `offline-reload`, `csv-export`, `formula-safe-export`, `scanner-input`, `data-persistence`, `unknown-reconcile`, `validated-quantity`, `demo-isolation`, `local-data`, `camera-local`, `license-unlock`, `paid-price`, and `backup-restore`.
- The independent workflow harness passed 56 assertions: normal, malformed, duplicate, quantity-boundary, scanner, unknown-recovery, backup, keyboard, reduced-motion, offline, update, privacy, and dialog-focus paths. It recorded no console or page errors.
- Scale verification imported and counted 100 products, resolved 5 of 5 unknowns, and exported 100 adjustment rows in 8.016 seconds of automation. This is workflow evidence, not a human speed claim.
- Camera verification made one request only after activation, applied one barcode, closed the dialog, and ended the media track.

## Live verification

- The static build was deployed with `/opt/fleet/lib/deploy-static.sh scan-count-pad dist`. HTTPS returned 200 after deployment.
- All 19 served build artifacts matched the deployed HTTPS bodies byte-for-byte. Representative SHA-256 values: root `7e6cd9deb58e80bf17faf9f05d9f689e17370d9be691c336f3766e3520cf11e8`, JavaScript `958e59ff9a3b08ab63d55a90556f2d4755d87d0e8094a7639140f51c51c64f25`, CSS `efc54b218bf3bb782ad282be97c28eabdf9690af2f12ff9ad8443bcd82ce9343`, and service worker `64d5df42f8b1108a76dab67bf5154acc81d2c85b331909d28ed469720be6e11c`.
- In fresh desktop and 390 px phone browsers before scrolling, the page showed **Count stock at the shelf**, the small-shop phone/Bluetooth-scanner audience sentence, and **Try it with sample data** above the fold. No console or page errors occurred.
- On both devices, a separate real Brass bolts count stayed at 1 while the one-click demo showed `Friday bay A sample`, four realistic products, Brass bolts at 118, and the persistent **Demo — sample data, nothing is saved to your real counts** banner. A demo scan reached 119, **Reset demo** restored 118, and **Start for real** returned to the untouched real count.
- A fresh mocked-valid live license return announced `Purchase restored. Your session archive is available.` The local browser claim also checks the pasted-license announcement.
- Desktop and phone checks covered root, Demo, Privacy, Terms, and the designed unknown route. Each real route had its own title, one `h1`, one `main`, and labelled Primary navigation. The unknown route correctly returned HTTP 404 with a working return path. Playwright Axe reported zero serious or critical violations in all ten route/device states.
- `verify-url.sh` loaded the root in 604 ms with no console errors, title, language, one heading, main landmark, alt text, and button-label checks passing.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.90 s, LCP 1.20 s, TBT 37 ms, CLS 0. Lighthouse used the preinstalled Playwright Chromium because this worker has no system Chrome.
- PWA verification found no manifest or installability errors. Live cache `scan-count-pad-v11` contains the shell and hashed assets; the update probe displayed its toast; root and Privacy reloaded offline with the Offline state.
- Hashed assets use one-year immutable caching. `sw.js` is no-store, the manifest is `application/manifest+json`, and CSP, frame protection, camera-only Permissions Policy, HSTS, nosniff, and strict referrer policy are live.
- Ordinary count and demo traffic contacted only the product origin. License verification is the only explicit cross-origin product request. There are no analytics, third-party fonts, or third-party scripts.
- The public license integration returned its first `429` on request 31 with `Retry-After: 4`; after that wait, a normal invalid-license request returned 200 with `Cache-Control: no-store`. The purchase endpoint returned its expected 303 to hosted Dodo checkout; no purchase was attempted.

## Earlier findings

| Item | Disposition |
| --- | --- |
| R3-01 unclear `Bench unlocked` announcement | Resolved and regression-tested in both success paths. |
| R2-01 missing primary navigation | Still resolved; all live routes expose labelled Primary navigation. |
| R1-01 Back/Forward focus and announcement | Still resolved by the browser navigation regression. |
| V-01 license rate limit | Live burst first returned `429` on request 31 with `Retry-After: 4`; recovery returned 200 and `no-store`. |
| V-02 formula-leading CSV cells | Still covered by the separate formula-safe export claim. |
| V-03 duplicate-SKU recovery | Still visibly errors, marks invalid, focuses the field, and announces the correction. |
| V-04 scanner quantity bounds | Still accepts 9999 and rejects 10000 and 1.5 without mutation. |
| V-05 immutable asset caching | Live hashed JavaScript and CSS remain one-year immutable. |
| V-06 response headers and manifest MIME | Live security headers and manifest MIME remain correct. |

## Paid offer and evidence

The free core, CSV export, accessibility, and safety behavior remain available. The live public offer is a $19 one-time Sociobot license for the unlimited on-device session archive; checkout remains hosted by Sociobot/Dodo and no purchase was attempted. Public offer metadata is at `/work/.evidence/billing-offer.json`. The verb-first catalog description is unchanged in `.factory/catalog-description.txt` and copied to `/work/.evidence/catalog-description.txt`.

Worker evidence, including the URL verifier screenshots and Lighthouse JSON, is under `/work/.evidence/scan-count-pad-repair-4/`.

## Remaining field validation

Physical Bluetooth hardware, field phone-camera combinations, and the brief's 40%-faster human shop-floor comparison still need real-world validation. They are not public claims or current findings. This is a static local-first PWA with no product backend, tenant, health endpoint, or server-side SQLite/restart boundary; backend-only checks do not apply.
