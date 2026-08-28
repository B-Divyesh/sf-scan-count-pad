# Scan Count Pad — visual thesis

## Direction: the impossible counting bay

Scan Count Pad is a focused work surface for a person standing at a shelf, not a miniature ERP. Its world is a surreal editorial stockroom: precise paper labels and ruler marks sit against impossible cobalt shelves, while a vermilion scanner beam turns anonymous objects into countable units. The imagery makes the physical job recognizable; the interface itself remains terse and operational.

The experience is intentionally single-mode and dark. A dim counting bay prevents glare on a mounted tablet, makes status colors unmistakable, and gives the scanner input a visible "ready" state. The background is explicitly painted; it never inherits the browser theme.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#F4EEDA` | Primary type, warm label paper |
| `--muted` | `#B9B3A3` | Supporting type (7.2:1 on night) |
| `--night` | `#10131C` | App background |
| `--bay` | `#191E2A` | Raised work surface |
| `--bay-high` | `#242B3A` | Inputs and selected rows |
| `--cobalt` | `#3659D9` | Shelf planes and focus geometry |
| `--signal` | `#FF674D` | Primary action / scanner beam |
| `--signal-dark` | `#7E2518` | Pressed signal |
| `--mint` | `#71D7AE` | Reconciled / on-target |
| `--amber` | `#F1C35A` | Variance / attention |
| `--danger` | `#FF8B88` | Destructive and invalid states |

All text pairs meet WCAG AA; state is always repeated by label, icon, or wording. Cobalt is decorative or used with warm-white text.

## Type

Two self-host-free system stacks keep the offline bundle tiny. Display and numeric readouts use **Arial Narrow / Roboto Condensed / sans-serif**, uppercase with restrained tracking—the language of carton stamps. UI copy uses **Atkinson Hyperlegible / system-ui / sans-serif** for legibility at arm's length. Counts and table columns use tabular figures. The scale is 13, 16, 20, 28, and clamp(38–68) px; body copy never drops below 16 px.

## Spacing and shape

An 8 px base rhythm with 4 px micro-spacing. Operational controls are at least 48 px; scan and quantity controls are 56 px. Corners are clipped rather than softly rounded (`2px`, `8px`, or a single 18px label corner). Thin rules and registration marks recall printed stock cards. Cards appear only for independent objects: the import bay, active scan readout, unknown queue, and license.

## Interaction grammar

- A Bluetooth scanner behaves like a keyboard: its completed line is captured anywhere outside a text field.
- The scan field is visually continuous with the latest result; successful counts create one short upward "ticket" movement from the input origin.
- Quantity buttons sit beside the counted value, never behind menus. `+1` is the dominant repeat action.
- Selection and reconciliation use cobalt inset edges; variance uses an amber diamond plus text.
- Destructive actions name their target and require confirmation. The last scan can be undone from the result strip.

## Responsive intent

At 390 px, decorative shelf scenery moves behind the onboarding copy, catalog columns collapse into stacked labels, and actions become a two-column thumb grid. The scan input stays near the top of the active session. Desktop uses a two-column bay: scan/reconcile on the left, count sheet on the right. No control is hidden behind a fixed footer or notch.

## Motion policy

State transitions use 180–240 ms opacity/transform. The scanner beam sweeps once when a code resolves; rows enter from the scan field's direction. No animation loops. Under `prefers-reduced-motion`, transforms and smooth scrolling are removed and status changes are immediate.

## Asset plan and provenance

Primary asset: `public/art/counting-bay.webp`, a wide editorial still used only in the empty/onboarding state and social preview. It is original generated imagery, not a depiction of camera recognition.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide PWA onboarding illustration. A surreal editorial stockroom at night where deep cobalt shelving folds into an impossible staircase; neat unbranded cream cartons and small hardware bins carry blank paper barcode-like tick labels; one handheld scanner rests on a counting clipboard and casts a narrow vermilion beam; composition weighted to the right with calm dark negative space on the left; tactile cut-paper, screenprint grain and dimensional paper-set photography; warm cream, ink black, cobalt blue, signal vermilion, tiny mint accents; crisp legible object silhouettes, dramatic raking light, no people, no readable text, no logos, no brands, no watermark, no UI screenshot, no floating numbers, no QR codes.

Generated 2026-08-28 with the Param Factory Azure image deployment via `/opt/fleet/lib/gen-image.sh`. Original PNG and prompt sidecar live in `assets/src/`; shipped WebP is optimized to less than 300 KB. Generated imagery is disclosed in the product footer.

App icons are original SVG geometry authored for this project: stacked shelf ticks crossed by one scanner beam. They are exported locally to PNG for the manifest.
