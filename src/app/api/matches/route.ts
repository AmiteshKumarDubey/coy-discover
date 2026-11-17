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

    // Strictly mutual: user 0 liked them AND they liked user 0.
    // One-sided incoming likes are NEVER exposed.
    const result = await db.execute(
      `SELECT p.* FROM profiles p
       INNER JOIN swipes s1
         ON s1.swiper_id = 0 AND s1.target_id = p.id AND s1.direction = 'like'
       INNER JOIN swipes s2
         ON s2.swiper_id = p.id AND s2.target_id = 0 AND s2.direction = 'like'`
    );

    const matches: Profile[] = (result.rows as unknown as RawProfile[]).map(parseProfile);
    return NextResponse.json({ matches });
  } catch (err) {
    console.error('[GET /api/matches]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
