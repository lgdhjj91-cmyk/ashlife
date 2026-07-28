# Google Drive Submission Setup

## 1. Prepare private Drive folders

In your Google Drive create:

```text
Ashlife Badge Orders
├── 01 - New Submissions
├── 02 - Confirmed and Paid
├── 03 - Printed
├── 04 - Completed
└── 05 - Delete After 30 Days
```

Open `01 - New Submissions` and copy the folder ID from the browser address. Keep the folder private.

## 2. Create the Apps Script project

1. Open [Google Apps Script](https://script.google.com/).
2. Create a new standalone project named `Ashlife Badge Orders`.
3. Replace the default `Code.gs` with this folder's `Code.gs`.
4. Open **Project Settings**, enable the manifest file, and replace `appsscript.json` with this folder's version.
5. Confirm the project timezone is `Asia/Kuala_Lumpur`.

## 3. Configure Script Properties

In **Project Settings → Script Properties**, add:

| Property | Example | Purpose |
| --- | --- | --- |
| `DRIVE_PARENT_FOLDER_ID` | your `01 - New Submissions` folder ID | Private destination |
| `APP_SHARED_SECRET` | a long random value | Basic abuse deterrent |
| `ALLOWED_ORIGIN` | `https://lgdhjj91-cmyk.github.io` | Expected website origin |
| `MAX_FILE_SIZE_BYTES` | `25000000` | Maximum decoded bytes per file |
| `MAX_FILES_PER_ORDER` | `12` | Sequential upload limit |
| `MAX_ORDER_STARTS_PER_HOUR` | `30` | Global start-order cooldown |
| `SUBMISSIONS_ENABLED` | `true` | Emergency on/off switch |

Do not put the Drive folder ID in the Ashlife frontend.

## 4. Deploy the web app

1. Select **Deploy → New deployment**.
2. Choose **Web app**.
3. Execute as: **Me**.
4. Who has access: choose the option that allows the public Ashlife site to call it (normally **Anyone**).
5. Authorize Drive access when Google asks.
6. Copy the `/exec` web app URL.

The web app runs as you, so customer files can be saved without giving customers access to your Drive.

## 5. Configure the Ashlife build

Add these values to the environment used for the GitHub Pages build:

```dotenv
VITE_BADGE_UPLOAD_ENDPOINT=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
VITE_BADGE_APP_KEY=the-same-value-as-APP_SHARED_SECRET
```

Vite variables are compiled at build time. On GitHub Actions, store the values as repository Actions secrets or variables and expose them to the build step. Rebuild and redeploy after changing them.

Remember: a `VITE_` key is visible in the browser bundle. It is not private authentication.

## 6. Test safely

1. Keep `SUBMISSIONS_ENABLED=true`.
2. Open the deployed `/play/badge-studio` page from the real GitHub Pages URL, not only localhost.
3. Upload one small photo and create one badge.
4. Complete the order form and submit.
5. Confirm Drive contains:

```text
01 - New Submissions/
└── YYYY/
    └── MM - Month/
        └── ASH-YYYYMMDD-XXXXXX/
            ├── .ashlife-order-state.json
            ├── ASH-...-print-sheet-01.png
            ├── ASH-...-badge-order.pdf
            ├── ASH-...-preview.jpg
            └── ASH-...-order-info.json
```

6. Open the PDF and PNG.
7. Print at **100% / Actual size** and physically test the 70 mm artwork circle with your cutter and 58 mm badge machine.
8. Change `artworkDiameterMm`, `safeAreaDiameterMm`, and slot coordinates in `src/playroom/games/badge-studio/badgeStudioConfig.js` only after that physical test.

## 7. Updating Apps Script

After changing `Code.gs`:

1. Save the project.
2. Select **Deploy → Manage deployments**.
3. Edit the web-app deployment.
4. Choose **New version**.
5. Deploy.

The deployment URL can remain the same.

## 8. Logs and emergency controls

- Use **Executions** in Apps Script to inspect errors and duration.
- Change `SUBMISSIONS_ENABLED` to `false` to immediately reject new submissions.
- Lower `MAX_ORDER_STARTS_PER_HOUR` if abuse appears.
- Move paid orders manually from `01 - New Submissions` to `02 - Confirmed and Paid`.
- Do not print solely because a folder was created; first confirm payment and inspect the preview.

## CORS troubleshooting

The frontend sends a plain JSON body with no custom headers and follows redirects. Test from the real GitHub Pages origin because localhost does not prove deployment behavior.

If the browser cannot read the Apps Script response:

1. Confirm you used the `/exec` URL, not `/dev`.
2. Confirm public web-app access is enabled.
3. Create a new deployment version.
4. Confirm `ALLOWED_ORIGIN` exactly matches the site origin without a path.
5. Inspect the Apps Script execution log.

Do not switch to `mode: "no-cors"` as a permanent fix: it would prevent the site from confirming that Drive received the files.
