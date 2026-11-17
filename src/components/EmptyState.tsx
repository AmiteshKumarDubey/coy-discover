"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  onViewMatches: () => void;
}

export default function EmptyState({ onViewMatches }: EmptyStateProps) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="empty-state-emoji">🌟</div>
      <h2 className="empty-state-title">You&apos;ve seen everyone!</h2>
      <p className="empty-state-subtitle">
        You&apos;ve swiped through all available profiles. Check your matches or come back later!
      </p>
      <button className="empty-state-btn" onClick={onViewMatches}>
        View My Matches 💜
      </button>
    </motion.div>
  );
}
