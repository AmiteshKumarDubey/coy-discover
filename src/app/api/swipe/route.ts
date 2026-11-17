import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  seedIfEmpty();
  const db = getDb();

  const body = await req.json() as { targetId: number; direction: 'like' | 'pass' };
  const { targetId, direction } = body;

  if (typeof targetId !== 'number' || !['like', 'pass'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Record the swipe (INSERT OR IGNORE to handle duplicates gracefully)
  db.prepare(
    'INSERT OR IGNORE INTO swipes (swiper_id, target_id, direction) VALUES (0, ?, ?)'
  ).run(targetId, direction);

  // Check for a mutual match — only if user 0 just liked the target
  if (direction === 'like') {
    const mutual = db
      .prepare(
        `SELECT * FROM swipes
         WHERE swiper_id = ? AND target_id = 0 AND direction = 'like'`
      )
      .get(targetId) as { id: number } | undefined;

    if (mutual) {
      // It's a match — fetch the matched profile to return it
      const raw = db
        .prepare('SELECT * FROM profiles WHERE id = ?')
        .get(targetId) as RawProfile | undefined;

      if (raw) {
        return NextResponse.json({
          matched: true,
          matchedProfile: parseProfile(raw),
        });
      }
    }
  }

  return NextResponse.json({ matched: false });
}

