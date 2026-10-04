# CleanConnect

CleanConnect is a civic-tech prototype for reporting nearby waste and coordinating collection. It demonstrates the citizen-side loop with realistic local demo data:

`Citizen reports waste -> location is attached -> team is assigned -> vehicle is tracked -> collection is verified`

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Available scripts

- `npm run dev` starts the development server.
- `npm run build` runs TypeScript validation and creates a production build.
- `npm run lint` runs Oxlint.
- `npm run preview` serves the production build locally.

## Demo experience

The dashboard is pre-populated with citizen reports, neighborhood map markers, a pickup request in progress, green points, and impact metrics. Use the top-right role switcher to preview the Citizen, Driver, and Admin demo modes. The main actions are fully interactive:

- **Report waste** opens a photo, category, severity, description, and detected-location form.
- **Request garbage pickup** opens a pickup type, quantity, date, time slot, address, and instruction form.
- Report rows, the map, vehicle tracker, notifications, and navigation controls provide working demo feedback.

## Environment contract

The current prototype includes a browser-backed demo database in `src/database.ts`. It uses `localStorage` to persist users, sessions, reports, pickup requests, theme preference, and uploaded image data URLs. This makes the demo survive refreshes without requiring a server. For production, replace this adapter with PostgreSQL plus object storage while keeping the UI service boundary.

The planned service boundaries are documented in `.env.example`:

- `VITE_API_BASE_URL` for the REST API
- `VITE_MAP_STYLE_URL` for a MapLibre/OpenStreetMap style
- `VITE_STORAGE_PUBLIC_URL` for report and proof images

Do not place private API keys in `VITE_*` variables. Private credentials belong in the future backend service.

## Authentication and uploads

The first screen now supports **Sign in** and **Create account**. New accounts are stored locally in the current browser and can sign out from the avatar control. Report photos accept image files up to 10 MB, show a preview immediately, and are saved with the report record. Report and pickup form submissions are no longer toast-only actions.

Use the light/dark toggle on the auth screen or in the workspace header. The choice is persisted locally.

## Suggested production implementation slices

1. Add a Node/Express API with JWT sessions and role middleware.
2. Add PostgreSQL tables for users, reports, locations, assignments, pickups, vehicles, notifications, ratings, and audit logs.
3. Replace the local arrays and toast handlers with API calls and optimistic loading states.
4. Add object storage for before/after collection proof and MapLibre for live locations/routes.
5. Add separate Driver and Admin workspaces using the existing role switcher as the entry point.

## Architecture target

```text
React + TypeScript UI
        |
REST API + role authorization
        |
Business services: assignment, SLA, route, rewards, notifications
        |
PostgreSQL + object storage + configurable map provider
```
