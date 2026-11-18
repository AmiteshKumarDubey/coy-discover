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
    id:         Number(raw.id),
    name:       raw.name,
    age:        Number(raw.age),
    photo:      raw.photo,
    bio:        raw.bio,
    city:       raw.city,
    interests:  JSON.parse(raw.interests) as string[],
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureDb();
    const db = getDb();

    const { guestId, isNew } = resolveGuestId(req);

    // Return profiles this guest has NOT yet swiped on
    const result = await db.execute({
      sql: `SELECT * FROM profiles
            WHERE id NOT IN (
              SELECT profile_id FROM swipes WHERE guest_id = ?
            )
            ORDER BY id`,
      args: [guestId],
    });

    const profiles: Profile[] = (result.rows as unknown as RawProfile[]).map(parseProfile);
    const res = NextResponse.json({ profiles });
    // Always stamp — slides the 1-year expiry forward on every visit
    stampGuestCookie(res, guestId, isNew);
    return res;
  } catch (err) {
    console.error('[GET /api/feed]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
