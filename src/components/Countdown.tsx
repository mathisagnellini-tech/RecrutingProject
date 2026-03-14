"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownProps {
  onDone: () => void;
}

export default function Countdown({ onDone }: CountdownProps) {
  const [phase, setPhase] = useState<"intro" | "countdown" | "go">("intro");
  const [count, setCount] = useState(3);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Intro → 3s → switch to countdown
  useEffect(() => {
    if (phase === "intro") {
      const t = setTimeout(() => setPhase("countdown"), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Countdown 3 → 2 → 1 → go
  useEffect(() => {
    if (phase !== "countdown") return;

    const t = setTimeout(() => {
      if (count > 1) {
        setCount(count - 1);
      } else {
        setPhase("go");
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [phase, count]);

  // "go" phase → fire onDone after brief delay
  useEffect(() => {
    if (phase !== "go") return;
    const t = setTimeout(() => onDoneRef.current(), 400);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
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
        )}

        {phase === "countdown" && (
          <motion.div
            key={`count-${count}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.35, type: "spring", damping: 12 }}
            className="text-8xl font-black text-white"
          >
            {count}
          </motion.div>
        )}

        {phase === "go" && (
          <motion.div
            key="go"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", damping: 10 }}
            className="text-5xl font-black gradient-text"
          >
            GO !
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
