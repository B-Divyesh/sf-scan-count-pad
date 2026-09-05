# Scan Count Pad — repair 2 handoff

**Status: PASS**

- Work order: `scan-count-pad-repair-2`
- Implementation SHA: `8a8b8a15bffbe0bb260d02a5e4cd5fcb736dc168`
- Review baseline: `4998bd11c14c46aa163eaec93e33b41f4168ddf4`
- Live URL: <https://scan-count-pad.sociobot.in>
- Demo URL: <https://scan-count-pad.sociobot.in/demo>
- Final deployment ID: `a0b3f3cd-6e89-4199-94d1-7fc108528492`
- Verified: 2026-09-05 UTC

## What changed

- Fixed R1-01 at the shared route boundary. In-app links, browser Back, and browser Forward now render the route, focus its `h1`, and announce its title through the polite live region.
- Added explicit history scroll state. New routes open at the top, while Back and Forward restore each route's saved position without moving focus away from the heading.
- Added an outcome-based Playwright regression that exercises real link, Back, and Forward actions on both configured viewports. It checks URL, scroll, heading focus, and announcement output.
- Replaced inherited stockroom slogans and metaphor labels with direct task and state text. The first heading is now “Count stock at the shelf.” The copy audit records the full landing page.
- Advanced the service-worker cache to `scan-count-pad-v9` so installed copies discover this repair and show the update notice.
- Added the required 99-byte verb-first catalog description. The same file is copied to `/work/.evidence/catalog-description.txt`.
- Recorded the existing $19 one-time license offer in `/work/.evidence/billing-offer.json`. The paid feature remains the unlimited on-device session archive; the complete current count and CSV export remain free.

## Clean-checkout verification

A new GitHub clone at the exact implementation SHA was installed with `npm ci`. The checkout was clean before the commands.

```sh
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
```

Results:

- Audit: 0 vulnerabilities.
- ESLint and TypeScript: pass.
- Unit/config: 15 passed.
- Playwright: 20 passed across desktop Chromium and the 390×844 phone project.
- Build: pass; `dist/` contains the production site.
- Bundle: 36,467-byte JS (12,266 gzip), 18,288-byte CSS (4,873 gzip), and 43,072-byte hero WebP.
- Every exact command in `.factory/claims.json` passed independently. All 13 claims have tagged outcome evidence; untested public claims: 0.

The final candidate also passed the independent harness with 53 assertions, no browser or console errors, and no axe violations in its tested states. The scale flow counted 100 products, resolved 5 of 5 unknown scans, and exported 100 rows in 8.853 seconds of automation. The camera harness recorded one permission request after activation, one applied scan, a closed dialog, and an ended media track.

## Finding disposition

| Finding | Final evidence |
| --- | --- |
| R1-01 Back/Forward focus and announcement | Resolved locally and live. Link, Back, and Forward focus the destination `h1`; the live region contains the destination title. Back restores the prior root scroll position and Forward restores Privacy to the top. |
| V-01 license rate limit | Remains resolved. A normal invalid request returned 200 JSON with exact-origin CORS and `Cache-Control: no-store`; the first burst 429 was request 30 and included `Retry-After: 3`. |
| V-02 CSV formula injection | Remains resolved. The tagged unit claim passed for formula-leading catalog text. |
| V-03 duplicate SKU recovery | Remains resolved. The visible, associated error, invalid state, focus, and announcement pass. |
| V-04 scanner quantity bounds | Remains resolved. The claim rejects 10000 and 1.5 without mutation and accepts valid quantities. |
| V-05 immutable asset caching | Remains resolved. Live hashed JS and CSS use one-year immutable caching. |
| V-06 headers and manifest MIME | Remains resolved. Live CSP, frame protection, permissions, HSTS, nosniff, referrer policy, and manifest MIME checks pass. |

## Live verification

- A fresh 1440×900 desktop context and a fresh 390×844 phone context showed the title `Scan Count Pad — offline shelf counts`, heading “Count stock at the shelf,” small-shop audience sentence, and **Try it with sample data** above the fold. Neither viewport overflowed horizontally.
- The one-click demo showed `Friday bay A sample`, four products, three existing counts, and one unresolved code. Brass bolts changed from 118 to 119, Reset demo restored 118, and Start for real returned to an independently created real count of 1.
- Live route history passed for link, Back, and Forward navigation. Each route had the correct URL/title, focused heading, announcement, and saved scroll position.
- The factory URL verifier loaded production in 633 ms with no console errors and passed title, language, one-heading, main-landmark, alt-text, and button-label checks.
- Axe found zero violations on the landing, active count, completed summary, offline Privacy, live phone states, Privacy, Terms, and the designed 404.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0, total transfer 68 KiB.
- PWA manifest/installability errors: zero. Cache `scan-count-pad-v9` contains the shell and hashed assets. The update toast appeared, and the root and Privacy routes reloaded offline.
- `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown route deliberately returns HTTP 404 with the designed page. Checkout returns the expected 303 to the hosted merchant checkout; no purchase was attempted.
- All 23 served build artifacts match the local `dist/` bytes. Key SHA-256 values: `index.html` `70295496...24ef`, JS `7ce6615f...3ee5`, CSS `5c4e33c5...ad1c`, service worker `8fd12aeb...abcf`.

## Known limits

- The brief's 40% faster target still needs a timed shop-floor comparison with a person; automation is not a substitute.
- Physical Bluetooth scanner hardware and field camera/browser combinations were unavailable. Keyboard-wedge and instrumented camera paths passed.
- This is a static local-first PWA. It has no product backend, tenant database, health endpoint, or server restart boundary, so those backend checks do not apply.
