"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownProps {
  onDone: () => void;
}

export default function Countdown({ onDone }: CountdownProps) {
  const [phase, setPhase] = useState<"intro" | "countdown">("intro");
  const [count, setCount] = useState(3);

  // Show intro for 3 seconds, then switch to countdown
  useEffect(() => {
    if (phase === "intro") {
      const t = setTimeout(() => setPhase("countdown"), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count, onDone]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <motion.div
            key="intro"
            className="text-center px-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <motion.p
              className="text-4xl font-black text-white leading-tight"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              10 questions
            </motion.p>
            <motion.p
              className="text-2xl font-bold text-burgundy-400 mt-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              12s par question
            </motion.p>
            <motion.p
              className="text-2xl font-bold text-white/60 mt-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              1min20
            </motion.p>
            <motion.p
              className="text-xl font-black gradient-text mt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              À toi de jouer !
            </motion.p>
          </motion.div>
        ) : (
          count > 0 && (
            <motion.div
              key={count}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4, type: "spring", damping: 12 }}
              className="text-8xl font-black text-white"
            >
              {count}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
