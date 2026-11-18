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
  incoming_like: number | bigint;
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureDb();
    const db = getDb();

    const { guestId, isNew } = resolveGuestId(req);

    const body = await req.json() as { targetId: number; direction: 'like' | 'pass' };
    const { targetId, direction } = body;

    if (typeof targetId !== 'number' || !['like', 'pass'].includes(direction)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Persist the swipe. INSERT OR IGNORE silently skips duplicates.
    await db.execute({
      sql: 'INSERT OR IGNORE INTO swipes (guest_id, profile_id, direction) VALUES (?, ?, ?)',
      args: [guestId, targetId, direction],
    });

    // A match occurs ONLY when:
    //   1. This guest just liked the profile (direction === 'like')
    //   2. The profile has incoming_like = 1 (pre-seeded mutual interest)
    if (direction === 'like') {
      const profileResult = await db.execute({
        sql: 'SELECT * FROM profiles WHERE id = ? AND incoming_like = 1',
        args: [targetId],
      });

      if (profileResult.rows.length > 0) {
        const matchedProfile = parseProfile(profileResult.rows[0] as unknown as RawProfile);
        const res = NextResponse.json({ matched: true, matchedProfile });
        // Always stamp — slides the 1-year expiry forward
        stampGuestCookie(res, guestId, isNew);
        return res;
      }
    }

    const res = NextResponse.json({ matched: false });
    // Always stamp — slides the 1-year expiry forward
    stampGuestCookie(res, guestId, isNew);
    return res;
  } catch (err) {
    console.error('[POST /api/swipe]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
