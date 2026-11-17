"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import { useMatches } from "@/hooks/useMatches";
import CardStack from "@/components/CardStack";
import MatchModal from "@/components/MatchModal";
import MatchesList from "@/components/MatchesList";
import EmptyState from "@/components/EmptyState";
import type { Profile, SwipeResult } from "@/types";

export default function DiscoverPage() {
  const { profiles, loading, error, submitSwipe } = useFeed();
  const { matches, matchCount, loadingMatches, addMatch, refreshMatches } = useMatches();

  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showMatches, setShowMatches]       = useState(false);
  const [isEmpty, setIsEmpty]               = useState(false);

  async function handleSwipe(
    profileId: number,
    direction: "like" | "pass"
  ): Promise<SwipeResult> {
    return submitSwipe(profileId, direction);
  }

  function handleMatch(profile: Profile) {
    addMatch(profile);        // adds to the shared list + updates badge
    setMatchedProfile(profile);
  }

  function handleOpenMatches() {
    refreshMatches();         // pull fresh data from DB before opening panel
    setShowMatches(true);
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "calc(100vh - 72px)" }}>
        <div className="spinner" />
        <p className="spinner-text">Loading profiles…</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "calc(100vh - 72px)" }}>
        <span style={{ fontSize: 48 }}>😕</span>
        <p style={{ color: "#fff", fontWeight: 600 }}>Something went wrong</p>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="discover-page">
      {/* ── Top bar ── */}
      <div className="discover-topbar">
        <span className="discover-title">Discover</span>

        <button className="matches-btn" onClick={handleOpenMatches}>
          <Heart size={14} color="var(--accent)" fill="var(--accent)" />
          <span>Matches</span>
          {matchCount > 0 && (
            <span className="matches-badge">{matchCount}</span>
          )}
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="discover-content">
        {isEmpty || profiles.length === 0 ? (
          <EmptyState onViewMatches={handleOpenMatches} />
        ) : (
          <CardStack
            profiles={profiles}
            onSwipe={handleSwipe}
            onMatch={handleMatch}
            onEmpty={() => setIsEmpty(true)}
          />
        )}
      </div>

      {/* ── Match modal ── */}
      {matchedProfile && (
        <MatchModal
          profile={matchedProfile}
          onClose={() => setMatchedProfile(null)}
        />
      )}

      {/* ── Matches panel — receives live list from shared hook ── */}
      <MatchesList
        open={showMatches}
        onClose={() => setShowMatches(false)}
        matches={matches}
        loading={loadingMatches}
      />
    </div>
  );
}
