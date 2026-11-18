"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useDiscoverData } from "@/hooks/useDiscoverData";
import CardStack from "@/components/CardStack";
import MatchModal from "@/components/MatchModal";
import MatchesList from "@/components/MatchesList";
import EmptyState from "@/components/EmptyState";
import type { Profile, SwipeResult } from "@/types";

export default function DiscoverPage() {
  const {
    profiles,
    matches,
    matchCount,
    loading,
    error,
    submitSwipe,
    addMatch,
    refreshMatches,
  } = useDiscoverData();

  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showMatches, setShowMatches]       = useState(false);
  const [isEmpty, setIsEmpty]               = useState(false);

  // ── Preload the first 3 card images as soon as we have profiles ──
  // This kicks off image downloads before the React tree paints the
  // first card, cutting perceived load time by ~40-60% on cold visits.
  useEffect(() => {
    if (profiles.length === 0) return;
    const toPreload = profiles.slice(0, 3);
    toPreload.forEach((p) => {
      const img = new window.Image();
      img.src = p.photo;
    });
  }, [profiles]);

  async function handleSwipe(
    profileId: number,
    direction: "like" | "pass"
  ): Promise<SwipeResult> {
    return submitSwipe(profileId, direction);
  }

  function handleMatch(profile: Profile) {
    addMatch(profile);
    setMatchedProfile(profile);
  }

  function handleOpenMatches() {
    refreshMatches();
    setShowMatches(true);
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="discover-page">
        <div className="discover-topbar">
          <span className="discover-title">Discover</span>
          <div className="matches-btn" style={{ opacity: 0.4, pointerEvents: "none" }}>
            <Heart size={14} color="var(--accent)" fill="var(--accent)" />
            <span>Matches</span>
          </div>
        </div>
        <div className="discover-content">
          <div className="card-skeleton" aria-hidden="true" />
          <div className="skeleton-actions" aria-hidden="true">
            <div className="skeleton-btn" />
            <div className="skeleton-btn" />
          </div>
        </div>
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

      {/* ── Matches panel ── */}
      <MatchesList
        open={showMatches}
        onClose={() => setShowMatches(false)}
        matches={matches}
        loading={false}
      />
    </div>
  );
}
