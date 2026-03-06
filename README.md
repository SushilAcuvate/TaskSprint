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
