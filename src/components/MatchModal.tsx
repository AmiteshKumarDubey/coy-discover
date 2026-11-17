"use client";

import { motion } from "framer-motion";
import type { Profile } from "@/types";
import { Heart } from "lucide-react";

interface MatchModalProps {
  profile: Profile;
  onClose: () => void;
}

export default function MatchModal({ profile, onClose }: MatchModalProps) {
  return (
    <motion.div
      className="match-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="match-card"
        initial={{ scale: 0.55, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.55, opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="match-card-inner">
          {/* Heart icon */}
          <motion.div
            className="match-icon-wrap"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.35, 1] }}
            transition={{ delay: 0.2, duration: 0.55 }}
          >
            <Heart size={32} color="#fff" fill="#fff" />
          </motion.div>

          <motion.h2
            className="match-heading"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            It&apos;s a Match!
          </motion.h2>

          <motion.p
            className="match-subtext"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
          >
            You and {profile.name} both liked each other
          </motion.p>

          {/* Photos */}
          <motion.div
            className="match-photos"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.32 }}
          >
            {/* You */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="match-you-avatar">😊</div>
              <span
                style={{
                  position: "absolute",
                  bottom: "-22px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                You
              </span>
            </div>

            {/* Them */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="match-their-avatar"
                src={profile.photo}
                alt={profile.name}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "-22px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  maxWidth: "80px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {profile.name.split(" ")[0]}
              </span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.button
            className="match-cta"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            onClick={onClose}
          >
            Keep Swiping 🔥
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
