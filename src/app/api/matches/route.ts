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

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureDb();
    const db = getDb();

    const { guestId, isNew } = resolveGuestId(req);

    // Mutual match = this guest liked the profile AND the profile has incoming_like = 1.
    // One-sided incoming likes are NEVER exposed.
    const result = await db.execute({
      sql: `SELECT p.* FROM profiles p
            INNER JOIN swipes s
              ON s.guest_id = ? AND s.profile_id = p.id AND s.direction = 'like'
            WHERE p.incoming_like = 1`,
      args: [guestId],
    });

    const matches: Profile[] = (result.rows as unknown as RawProfile[]).map(parseProfile);
    const res = NextResponse.json({ matches });
    if (isNew) stampGuestCookie(res, guestId);
    return res;
  } catch (err) {
    console.error('[GET /api/matches]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
