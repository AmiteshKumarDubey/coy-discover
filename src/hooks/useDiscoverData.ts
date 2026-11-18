/**
 * useDiscoverData — unified hook for feed + matches
 *
 * Key optimisations vs the old useFeed + useMatches pair:
 *
 * 1. Single fetch to /api/init which returns both profiles AND matches in
 *    one Turso batch query (one network round-trip instead of two).
 *
 * 2. Module-level cache: data is stored outside the React component tree.
 *    Navigating Home → Discover unmounts DiscoverPage, but the cache
 *    survives. On remount the hook returns cached data instantly and only
 *    refetches in the background if the cache is older than STALE_MS.
 *
 * 3. Swipe optimistic update: the local swiped set is kept in the cache
 *    so profiles filtered out by swiping stay filtered even if the user
 *    navigates away and comes back — no duplicate cards.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Profile, SwipeResult } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface DiscoverData {
  profiles: Profile[];  // all profiles NOT yet swiped by this guest (from DB)
  matches:  Profile[];  // mutual matches for this guest (from DB)
}

// ── Module-level cache (survives component unmount) ────────────────────────

interface Cache {
  data:      DiscoverData;
  fetchedAt: number;        // Date.now() ms
  swiped:    Set<number>;   // profile IDs swiped in this browser session
}

let cache: Cache | null = null;
// Re-fetch from DB if the cache is older than 60 s — fresh enough for a
// dating app feed, but avoids a waterfall on every tab-switch.
const STALE_MS = 60_000;

// Listeners so all mounted hooks get the same update when cache changes
const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// ── Shared fetch ──────────────────────────────────────────────────────────

let inflightFetch: Promise<void> | null = null;

async function loadFromServer(): Promise<void> {
  if (inflightFetch) return inflightFetch;   // deduplicate concurrent mounts

  inflightFetch = fetch('/api/init', { credentials: 'include' })
    .then(async (r) => {
      if (!r.ok) throw new Error('Failed to load data');
      const data = await r.json() as DiscoverData;
      const prevSwiped = cache?.swiped ?? new Set<number>();
      cache = { data, fetchedAt: Date.now(), swiped: prevSwiped };
      notifyListeners();
    })
    .finally(() => { inflightFetch = null; });

  return inflightFetch;
}

function isCacheStale(): boolean {
  if (!cache) return true;
  return (Date.now() - cache.fetchedAt) > STALE_MS;
}

// ── Hook ──────────────────────────────────────────────────────────────────

interface UseDiscoverDataReturn {
  /** Profiles left to swipe (swiped ones excluded client-side) */
  profiles:       Profile[];
  matches:        Profile[];
  matchCount:     number;
  loading:        boolean;
  error:          string | null;
  submitSwipe:    (targetId: number, direction: 'like' | 'pass') => Promise<SwipeResult>;
  addMatch:       (profile: Profile) => void;
  refreshMatches: () => void;
}

export function useDiscoverData(): UseDiscoverDataReturn {
  const [, forceUpdate] = useState(0);
  const [loading, setLoading]   = useState(!cache);   // instant if cached
  const [error, setError]       = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Register this component as a listener so cache updates re-render it
  useEffect(() => {
    mountedRef.current = true;
    listeners.add(tick);
    return () => {
      mountedRef.current = false;
      listeners.delete(tick);
    };
    function tick() {
      if (mountedRef.current) forceUpdate((n) => n + 1);
    }
  }, []);

  // Load data on mount — instant if cache is warm, fetch otherwise
  useEffect(() => {
    if (!isCacheStale()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadFromServer()
      .catch((err: Error) => {
        if (mountedRef.current) setError(err.message);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive visible profiles: exclude any swiped in this session
  const swiped   = cache?.swiped ?? new Set<number>();
  const profiles = (cache?.data.profiles ?? []).filter((p) => !swiped.has(p.id));
  const matches  = cache?.data.matches ?? [];

  const submitSwipe = useCallback(
    async (targetId: number, direction: 'like' | 'pass'): Promise<SwipeResult> => {
      // Optimistic: immediately remove from visible feed
      if (cache) {
        cache.swiped.add(targetId);
        notifyListeners();
      }

      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetId, direction }),
      });
      if (!res.ok) {
        // Roll back optimistic removal on failure
        cache?.swiped.delete(targetId);
        notifyListeners();
        throw new Error('Swipe request failed');
      }
      return res.json() as Promise<SwipeResult>;
    },
    []
  );

  const addMatch = useCallback((profile: Profile) => {
    if (!cache) return;
    if (cache.data.matches.some((m) => m.id === profile.id)) return;
    cache = { ...cache, data: { ...cache.data, matches: [...cache.data.matches, profile] } };
    notifyListeners();
  }, []);

  const refreshMatches = useCallback(() => {
    // Re-fetch only matches via the full init (keeps feed stable in cache)
    fetch('/api/matches', { credentials: 'include' })
      .then((r) => r.json() as Promise<{ matches: Profile[] }>)
      .then(({ matches: fresh }) => {
        if (!cache) return;
        cache = { ...cache, data: { ...cache.data, matches: fresh } };
        notifyListeners();
      })
      .catch(console.error);
  }, []);

  return {
    profiles,
    matches,
    matchCount: matches.length,
    loading,
    error,
    submitSwipe,
    addMatch,
    refreshMatches,
  };
}

