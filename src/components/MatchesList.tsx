"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { Profile } from "@/types";
import { X, Heart } from "lucide-react";

interface MatchesListProps {
  open: boolean;
  onClose: () => void;
}

export default function MatchesList({ open, onClose }: MatchesListProps) {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data: { matches: Profile[] }) => setMatches(data.matches))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="matches-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Slide-up panel */}
          <motion.div
            className="matches-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Handle */}
            <div className="matches-handle-row">
              <div className="matches-handle" />
            </div>

            {/* Header */}
            <div className="matches-header">
              <div className="matches-header-left">
                <Heart size={18} color="var(--accent)" fill="var(--accent)" />
                <h3 className="matches-header-title">Matches</h3>
                {matches.length > 0 && (
                  <span className="matches-count-badge">{matches.length}</span>
                )}
              </div>
              <button className="matches-close-btn" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="matches-scroll">
              {loading && (
                <div className="spinner-wrap">
                  <div className="spinner" />
                </div>
              )}

              {!loading && matches.length === 0 && (
                <div className="matches-empty">
                  <div className="matches-empty-emoji">💜</div>
                  <p className="matches-empty-title">No matches yet</p>
                  <p className="matches-empty-sub">Keep swiping to find your match!</p>
                </div>
              )}

              {!loading && matches.length > 0 && (
                <div className="matches-list">
                  {matches.map((profile, i) => (
                    <motion.div
                      key={profile.id}
                      className="match-item"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="match-item-photo"
                        src={profile.photo}
                        alt={profile.name}
                      />
                      <div className="match-item-info">
                        <p className="match-item-name">
                          {profile.name}, {profile.age}
                        </p>
                        <p className="match-item-city">📍 {profile.city}</p>
                        <div className="match-item-chips">
                          {profile.interests.slice(0, 2).map((tag) => (
                            <span key={tag} className="match-item-chip">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <Heart
                        size={16}
                        color="var(--accent)"
                        fill="var(--accent)"
                        className="match-item-heart"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
