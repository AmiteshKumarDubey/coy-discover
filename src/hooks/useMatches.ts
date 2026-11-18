"use client";

import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/types";

interface UseMatchesReturn {
  matches: Profile[];
  matchCount: number;
  loadingMatches: boolean;
  /** Call when a new real-time match occurs — adds to list + count */
  addMatch: (profile: Profile) => void;
  /** Reload from DB (e.g. when the Matches panel opens) */
  refreshMatches: () => void;
}

export function useMatches(): UseMatchesReturn {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const fetchMatches = useCallback(() => {
    setLoadingMatches(true);
    return fetch("/api/matches", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch matches");
        return r.json() as Promise<{ matches: Profile[] }>;
      })
      .then((data) => setMatches(data.matches))
      .catch(console.error)
      .finally(() => setLoadingMatches(false));
  }, []);

  // Load on mount so the badge reflects the real DB count immediately,
  // even after a page refresh.
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const addMatch = useCallback((profile: Profile) => {
    setMatches((prev) => {
      // Avoid duplicates (e.g. user swipes same card twice before async resolves)
      if (prev.some((m) => m.id === profile.id)) return prev;
      return [...prev, profile];
    });
  }, []);

  return {
    matches,
    matchCount: matches.length,
    loadingMatches,
    addMatch,
    refreshMatches: fetchMatches,
  };
}

