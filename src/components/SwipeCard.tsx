"use client";

import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useState } from "react";
import type { Profile } from "@/types";

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "like" | "pass") => void;
  isTop: boolean;
  stackIndex: number;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 90;

export default function SwipeCard({
  profile,
  onSwipe,
  isTop,
  stackIndex,
  disabled = false,
}: SwipeCardProps) {
  const [gone, setGone] = useState(false);
  const dragX = useMotionValue(0);

  const rotate      = useTransform(dragX, [-220, 0, 220], [-18, 0, 18]);
  const likeOpacity = useTransform(dragX, [25, 100], [0, 1]);
  const nopeOpacity = useTransform(dragX, [-100, -25], [1, 0]);
  const cardOpacity = useTransform(dragX, [-280, -180, 0, 180, 280], [0, 1, 1, 1, 0]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (disabled || gone) return;
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      setGone(true);
      onSwipe(info.offset.x > 0 ? "like" : "pass");
    }
  }

  /* ── background (non-top) card ── */
  if (!isTop) {
    const scale = 1 - stackIndex * 0.04;
    const ty    = -stackIndex * 12;
    return (
      <div
        className="bg-stack-card"
        style={{ transform: `scale(${scale}) translateY(${ty}px)`, zIndex: -stackIndex }}
      />
    );
  }

  /* ── top (draggable) card — fills the absolute container entirely ── */
  return (
    <motion.div
      className="profile-card-wrap"
      style={{ x: dragX, rotate, opacity: cardOpacity, zIndex: 10, height: "100%" }}
      drag={disabled || gone ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={disabled ? {} : { scale: 1.02 }}
    >
      <div className="profile-card" style={{ height: "100%" }}>
        {/* Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="profile-card-img"
          src={profile.photo}
          alt={profile.name}
          draggable={false}
        />

        {/* Dark gradient overlay */}
        <div className="profile-card-gradient" />

        {/* LIKE stamp */}
        <motion.div className="stamp stamp-like" style={{ opacity: likeOpacity }}>
          LIKE
        </motion.div>

        {/* NOPE stamp */}
        <motion.div className="stamp stamp-nope" style={{ opacity: nopeOpacity }}>
          NOPE
        </motion.div>

        {/* Profile info overlay */}
        <div className="profile-card-info">
          <h2 className="profile-name">
            {profile.name}, <span>{profile.age}</span>
          </h2>
          <p className="profile-location">📍 {profile.city}</p>
          <p className="profile-bio">{profile.bio}</p>
          <div className="profile-interests">
            {profile.interests.slice(0, 4).map((tag) => (
              <span key={tag} className="interest-chip">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
