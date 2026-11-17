"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
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
  const [swiped, setSwiped]         = useState<Set<number>>(new Set());
  const [isProcessing, setProcessing] = useState(false);
  // Track the exit direction so the card flies off the right side
  const lastDirRef                  = useRef<"like" | "pass">("like");

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
      // Roll back optimistic removal on error
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
    /* Wrapper gives height: card + action buttons */
    <div
      className="card-stack-wrapper"
      style={{ minHeight: "calc(min(520px, 62vh) + 110px)" }}
    >
      <div
        className="card-stack-inner"
        style={{ height: "min(520px, 62vh)" }}
      >
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
    </div>
  );
}
