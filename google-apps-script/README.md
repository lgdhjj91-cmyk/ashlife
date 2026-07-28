# Ashlife Badge Order Receiver

This standalone Google Apps Script web app receives only finished Badge Studio output:

- 300 DPI A4 PNG sheets
- the combined A4 PDF
- one compressed JPG preview
- order-information JSON

It does not receive the customer's original photos and does not make Drive files public.

See [SETUP.md](SETUP.md) for deployment and testing.

## Request Actions

- `startOrder` creates or resumes an incomplete order folder.
- `uploadFile` adds one allowlisted file and is retry-safe by filename.
- `completeOrder` checks that PNG, PDF, and JSON output exists before marking complete.
- `checkOrder` reports `missing`, `uploading`, or `complete`.

The frontend sends JSON as a plain request body so it does not trigger an avoidable CORS preflight. Apps Script may redirect responses to a Google-hosted content URL; the frontend follows that redirect.

## Security Boundary

`VITE_BADGE_APP_KEY` is compiled into a public static site. It is not a true secret. The matching Script Property is only a basic abuse deterrent. Real protection comes from file allowlists, limits, duplicate detection, rate limiting, a fixed parent folder, and the `SUBMISSIONS_ENABLED` emergency switch.
