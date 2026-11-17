import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { seedIfEmpty } from '@/lib/seed';
import type { Profile } from '@/types';

interface RawProfile {
  id: number;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  interests: string;
}

function parseProfile(raw: RawProfile): Profile {
  return {
    ...raw,
    interests: JSON.parse(raw.interests) as string[],
  };
}

export async function GET(): Promise<NextResponse> {
  seedIfEmpty();
  const db = getDb();

  // Strictly mutual: user 0 liked them AND they liked user 0
  const rows = db
    .prepare(
      `SELECT p.* FROM profiles p
       INNER JOIN swipes s1 ON s1.swiper_id = 0 AND s1.target_id = p.id AND s1.direction = 'like'
       INNER JOIN swipes s2 ON s2.swiper_id = p.id AND s2.target_id = 0 AND s2.direction = 'like'`
    )
    .all() as RawProfile[];

  const matches: Profile[] = rows.map(parseProfile);
  return NextResponse.json({ matches });
}

