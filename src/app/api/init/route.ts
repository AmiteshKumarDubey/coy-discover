import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { ensureDb } from '@/lib/seed';
import { resolveGuestId, stampGuestCookie } from '@/lib/guest';
import type { Profile } from '@/types';

interface RawProfile {
  id: number | bigint;
  name: string;
  age: number | bigint;
  photo: string;
  bio: string;
  city: string;
  interests: string;
  incoming_like?: number | bigint;
}

function parseProfile(raw: RawProfile): Profile {
  return {
    id:        Number(raw.id),
    name:      raw.name,
    age:       Number(raw.age),
    photo:     raw.photo,
    bio:       raw.bio,
    city:      raw.city,
    interests: JSON.parse(raw.interests) as string[],
  };
}

/**
 * GET /api/init
 *
 * Returns both the feed and matches in a single request using a batch
 * query — eliminates the two-waterfall pattern where /api/feed and
 * /api/matches were each fetched independently on page load.
 *
 * Response: { profiles: Profile[], matches: Profile[] }
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureDb();
    const db = getDb();

    const { guestId, isNew } = resolveGuestId(req);

    // Execute both queries in a single Turso batch — one network round-trip.
    const [feedResult, matchResult] = await db.batch([
      {
        // Feed: profiles this guest has NOT yet swiped on
        sql: `SELECT id, name, age, photo, bio, city, interests
              FROM profiles
              WHERE id NOT IN (
                SELECT profile_id FROM swipes WHERE guest_id = ?
              )
              ORDER BY id`,
        args: [guestId],
      },
      {
        // Matches: profiles the guest liked that also have incoming_like = 1
        sql: `SELECT p.id, p.name, p.age, p.photo, p.bio, p.city, p.interests
              FROM profiles p
              INNER JOIN swipes s
                ON s.guest_id = ? AND s.profile_id = p.id AND s.direction = 'like'
              WHERE p.incoming_like = 1`,
        args: [guestId],
      },
    ], 'read');

    const profiles = (feedResult.rows as unknown as RawProfile[]).map(parseProfile);
    const matches  = (matchResult.rows as unknown as RawProfile[]).map(parseProfile);

    const res = NextResponse.json({ profiles, matches });

    // Cache: private (cookie-based data), revalidate quickly.
    // s-maxage=0 prevents CDN caching; must-revalidate ensures browsers
    // always check the server when navigating back.
    res.headers.set('Cache-Control', 'private, no-store');

    stampGuestCookie(res, guestId, isNew);
    return res;
  } catch (err) {
    console.error('[GET /api/init]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
