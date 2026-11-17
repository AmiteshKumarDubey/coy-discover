# Coy — Discover Tab

A swipe-based profile discovery feature built as a standalone Next.js app for the Coy SDE Intern assignment (Part B).

## Overview

This app implements a **"Discover" tab** — a Tinder/Bumble-style swipe experience — with Coy's core privacy promise: **likes are never revealed unless they are mutual**.

The app has two tabs:
- **Home** — blank placeholder  
- **Discover** — full swipe functionality (all work lives here)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Gestures | @use-gesture/react |
| Database | SQLite (via `better-sqlite3`) |
| Icons | Lucide React |

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

The app auto-seeds 32 profiles on first run. Data persists in `coy.db` (SQLite file, created automatically).

## API Endpoints

### `GET /api/feed`
Returns profiles the logged-in user has not yet swiped on.

```json
{
  "profiles": [
    {
      "id": 1,
      "name": "Aanya Sharma",
      "age": 24,
      "photo": "https://picsum.photos/seed/aanya-sharma/400/500",
      "bio": "...",
      "city": "Mumbai",
      "interests": ["reading", "baking", "yoga", "travel"]
    }
  ]
}
```

### `POST /api/swipe`
Records a like or pass and returns whether a mutual match occurred.

```json
// Request
{ "targetId": 3, "direction": "like" }

// Response (no match)
{ "matched": false }

// Response (match — user 0 liked target, and target had already liked user 0)
{ "matched": true, "matchedProfile": { ...Profile } }
```

> **Privacy guarantee**: The mutual check is server-side only. The response never exposes that a profile liked the user unless the user also likes them back.

### `GET /api/matches`
Returns only mutual matches (both sides liked each other).

```json
{ "matches": [ { ...Profile } ] }
```

## Features

- 📱 **Mobile-first** — drag gestures on touch, buttons on desktop
- 🃏 **Card stack UI** — smooth swipe animations with LIKE/NOPE stamps
- 💜 **Match modal** — "It's a Match!" screen on mutual likes
- 🔒 **Privacy core** — incoming likes never shown unless mutual
- 💾 **Persistent** — swipes and matches survive page reloads (SQLite)
- 🌟 **Empty state** — shown when all profiles are exhausted

## Seed Data

- **32 realistic mock profiles** with Indian names, cities, bios, and interests
- **12 profiles** (IDs 1–12) have already liked the logged-in user — swipe right on any of them to trigger an instant match demo

## Deployment Note

For local/self-hosted environments, SQLite works out of the box (`coy.db` is created in the project root on first run).

For **serverless deployment** (e.g. Vercel), SQLite won't persist across function instances because the filesystem is ephemeral. Recommended alternatives:
- **[Turso](https://turso.tech)** — SQLite-compatible, edge-native
- **[Neon](https://neon.tech)** — Serverless PostgreSQL (free tier)
- **[PlanetScale](https://planetscale.com)** — Serverless MySQL

No external database is configured by default.
