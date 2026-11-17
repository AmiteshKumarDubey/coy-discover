import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'coy_guest_id';
// 1 year — survives browser restarts, matches Tinder/Bumble's approach
const MAX_AGE = 60 * 60 * 24 * 365;

/** UUID v4 pattern used to validate values read from cookies */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Reads the guest ID from the request cookie.
 * If absent or malformed, generates a fresh UUID.
 *
 * Returns `isNew: true` when a new ID was generated so the caller
 * knows to stamp the Set-Cookie header on the response.
 */
export function resolveGuestId(req: NextRequest): { guestId: string; isNew: boolean } {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing && UUID_RE.test(existing)) {
    return { guestId: existing, isNew: false };
  }
  return { guestId: crypto.randomUUID(), isNew: true };
}

/**
 * Stamps (or refreshes) the guest cookie on a NextResponse.
 * Always call this when `isNew === true`; optionally call it on
 * every response to slide the expiry forward.
 */
export function stampGuestCookie(res: NextResponse, guestId: string): NextResponse {
  res.cookies.set(COOKIE_NAME, guestId, {
    httpOnly: true,                                       // JS cannot read it
    secure: process.env.NODE_ENV === 'production',        // HTTPS-only in prod
    sameSite: 'lax',                                      // safe default
    maxAge: MAX_AGE,
    path: '/',
  });
  return res;
}
