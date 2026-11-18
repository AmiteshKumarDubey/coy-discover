# Coy — Discover Tab

A swipe-based profile discovery feature built as a standalone Next.js app for the Coy SDE Intern assignment (Part B).

## Overview

This app implements a **Discover tab** — a Tinder/Bumble-style swipe experience — with Coy's core privacy promise: **likes are never revealed unless they are mutual**.

The app has two tabs:
- **Home** — blank placeholder (Part A is a separate written task)
- **Discover** — full swipe functionality (all implementation lives here)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Hand-crafted CSS in `globals.css` (no Tailwind dependency) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database (production) | [Turso](https://turso.tech) — managed LibSQL / SQLite at the edge |
| Database (local dev) | LibSQL file driver — `file:coy.db` (no Turso account needed) |
| DB client | `@libsql/client` |
| Hosting | Vercel (serverless) |

---

## Features

- 📱 **Mobile-first** — drag/swipe gestures on touch, Like/Pass buttons on desktop
- 🃏 **Card stack UI** — smooth swipe animations with LIKE/NOPE stamp overlays
- 💜 **Match modal** — "It's a Match!" screen on mutual likes
- 🔒 **Privacy core** — incoming likes are never revealed unless both users have liked each other
- 🍪 **Anonymous guest identity** — each browser gets a persistent UUID cookie; no login required
- 💾 **Persistent** — swipe history and matches survive page reloads, browser restarts, and Vercel redeployments (stored in Turso)
- 🌟 **Empty state** — shown when all profiles have been swiped
- ⚡ **Optimised loading** — combined init endpoint, module-level cache, shimmer skeleton, image preloading

---

## Guest Identity System

The app does not require login or registration. Instead, each browser visitor is assigned a **unique anonymous UUID** on their first request.

### How it works

1. On the first API call from a browser, the server generates a `crypto.randomUUID()` and sets it as an **HTTP-only cookie** named `coy_guest_id`.
2. All subsequent API requests from the same browser automatically include this cookie.
3. Every swipe and match is stored in Turso against that UUID — not against any shared user account.
4. **Different browsers and devices get completely separate UUIDs** and therefore have independent swipe histories and match lists.
5. The cookie is set with `SameSite=Lax`, `HttpOnly`, `Secure` (in production), and a **1-year `Max-Age`** so the identity survives page refreshes and browser restarts.

### Privacy guarantee

- The server never exposes which profiles have liked the current guest unless the guest has also liked them back.
- The `/api/matches` endpoint returns only **mutual matches** — profiles where the guest liked them *and* they carry an `incoming_like = 1` flag in the database.
- One-sided incoming likes are invisible to the frontend at all times.

### Cookie attributes

| Attribute | Value |
|---|---|
| Name | `coy_guest_id` |
| Value | UUID v4 (e.g. `3f8a1b2c-...`) |
| HttpOnly | Yes — JavaScript cannot read it |
| Secure | Yes in production (HTTPS only) |
| SameSite | Lax |
| Path | `/` |
| Max-Age | 31 536 000 s (1 year) |

---

## Database

### Production — Turso (LibSQL)

The production deployment uses [Turso](https://turso.tech), a managed SQLite service that persists data across Vercel serverless invocations and redeployments.

**Environment variables required (set in Vercel dashboard):**

```
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

Get these from [app.turso.tech](https://app.turso.tech) → your database → **Connect**.

### Local development — file-based LibSQL

For local development you do **not** need a Turso account. The same `@libsql/client` driver works against a local file:

```bash
# .env.local (already in .gitignore)
TURSO_DATABASE_URL=file:coy.db
# No TURSO_AUTH_TOKEN needed for file: URLs
```

A `coy.db` file is created automatically in the project root on the first request. It is git-ignored and never committed.

### Schema

```sql
-- Seed profiles (32 rows, inserted once)
CREATE TABLE profiles (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  age           INTEGER NOT NULL,
  photo         TEXT    NOT NULL,
  bio           TEXT    NOT NULL,
  city          TEXT    NOT NULL,
  interests     TEXT    NOT NULL,   -- JSON array
  incoming_like INTEGER NOT NULL DEFAULT 0
);

-- One row per (guest, profile) swipe action
CREATE TABLE swipes (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  guest_id   TEXT     NOT NULL,       -- UUID from coy_guest_id cookie
  profile_id INTEGER  NOT NULL,
  direction  TEXT     NOT NULL CHECK(direction IN ('like','pass')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guest_id, profile_id)        -- prevents duplicate swipes
);

-- Tracks schema version for safe migrations
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Indexes** (created automatically):
- `idx_swipes_guest (guest_id, profile_id)` — feed exclusion subquery
- `idx_swipes_guest_like (guest_id, direction)` — matches join
- `idx_profiles_incoming (incoming_like)` — matches filter

---

## Seed Data

- **32 realistic mock profiles** with Indian names, cities, bios, and interests
- **10 profiles** (IDs 5, 9, 13, 17, 20, 23, 25, 28, 30, 32) carry `incoming_like = 1` — swiping right on any of them triggers a mutual match for demo purposes
- Seeding is **idempotent** — it only runs once and never duplicates rows
- Schema migrations run automatically on cold start via a `schema_version` key in the `meta` table

---

## API Endpoints

### `GET /api/init` *(primary — used by the client on page load)*

Returns both the feed and existing matches in a **single Turso batch query** (one network round-trip). Used by the client on page load to avoid sequential waterfall fetching.

```json
{
  "profiles": [ { ...Profile } ],
  "matches":  [ { ...Profile } ]
}
```

---

### `GET /api/feed`

Returns profiles the current guest has **not yet swiped on**, ordered by ID.

```json
{
  "profiles": [
    {
      "id": 1,
      "name": "Aanya Sharma",
      "age": 24,
      "photo": "https://picsum.photos/seed/aanya-sharma/400/500",
      "bio": "Coffee addict, bookworm, and amateur baker...",
      "city": "Mumbai",
      "interests": ["reading", "baking", "yoga", "travel"]
    }
  ]
}
```

The guest is identified by the `coy_guest_id` HTTP-only cookie. A new UUID is generated and set if the cookie is absent or malformed.

---

### `POST /api/swipe`

Records a Like or Pass for the current guest and returns whether a **mutual match** occurred.

**Request body:**

```json
{ "targetId": 5, "direction": "like" }
```

**Response — no match:**

```json
{ "matched": false }
```

**Response — mutual match:**

```json
{
  "matched": true,
  "matchedProfile": { ...Profile }
}
```

**Matching rules (server-enforced):**
- `matched: true` only when `direction === "like"` **and** the target profile has `incoming_like = 1`
- A Pass (`direction === "pass"`) always returns `matched: false`
- A one-sided Like on a profile without `incoming_like` always returns `matched: false`
- Duplicate swipes are silently ignored (`INSERT OR IGNORE`)

> **Privacy guarantee:** The match check is entirely server-side. The response never reveals that a profile liked the guest unless the guest also liked them back.

---

### `GET /api/matches`

Returns only **mutual matches** for the current guest — profiles the guest has liked that also have `incoming_like = 1`. One-sided incoming likes are **never** included.

```json
{ "matches": [ { ...Profile } ] }
```

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/AmiteshKumarDubey/coy-discover.git
cd coy-discover

# 2. Install dependencies
npm install

# 3. Create the local environment file
echo "TURSO_DATABASE_URL=file:coy.db" > .env.local

# 4. Start the development server
npm run dev

# 5. Open in browser
# http://localhost:3000/discover
```

The database is created and seeded automatically on the first request. No manual setup is required.

---

## Deployment (Vercel + Turso)

1. Push to the `main` branch — Vercel auto-deploys on every push.
2. In the Vercel dashboard, set these environment variables:
   - `TURSO_DATABASE_URL` — your Turso database URL (`libsql://...`)
   - `TURSO_AUTH_TOKEN` — your Turso auth token

The database schema and seed data are initialised automatically on the first production request. Subsequent deployments reuse the existing data without resetting it.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── init/route.ts      # Combined feed + matches (primary load endpoint)
│   │   ├── feed/route.ts      # GET unswiped profiles
│   │   ├── swipe/route.ts     # POST like/pass, return match result
│   │   └── matches/route.ts   # GET mutual matches
│   ├── discover/page.tsx      # Discover tab UI
│   ├── globals.css            # All styles (hand-crafted, no Tailwind dependency)
│   ├── layout.tsx             # Root layout with TabBar
│   └── page.tsx               # Home tab (blank placeholder)
├── components/
│   ├── CardStack.tsx          # Manages card rendering and swipe state
│   ├── SwipeCard.tsx          # Individual draggable profile card
│   ├── MatchModal.tsx         # "It's a Match!" overlay
│   ├── MatchesList.tsx        # Slide-up matches panel
│   ├── EmptyState.tsx         # Shown when feed is exhausted
│   └── TabBar.tsx             # Fixed bottom navigation
├── hooks/
│   ├── useDiscoverData.ts     # Unified hook — fetch, cache, optimistic swipe
│   ├── useFeed.ts             # Legacy feed hook (kept for reference)
│   └── useMatches.ts          # Matches state hook
├── lib/
│   ├── db.ts                  # Turso/LibSQL client singleton
│   ├── seed.ts                # Schema migration + idempotent seeding
│   └── guest.ts               # UUID cookie resolution and stamping
└── types/index.ts             # Shared TypeScript types
```

---

## Assignment Scope

This repository implements **Part B only** (Discover Tab). Part A (written submission) is a separate document.
