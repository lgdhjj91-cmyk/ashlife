# Ashlife Badge Studio Design

Date: 2026-07-28

## Goal

Add a playful, browser-based 58 mm badge customization experience to Ashlife Playroom. Customers upload photos, position them inside circular badge artwork, mix quantities, preview true A4 sheets, download print files, and optionally submit the completed order to Google Drive through Google Apps Script.

## Placement and Navigation

- Add a featured `Badge Studio` card to `/play`.
- Open the studio at `/play/badge-studio`.
- Keep the existing `/diy` product information unchanged.
- Reuse the Playroom palette, rounded controls, shadows, typography, and mobile behavior.

## Customer Flow

1. **Upload** — select or drag up to 20 JPG, PNG, or WebP images.
2. **Customize** — move, zoom, and rotate one image behind a circular mask.
3. **Arrange** — expand design quantities into A4 slots and reorder them.
4. **Details** — enter name, WhatsApp number, notes, and acknowledgements.
5. **Finish** — export, submit when configured, and open WhatsApp with the order ID.

The user can move backward without losing the current session. Draft design data and image blobs are stored in IndexedDB.

## Badge Editor

- Product size: 58 mm.
- Default artwork diameter: 70 mm.
- Default safe area: 54 mm.
- Print resolution: 300 DPI.
- The values live in one configuration module and must be calibrated against the owner's real cutter and badge machine.
- The preview shows a solid artwork/cut line and a dotted safe-area line. Guides never appear inside artwork pixels.
- The image keeps its original aspect ratio and uses cover-fit as the initial transform.
- Pointer drag works on mouse and touch. Two-pointer pinch changes scale. Sliders and buttons provide accessible alternatives.
- Each design supports replace, reset, duplicate, delete, and quantity from 1 to 20.

## Print Layout

A4 is rendered as 210 × 297 mm at 300 DPI (2480 × 3508 rounded pixels). With the conservative 70 mm artwork diameter, the default template uses eight non-overlapping slots in two columns by four rows. This avoids inventing a ten-slot arrangement that cannot physically fit the configured diameter.

The slot coordinates are centralized. Changing the measured artwork diameter or a production-tested slot template changes one configuration file.

Quantities expand in collection order. More than eight badges automatically create additional sheets. Customers can move expanded items left or right before export.

## Export

The browser creates:

- one 300 DPI PNG per A4 sheet;
- one true-A4 multi-page PDF;
- one compressed JPEG preview;
- one order-information JSON file.

The visible UI is never screenshot for print. An off-screen canvas redraws source images from the saved transforms at print resolution.

## Image Quality

Quality is calculated locally from source image dimensions and the maximum crop scale needed for the configured artwork diameter:

- Good: at least 100% of the required print pixels.
- Acceptable: at least 70%.
- Low: below 70%.

Low-quality designs show a warning and require acknowledgement before finishing, but are not blocked.

## Google Apps Script Submission

The repository includes a standalone Apps Script package. The static frontend sends small JSON requests sequentially:

1. `startOrder`
2. one `uploadFile` request per generated file
3. `completeOrder`

The script validates order IDs, filenames, MIME types, file size, total file count, submission state, and a basic application key. It creates a dated private Drive folder under a Script Property parent folder.

A key embedded in a static frontend is only an abuse deterrent, not a secret. The backend therefore relies primarily on strict allowlists, small limits, duplicate detection, a cooldown, and an emergency `SUBMISSIONS_ENABLED` switch. The UI remains fully usable for local downloads when no endpoint is configured or submission fails.

## Error Handling

- Invalid or oversized photos are rejected individually with readable messages.
- Export failures keep the design editable.
- Submission disables duplicate clicks and reports the exact stage.
- A failed upload can be retried with the same order ID.
- Generated files remain available for manual download.
- Unsupported browser storage falls back to the active in-memory session.

## Accessibility and Mobile

- All interactive controls are at least 44 px tall.
- Buttons have explicit labels and visible focus states.
- Sliders have numeric output.
- The mobile view stacks the editor before the design collection and uses a sticky summary action bar.
- Reduced-motion preferences disable nonessential transitions.
- Color never carries quality or selection meaning alone.

## Testing

Node tests cover millimetres-to-pixels conversion, quantity expansion, sheet pagination, order IDs, filename sanitation, upload validation, image quality classification, and Apps Script payload validation helpers.

Rendered verification covers desktop and 390 px mobile layout, upload, drag/zoom/rotation, duplication, quantity expansion, arrangement, export, draft restoration, validation, and the unconfigured/failing submission fallback.

## Intentional First-Version Limits

- 58 mm product only.
- No text, stickers, frames, AI crop, background removal, login, payment, or customer accounts.
- No original customer photos are submitted to Drive.
- Drive submission cannot be live-tested until the owner deploys the included Apps Script and configures a Drive folder.

