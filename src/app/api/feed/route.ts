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

  const rows = db
    .prepare(
      `SELECT * FROM profiles
       WHERE id NOT IN (
         SELECT target_id FROM swipes WHERE swiper_id = 0
       )`
    )
    .all() as RawProfile[];

  const profiles: Profile[] = rows.map(parseProfile);
  return NextResponse.json({ profiles });
}
