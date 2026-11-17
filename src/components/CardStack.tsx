"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
import { Heart, X } from "lucide-react";
import type { Profile, SwipeResult } from "@/types";

interface CardStackProps {
  profiles: Profile[];
  onSwipe: (profileId: number, direction: "like" | "pass") => Promise<SwipeResult>;
  onMatch: (profile: Profile) => void;
  onEmpty: () => void;
}

export default function CardStack({
  profiles,
  onSwipe,
  onMatch,
  onEmpty,
}: CardStackProps) {
  const [swiped, setSwiped]           = useState<Set<number>>(new Set());
  const [isProcessing, setProcessing] = useState(false);
  const lastDirRef                    = useRef<"like" | "pass">("like");

  const remaining = profiles.filter((p) => !swiped.has(p.id));
  const visible   = remaining.slice(0, 3);

  async function handleSwipe(direction: "like" | "pass") {
    if (isProcessing) return;
    const top = remaining[0];
    if (!top) return;

    lastDirRef.current = direction;
    setProcessing(true);
    setSwiped((prev) => new Set(prev).add(top.id));

    try {
      const result = await onSwipe(top.id, direction);
      if (result.matched && result.matchedProfile) {
        onMatch(result.matchedProfile);
      }
    } catch (err) {
      console.error("Swipe error:", err);
      setSwiped((prev) => {
        const next = new Set(prev);
        next.delete(top.id);
        return next;
      });
    } finally {
      setProcessing(false);
    }

    if (remaining.length <= 1) {
      setTimeout(onEmpty, 400);
    }
  }

  return (
    <div className="card-stack-wrapper">
      {/* ── Card area (stacked, absolutely positioned children) ── */}
      <div className="card-stack-inner">
        <AnimatePresence>
          {visible.map((profile, index) => (
            <motion.div
              key={profile.id}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: visible.length - index,
              }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                x: lastDirRef.current === "like" ? 500 : -500,
                opacity: 0,
                rotate: lastDirRef.current === "like" ? 20 : -20,
                transition: { duration: 0.28, ease: "easeIn" },
              }}
              transition={{ duration: 0.22 }}
            >
              <SwipeCard
                profile={profile}
                onSwipe={handleSwipe}
                isTop={index === 0}
                stackIndex={index}
                disabled={isProcessing}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Action buttons — live OUTSIDE the absolute-positioned stack ── */}
      <div className="action-buttons">
        <button
          className={`action-btn action-btn-pass${isProcessing ? " btn-disabled" : ""}`}
          onClick={() => handleSwipe("pass")}
          disabled={isProcessing}
          aria-label="Pass"
        >
          <X size={28} color="#f87171" strokeWidth={2.5} />
        </button>
        <button
          className={`action-btn action-btn-like${isProcessing ? " btn-disabled" : ""}`}
          onClick={() => handleSwipe("like")}
          disabled={isProcessing}
          aria-label="Like"
        >
          <Heart size={28} color="#fff" fill="#fff" />
        </button>
      </div>
    </div>
  );
}
