

# Nepal Bus & Tours

Production-oriented Nepal bus ticketing and tour package platform with only two roles:

- `PASSENGER`
- `BUS_OWNER`

## What changed

- Removed the old admin vs owner separation from the runtime app
- Added role-based registration and auto-redirect login
- Added refresh tokens, JWT auth, bcrypt hashing, rate limiting, and helmet
- Added socket-based notifications and seat lock updates
- Added Excel exports through `exceljs`
- Added reset and cleanup scripts for database hygiene

## Backend

Key folders:

```text
backend/
  app.js
  server.js
  controllers/
  middleware/
  models/
  routes/
  scripts/
  utils/
```

### Important endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/routes`
- `GET /api/seats/state`
- `POST /api/seats/lock`
- `POST /api/seats/unlock`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `POST /api/payments/upload`
- `GET /api/tours`
- `POST /api/tours/book`
- `GET /api/owner/stats`
- `GET /api/owner/routes`
- `GET /api/owner/payments`
- `GET /api/owner/bookings`
- `GET /api/exports/users.xlsx`
- `GET /api/exports/bookings.xlsx`
- `GET /api/exports/payments.xlsx`
- `GET /api/notifications`

### Scripts

- `npm run dev`
- `npm run start`
- `npm run migrate:cleanup`
- `npm run reset-db`

`reset-db` is interactive and requires typing `DELETE` before it removes all app data.

## Frontend

The Vite app now exposes:

- Landing page
- Single login/register flow with role selection
- Passenger booking experience
- Bus owner dashboard
- Profile and notification views

## Environment

Use `backend/.env.example` as the starting point.

Required values:

- `MONGO_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

## Notes

- The runtime app no longer routes to an admin dashboard.
- Legacy admin files may still exist in the repo for reference, but they are no longer mounted by the server or referenced by the new UI.
