# Assembly Line Manager – Frontend

Angular 17 (standalone components) client for the Assembly Line Manager API, using Angular
Material and the CDK Drag & Drop module for the allocations screen.

## Requirements

- Node.js 20+
- The backend running at `http://localhost:3000` (see the backend's own README)

## Setup

```bash
npm install
npm start
```

The app runs at `http://localhost:4200` and talks to the API at the URL configured in
`src/environments/environment.ts` (defaults to `http://localhost:3000/api`).

Log in with the seeded demo account: `admin@example.com` / `admin123`.

## Running unit tests

```bash
npm test
```

Runs the Jasmine/Karma suite in headless Chrome. Every component, the auth guard, the auth
interceptor and the auth service have dedicated spec files.

## Project structure

```
src/app/
├── core/
│   ├── auth/          # AuthService, functional guard & interceptor
│   ├── models/        # TypeScript interfaces mirroring the API responses
│   └── services/      # Thin HttpClient wrappers per resource
├── layout/
│   └── shell/         # Toolbar + nav shown once logged in
└── features/
    ├── login/
    ├── products/
    ├── assembly-lines/
    ├── workstations/
    └── allocations/    # Drag & drop allocation screen
```

Every component has its own `.ts`, `.html` and `.scss` file (no inline templates/styles), and a
matching `.spec.ts` next to it.

## How allocations & drag-and-drop work

The allocations screen (`/assembly-lines/:lineId/allocations`) shows two CDK-connected drop
lists: **Available workstations** and **Allocated (in order)**.

- Dragging within the allocated list reorders it and calls `PUT .../allocations/reorder` with
  the full, new list of allocation ids.
- Dragging from Available → Allocated calls `POST .../allocations` to create the allocation. The
  local list is only updated once the server responds with the real allocation id — no
  optimistic placeholder objects.
- Dragging from Allocated → Available calls `DELETE .../allocations/:id`.
- Arrow / X buttons on each item provide the same actions without dragging, for accessibility
  and touch devices.
- If any request fails, the relevant local state change won't have happened yet (add/remove) or
  the whole screen reloads from the server (reorder), so the UI never drifts from what's
  actually stored.

## Authentication

- `AuthService` stores the JWT and the current user in `localStorage` and exposes the current
  user as a signal.
- `authGuard` (functional `CanActivateFn`) protects every route except `/login`, redirecting
  with a `returnUrl` query param.
- `authInterceptor` (functional `HttpInterceptorFn`) attaches `Authorization: Bearer <token>` to
  every request and logs the user out automatically on a `401` from any endpoint other than
  login/register.

