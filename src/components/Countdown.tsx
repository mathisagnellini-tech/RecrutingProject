"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownProps {
  onDone: () => void;
}

export default function Countdown({ onDone }: CountdownProps) {
  const [step, setStep] = useState<"intro" | "3" | "2" | "1" | "go" | "done">("intro");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const delays: Record<string, { next: typeof step; ms: number }> = {
      intro: { next: "3", ms: 3000 },
      "3": { next: "2", ms: 1000 },
      "2": { next: "1", ms: 1000 },
      "1": { next: "go", ms: 1000 },
      go: { next: "done", ms: 500 },
    };
    const config = delays[step];
    if (!config) return;
    const t = setTimeout(() => {
      if (config.next === "done") onDoneRef.current();
      else setStep(config.next);
    }, config.ms);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-40 h-40 rounded-full bg-accent-purple/20 blur-3xl orb-float" />
        <div className="absolute bottom-1/4 -right-10 w-40 h-40 rounded-full bg-accent-pink/15 blur-3xl orb-float-slow" />
      </div>

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            className="text-center px-8 relative z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              className="text-5xl font-extrabold text-white leading-none tracking-tight"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              10 Questions
            </motion.p>
            <motion.div
              className="mt-4 inline-block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="pill pill-accent text-sm px-5 py-2">
                12s par question
              </span>
            </motion.div>
            <motion.p
              className="text-[13px] text-white/40 mt-4 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              La dernière est libre, prends ton temps
            </motion.p>
            <motion.p
              className="text-2xl font-bold mt-6 liquid-glass-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              À toi de jouer !
            </motion.p>
          </motion.div>
        )}

        {(step === "3" || step === "2" || step === "1") && (
          <motion.div
            key={step}
            className="relative z-10"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
          >
            <span className="text-[140px] font-extrabold liquid-glass-text leading-none">
              {step}
            </span>
          </motion.div>
        )}

        {step === "go" && (
          <motion.div
            key="go"
            className="relative z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <div className="glass-heavy px-10 py-5">
              <span className="text-5xl font-extrabold liquid-glass-text">GO !</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
