# Scan Count Pad

Scan Count Pad is a local-first, installable stock-count utility for a single-location shop or maker. It turns a CSV catalog into a fast shelf workflow for a phone, mounted tablet, or Bluetooth barcode scanner, then exports reviewed adjustments as CSV.

Live product: <https://scan-count-pad.sociobot.in>

## What it does

- Imports `sku`, `name`, optional `barcode`, and optional `expected` columns from CSV.
- Accepts scanner-as-keyboard input, manual SKU/barcode entry, tap adjustments, and supported browser camera barcode scanning.
- Keeps unknown scans separate until a person matches, adds, or ignores them.
- Shows variance without treating untouched products as zero.
- Saves the catalog and count sessions in IndexedDB, works offline, and supports JSON backup/restore.
- Exports a standard adjustment CSV with `expected`, `counted`, and `adjustment` columns.

The complete latest-session workflow and CSV export are free. A $19 one-time Sociobot license unlocks an unlimited on-device session archive. Accessibility, data export, and safety checks are never gated.

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
npm run build
npm run preview
```

`npm test` runs CSV unit coverage plus Chromium end-to-end tests at desktop and 390 px mobile, axe accessibility checks, and an explicit offline reload. The exact production command is `npm run build`; static output lands in `dist/` with `dist/index.html` at its root.

## CSV example

```csv
sku,barcode,name,expected
BOLT-01,8901001,Brass bolts,120
TAPE-02,8901002,Paper tape,18
```

SKU and name are required. SKU and barcode values must be unique across the catalog. The importer rejects malformed rows rather than guessing.

## Privacy and deployment

Catalogs, scans, and session history stay in the browser. Camera frames are processed locally and never uploaded. The only product API request verifies a license through Sociobot. See `/privacy` and `/terms` in the built site.

Deploy the contents of `dist/` to any static host. Configure immutable caching for hashed files under `assets/`; do not cache `sw.js` permanently. The service worker handles the offline application shell.

Design rationale and generated-art provenance are in [`.factory/design.md`](.factory/design.md). Implementation verification and known gaps are in [`.factory/handoff.md`](.factory/handoff.md).

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).
