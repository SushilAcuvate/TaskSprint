# TaskSprint

Developer Task Manager implemented as a React-based Chrome Extension popup UI.

## Features

- Manager dashboard to create tasks with `Task Title`, `Assign Developer`, `Due Date`, `Description`, and `Task Status`.
- Compact task card layout optimized for extension popup width.
- Status badges:
- `Pending` (orange)
- `In Progress` (yellow)
- `Done` (green)
- Role-based visibility:
- Manager can view all tasks.
- Developer can only view tasks assigned to that developer.
- Developer status updates with forward-only flow: `Pending -> In Progress -> Done`.
- Overdue monitoring with automatic Chrome notifications.

## Tech Stack

- React 18
- Vite 5
- Chrome Extension Manifest V3 (`storage`, `alarms`, `notifications`)

## Project Structure

- `src/App.jsx` - Main React UI and task logic.
- `src/main.jsx` - React mount entry.
- `src/styles.css` - Popup styles.
- `popup.html` - Vite HTML entry for popup build.
- `public/manifest.json` - Extension manifest copied to build output.
- `public/background.js` - Service worker for overdue checks/notifications.
- `public/icons/alert-128.png` - Notification icon.
- `public/icons/icon-{16,32,48,128}.png` - Extension toolbar and store icons (replace placeholders with brand art before publishing).

## Publish to Chrome Web Store

### 1. Prepare icons

Placeholder icons are already provided in `public/icons/` at the required sizes. Before publishing, replace them with your actual brand icons:

| File | Size |
|------|------|
| `public/icons/icon-16.png` | 16 × 16 px |
| `public/icons/icon-32.png` | 32 × 32 px |
| `public/icons/icon-48.png` | 48 × 48 px |
| `public/icons/icon-128.png` | 128 × 128 px |

These icons are used in the Chrome toolbar, the Extensions management page, and the Chrome Web Store listing. The 128 × 128 icon is required by the Chrome Web Store.

### 2. Build and package the extension

Run the following command to produce a `tasksprint.zip` ready for upload:

```bash
npm run zip
```

This runs `npm run build` to compile the extension into `dist/`, then zips the entire `dist/` folder into `tasksprint.zip` at the project root.

### 3. Create a Chrome Web Store developer account

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with a Google account.
3. Pay the one-time **$5 USD** developer registration fee (if not already registered).

### 4. Create a new item

1. Click **New Item** in the dashboard.
2. Upload `tasksprint.zip`.
3. Fill in the store listing details:
   - **Name** – Developer Task Manager
   - **Short description** – Manage and track developer tasks in a compact Chrome extension dashboard.
   - **Detailed description** – Describe all features, permissions used, and how data is stored.
   - **Screenshots** – At least one 1280 × 800 or 640 × 400 screenshot of the popup UI.
   - **Category** – Productivity
   - **Language** – English

### 5. Justify permissions

The extension requests the following permissions that require justification in the store listing:

| Permission | Purpose |
|------------|---------|
| `storage` | Persists tasks and user role settings in `chrome.storage.local` |
| `alarms` | Schedules a background check every 15 minutes for overdue tasks |
| `notifications` | Shows a desktop notification when a task becomes overdue |

Provide clear, user-facing descriptions for each permission when prompted during the submission form.

### 6. Publish

1. Review all details in the draft listing.
2. Click **Submit for review**.
3. Google's review typically takes **1–3 business days** for new items.
4. Once approved, the extension will be publicly available on the Chrome Web Store.

### Updating a published extension

1. Increment `version` in `public/manifest.json` (e.g. `"1.0.0"` → `"1.1.0"`).
2. Run `npm run zip` to create a fresh `tasksprint.zip`.
3. In the Developer Dashboard, open your published item and click **Upload new package**.
4. Upload the new ZIP and click **Submit for review**.

---

## Run Locally

1. Install dependencies:
	`npm install`
2. Build the extension:
	`npm run build`
3. Open Chrome and go to `chrome://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select: `/workspaces/TaskSprint/dist`.
7. Pin the extension and open the popup.

## Development

- Run local React dev server: `npm run dev`
- Rebuild extension bundle after changes: `npm run build`

## Behavior Notes

- Tasks are stored in `chrome.storage.local`.
- Overdue checks run every 15 minutes via `chrome.alarms` and also on startup/install.
- Notifications are created once per task+due-date marker to avoid alert spam.
