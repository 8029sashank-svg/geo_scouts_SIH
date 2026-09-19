# Geo-Farm Field Scout Portal

SIH26131 — Early detection & management of crop diseases and pest infestations.

Mobile-first portal for verified agriculture field scouts: receive missions,
check in at the field, collect photo/trap evidence, get an AI-assisted
preliminary result, verify it, and submit a report for Agriculture Officer
review.

## Frontend

```
npm install
npm run dev
```

Build for production:

```
npm run build
```

## Backend (MVP)

Small Express API with JSON-file storage (`server/data/`). Field reports
submitted from the app are posted here so a future Agriculture Officer
portal can read them.

```
npm run server
```

Runs on `http://localhost:4000`. The frontend works fully without it —
reports just queue locally and sync when the backend becomes reachable
(see the sync status on the Dashboard and Reports screen).

To point the frontend at a different backend URL, set `VITE_API_URL`
(defaults to `http://localhost:4000/api`).

## API

```
GET   /api/health
GET   /api/missions
GET   /api/reports
GET   /api/reports/:id
POST  /api/reports
PATCH /api/reports/:id/status
```

## Notes

- All AI results (disease classification, trap pest counts) are simulated
  for the demo — no real model inference.
- Language toggle (EN/MR), offline/sync simulation, and the old
  farmer/officer components (unused, kept for reference) are unchanged.
