# Scan Count Pad — independent product verification

**Verdict: FAIL**

- Work order: `scan-count-pad-verify-1`
- Candidate: `f12267cbab2c1092dc73e464b5d1026a6d81521f`
- Candidate subject: `docs: complete verification and release handoff`
- URL: <https://scan-count-pad.sociobot.in>
- Verified: 2026-08-28 08:46 UTC
- Environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2 Chromium, Lighthouse 13.4.1

The core count workflow is useful, fast, accessible, local-first, and genuinely works offline. The deployed files exactly match the candidate build. Release acceptance nevertheless fails because the required API rate limit is absent and adjustment exports permit spreadsheet formula injection. Two additional data-entry/recovery defects and deployment-policy gaps are recorded below.

## Defects by severity

### High — V-01: license verification has no observable rate limit

The acceptance contract requires a burst against any server-side endpoint, including product-unlock calls, to begin returning `429` with `Retry-After`.

Reproduction:

1. Send sequential, rapid GET requests to `https://api.sociobot.in/api/v1/products/scan-count-pad/verify?license=qa-rate-limit-N`.
2. Stop at the first `429`, up to 150 requests.

Observed: **150/150 returned 200** with invalid-license JSON. No request returned 429 and therefore no `Retry-After` threshold was observed. A normal invalid verification response correctly used `Cache-Control: no-store` and exact-origin CORS.

Impact: the paid-unlock verification endpoint lacks the explicitly required abuse/brute-force and load-shedding control. This is a release blocker even though the endpoint is owned by the shared billing service rather than this static bundle.

### High — V-02: exported CSV leaves formula-leading cells executable

Reproduction:

1. Import a valid catalog containing SKU `=2+2`.
2. Count the item, complete the session, and export adjustments.
3. Inspect the downloaded CSV.

Observed row:

```csv
=2+2,,Formula label,1,1,0
```

The exporter quotes delimiters but does not neutralize cells beginning with `=`, `+`, `-`, or `@`. Spreadsheet software can interpret catalog-controlled SKU, barcode, or name values as formulas when an operator opens the adjustment file.

Impact: the product's primary output can execute spreadsheet formulas rather than remain inert data. Prefix formula-leading text cells with an apostrophe or apply another documented CSV-injection defense, then add regression coverage.

### Medium — V-03: duplicate SKU recovery in “Add as new item” is invisible

Reproduction:

1. Scan an unknown code and choose “Add as new item”.
2. Enter a SKU already used by the catalog and submit.

Observed: the dialog remains open, but no visible error appears and the field gets no invalid state. The only feedback is “Use a unique SKU and a product name.” written into the visually hidden `#announcer` live region.

Impact: a sighted shelf operator receives no recovery instruction during a key unknown-reconciliation path.

### Medium — V-04: Bluetooth-style capture bypasses the quantity maximum

Reproduction:

1. In an active count, enter `10000` in Qty; the control declares `max="9999"`.
2. Move focus outside form controls.
3. Type a known code and Enter, which exercises the global Bluetooth-scanner capture path.

Observed: the item is updated by `+10000`. The global handler calls the count operation without checking form validity or clamping to the declared maximum. The valid boundary of 9999 also succeeds.

Impact: the product's primary hardware-scanner path can persist/export a quantity the UI declares invalid. Fractional values are similarly not normalized by this path.

### Medium — V-05: hashed production assets are not cached immutably

Live responses for both `assets/main-BH5xlhty.js` and `assets/main-CC7oGUsl.css` return:

```text
Cache-Control: public, must-revalidate, max-age=30
```

These filenames are content-hashed. The performance contract calls for long-lived immutable caching for hashed assets. The service worker mitigates repeat visits after installation, but first visits and non-controlled requests still revalidate after 30 seconds.

### Low — V-06: browser response hardening and manifest MIME are incomplete

The deployment passes HTTPS redirect, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`. It does not send Content Security Policy, `frame-ancestors`/`X-Frame-Options`, or Permissions Policy. HSTS declares `preload` with `max-age=10886400`, shorter than the current one-year preload requirement. `manifest.webmanifest` is served as `application/octet-stream` rather than a manifest/JSON MIME type.

Chromium still reported zero manifest parse or installability errors, so the MIME issue is currently low impact.

## Clean-checkout quality gates

A detached worktree at the exact candidate was used. It remained clean after the commands.

```sh
npm ci
npm audit --audit-level=low
npm test
npm run build
```

Results:

- Dependency audit: 0 vulnerabilities.
- Unit tests: 4/4 passed.
- Playwright repository suite: 6/6 passed: desktop and 390px mobile count flow, axe checks, and offline reload.
- Type check: passed through `tsc --noEmit` in `npm run build`.
- Lint: no lint script or separate lint configuration exists.
- Exact production build: passed; `dist/` created with root, privacy, and terms HTML.
- Initial JS: 32,428 bytes (11.01 KB gzip), below 200 KB.
- CSS: 17,657 bytes (4.71 KB gzip), below 50 KB.
- Hero WebP: 43,072 bytes, below 300 KB.
- No external font files are shipped; system stacks are used.

## Independent end-to-end coverage

The verifier harness completed 49 assertions against the local production build and live mobile deployment. There were no console errors or uncaught page errors.

Covered normal, boundary, invalid, and recovery paths:

- Imported quoted CSV values, zero expected stock, a 9999 boundary, and a four-item catalog.
- Rejected an unclosed quoted cell, negative expected quantity, and duplicate identifiers, then successfully recovered with a valid import.
- Started a named session; confirmed scanner-field autofocus and global keyboard/Bluetooth-style scanning.
- Counted by SKU/barcode, used quantity scanning, direct set, `+1`/`-1`, variance labels, search empty state, and undo.
- Confirmed unknown scans never change stock automatically, case-insensitive repeats accumulate, Finish is disabled while unknowns remain, and canceling Ignore preserves the unknown.
- Resolved unknowns by matching, ignored one with explicit confirmation, added a new catalog item, and exercised duplicate-SKU failure.
- Confirmed counts survive reload and tab lifecycle through IndexedDB.
- Finished with confirmation, reviewed summary, exported adjustments, exported/restored a JSON backup, and rejected a structurally invalid backup.
- Confirmed free-mode session replacement warns before removing prior history.
- Confirmed an unsupported camera gives a usable Bluetooth/manual fallback.
- With Chromium's fake camera and detector, confirmed no camera request before “Use camera”, exactly one request after activation, a detected code applied once, the dialog closed, and the video track reached `ended`.
- Simulated 100 products plus 5 unknown codes: 100/100 products counted, 5/5 unknowns reconciled (100%), 100 export rows, 13.783 seconds of automation time, and no errors. This is not a substitute for the brief's human 40%-faster pilot.

## Accessibility and responsive evidence

- Tested onboarding, active count, completed summary, privacy, and terms states.
- Axe found **zero serious or critical findings**; in the six independently scanned states it found zero violations of any impact.
- Semantic checks passed: `lang="en"`, descriptive title, one `h1`, one `main`, and no image missing `alt`.
- Keyboard smoke test passed: the skip link is first in focus order, activates, global scanner input works without pointer use, the scan field regains focus, native dialogs accept Escape, and focus returns to the opener.
- Focus ring is a visible 3px amber outline. Reduced motion sets transitions/animations effectively to zero and smooth scrolling to `auto`.
- Manual inspection at 1366px desktop and 390×844 mobile found no clipping or horizontal overflow. No exposed mobile interactive target was below 44×44 CSS px after excluding intentionally visually-hidden submit controls.
- The visual system is product-specific and matches `.factory/design.md`; the generated asset's source, prompt, and provenance are present.

## Live deployment, PWA, and performance

- HTTP redirects to HTTPS with 301; HTTPS root returns 200.
- **All 18 files in local `dist/` matched the live response bodies byte-for-byte.** Representative SHA-256 matches:
  - `index.html`: `6ad8094f998ba691807d3f655409b99eb30a545d7cbc37f4e1398876ba25bf52`
  - JS: `6ce642fc5d7207f51cf1d8ef354b6dd76aba40df8f9a96f4173d542b4cac32d1`
  - CSS: `e2da03f54e77bd08452720199ecb65a29f8f700c59a2d50077f0e69fad952d3f`
  - service worker: `3078108fc96d3fa9ff0cea0dfae64bce39e963bdfbd71b9470513f1b4c240e96`
- Chromium manifest inspection: no parse errors and no installability errors; 192px, 512px, and maskable icons are present.
- Live Cache Storage contained `scan-count-pad-v4` with the app shell, both hashed assets, manifest, icons, illustration, `/`, and `/index.html`.
- Forced service-worker update emitted `updatefound`, activated the new controller, and displayed the in-app update toast.
- With the browser context fully offline, root reload retained the app, displayed the Offline state, and `/privacy` loaded from the PWA fallback.
- Lighthouse 13.4.1 mobile: Performance 97, Accessibility 100, Best Practices 100, SEO 100. FCP 1.0 s, LCP 1.3 s, TBT 200 ms, CLS 0, total transfer 65 KiB. Lab INP is unavailable without field interaction.
- Factory `verify-url.sh`: load 698 ms; title/lang/h1/main/alt/button checks passed; zero browser errors.

## Privacy, outbound traffic, and paid unlock

- Ordinary local and live count workflows contacted only their own origin. No analytics, tracking, CDN fonts, or third-party scripts were observed.
- Catalogs, sessions, history, and counts persisted only in IndexedDB; license state is the only localStorage data used.
- Camera lifecycle evidence is described above; no frame upload request occurred.
- The only intended cross-origin request is license verification at `api.sociobot.in`. A mocked token-capture test confirmed the query token is saved under `sb_license:scan-count-pad`, removed from the address bar, and sent only to the Sociobot endpoint.
- A mocked valid verdict remained unlocked across reload and triggered only one verification request inside the 24-hour cache window.
- Fresh production evidence supersedes the builder handoff's deployment-only caveat: checkout now returns 303 to Sociobot's Dodo-hosted checkout, and invalid verification returns `{ "valid": false, "reason": "invalid" }` with correct CORS. No purchase was completed.
- The product has no sign-in flow; Entra tenant verification is not applicable.
- This artifact is static and has no product-owned backend, health endpoint, or server persistence/concurrency boundary. The shared unlock endpoint was tested as required and failed rate-limit acceptance.

## Reverification commands

```sh
npm ci
npm audit --audit-level=low
npm test
npm run build
```

With the production preview running in one terminal:

```sh
npm run preview -- --host 127.0.0.1
```

Run the verifier harnesses in another:

```sh
node .factory/qa-independent.mjs
node .factory/qa-scale.mjs
node .factory/qa-camera.mjs
node .factory/qa-live-pwa.mjs
```

After correcting V-01 through V-04, rerun the clean suite and verifier harnesses, then repeat the live file-parity, response-header, rate-limit, Lighthouse, and offline/update checks on the new candidate.
