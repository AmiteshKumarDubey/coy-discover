import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { ensureDb } from '@/lib/seed';
import type { Profile } from '@/types';

interface RawProfile {
  id: number | bigint;
  name: string;
  age: number | bigint;
  photo: string;
  bio: string;
  city: string;
  interests: string;
}

function parseProfile(raw: RawProfile): Profile {
  return {
    id: Number(raw.id),
    name: raw.name,
    age: Number(raw.age),
    photo: raw.photo,
    bio: raw.bio,
    city: raw.city,
    interests: JSON.parse(raw.interests) as string[],
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    await ensureDb();
    const db = getDb();

    // Return profiles that user 0 has NOT yet swiped on
    const result = await db.execute(
      `SELECT * FROM profiles
       WHERE id NOT IN (
         SELECT target_id FROM swipes WHERE swiper_id = 0
       )
       ORDER BY id`
    );

    const profiles: Profile[] = (result.rows as unknown as RawProfile[]).map(parseProfile);
    return NextResponse.json({ profiles });
  } catch (err) {
    console.error('[GET /api/feed]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
