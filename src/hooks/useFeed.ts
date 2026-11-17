import { useState, useEffect, useCallback } from "react";
import type { Profile, SwipeResult } from "@/types";

interface UseFeedReturn {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  submitSwipe: (targetId: number, direction: "like" | "pass") => Promise<SwipeResult>;
}

export function useFeed(): UseFeedReturn {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/feed")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch feed");
        return r.json() as Promise<{ profiles: Profile[] }>;
      })
      .then((data) => setProfiles(data.profiles))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const submitSwipe = useCallback(
    async (targetId: number, direction: "like" | "pass"): Promise<SwipeResult> => {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, direction }),
      });
      if (!res.ok) throw new Error("Swipe request failed");
      return res.json() as Promise<SwipeResult>;
    },
    []
  );

  return { profiles, loading, error, submitSwipe };
}

