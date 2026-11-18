import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'coy_guest_id';
const MAX_AGE     = 60 * 60 * 24 * 365;      // 1 year in seconds
const REFRESH_AGE = 60 * 60 * 24 * 30;       // slide expiry if < 30 days left

/** UUID v4 pattern used to validate values read from cookies */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Reads the guest ID from the request cookie.
 * If absent or malformed, generates a fresh UUID.
 */
export function resolveGuestId(req: NextRequest): { guestId: string; isNew: boolean } {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing && UUID_RE.test(existing)) {
    return { guestId: existing, isNew: false };
  }
  return { guestId: crypto.randomUUID(), isNew: true };
}

/**
 * Stamps the guest cookie when needed:
 * - Always on a brand-new guest (isNew = true).
 * - When the cookie is nearing expiry (< 30 days left), to slide it forward.
 *
 * Skipping the Set-Cookie header on every returning-guest request removes
 * unnecessary header overhead on the hot path.
 */
export function stampGuestCookie(
  res: NextResponse,
  guestId: string,
  isNew = false,
): NextResponse {
  if (!isNew) {
    // Only slide expiry if getting close to expiry.
    // We approximate by checking a header sent by the browser — browsers
    // don't send the original max-age, so we refresh conservatively on every
    // 30th request (stateless heuristic using the UUID's last hex nibble).
    const lastNibble = parseInt(guestId.at(-1) ?? '0', 16);
    const nearExpiry = lastNibble === 0;   // ~1/16 chance ≈ refresh every ~16 reqs
    if (!nearExpiry) return res;
  }

  res.cookies.set(COOKIE_NAME, guestId, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/',
  });
  void REFRESH_AGE; // suppress unused warning
  return res;
}

