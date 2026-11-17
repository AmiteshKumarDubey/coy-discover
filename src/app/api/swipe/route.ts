import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureDb();
    const db = getDb();

    const body = await req.json() as { targetId: number; direction: 'like' | 'pass' };
    const { targetId, direction } = body;

    if (typeof targetId !== 'number' || !['like', 'pass'].includes(direction)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Persist the swipe. INSERT OR IGNORE silently skips if already swiped.
    await db.execute({
      sql: 'INSERT OR IGNORE INTO swipes (swiper_id, target_id, direction) VALUES (0, ?, ?)',
      args: [targetId, direction],
    });

    // Check for a mutual match — ONLY when user 0 liked the target
    if (direction === 'like') {
      const mutualResult = await db.execute({
        sql: `SELECT id FROM swipes
              WHERE swiper_id = ? AND target_id = 0 AND direction = 'like'`,
        args: [targetId],
      });

      if (mutualResult.rows.length > 0) {
        // Mutual like confirmed — fetch the profile to return it
        const profileResult = await db.execute({
          sql: 'SELECT * FROM profiles WHERE id = ?',
          args: [targetId],
        });

        if (profileResult.rows.length > 0) {
          const matchedProfile = parseProfile(profileResult.rows[0] as unknown as RawProfile);
          return NextResponse.json({ matched: true, matchedProfile });
        }
      }
    }

    return NextResponse.json({ matched: false });
  } catch (err) {
    console.error('[POST /api/swipe]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
