# Scan Count Pad

Scan Count Pad is an installable stock-count utility for one shop or workshop. Import a CSV, count at the shelf, reconcile unknown codes, and export reviewed adjustments.

Live product: <https://scan-count-pad.sociobot.in>

One-click demo: <https://scan-count-pad.sociobot.in/demo>

## What it does

- Imports `sku`, `name`, optional `barcode`, and optional `expected` columns from CSV.
- Accepts scanner-as-keyboard input, manual SKU/barcode entry, tap adjustments, and supported browser camera barcode scanning.
- Keeps unknown scans separate until a person matches, adds, or ignores them.
- Shows variance without treating untouched products as zero.
- Saves the catalog and count sessions in IndexedDB, works offline, and supports JSON backup/restore.
- Exports a standard adjustment CSV with `expected`, `counted`, and `adjustment` columns. Formula-leading catalog text is prefixed with an apostrophe for spreadsheet safety.

The complete latest-session workflow and CSV export are free. A $19 one-time Sociobot license unlocks an unlimited on-device session archive. Accessibility, data export, and safety checks are never gated.

## Try the demo

Open `/demo` or select **Try it with sample data** on the first screen. The demo starts with four products, three counts, and one unknown barcode.

Demo changes use the separate `demo:scan-count-pad` IndexedDB database. **Reset demo** restores the sample. **Start for real** clears the demo store and opens the real workspace. See [`.factory/demo.md`](.factory/demo.md).

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the URL Vite prints. To test a hardware scanner, leave focus outside other form fields and scan; devices that emit a final Enter are handled automatically.

## Test and build

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

`npm test` runs unit tests and Chromium browser tests at desktop and 390 px. It includes axe checks, camera lifecycle, demo isolation, claims, and offline reload. The production command is `npm run build`; output lands in `dist/`.

Visitor-facing promises and their exact commands are listed in [`.factory/claims.json`](.factory/claims.json).

## CSV example

```csv
sku,barcode,name,expected
BOLT-01,8901001,Brass bolts,120
TAPE-02,8901002,Paper tape,18
```

SKU and name are required. SKU and barcode values must be unique across the catalog. The importer rejects malformed rows rather than guessing.

## Privacy and deployment

Catalogs, scans, and session history stay in the browser. Camera frames are processed locally and never uploaded. The only product API request verifies a license through Sociobot. See `/privacy` and `/terms` in the built site.

Deploy `dist/` with `/opt/fleet/lib/deploy-static.sh scan-count-pad dist`. The included Azure Static Web Apps policy sets immutable asset caching, security headers, manifest MIME, and no-store service-worker caching.

Design rationale and generated-art provenance are in [`.factory/design.md`](.factory/design.md). Implementation verification and known gaps are in [`.factory/handoff.md`](.factory/handoff.md).

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).
