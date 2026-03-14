"use client";

import { useState, useEffect, useRef } from "react";

interface CountdownProps {
  onDone: () => void;
}

/**
 * Simple countdown without AnimatePresence to avoid skipping numbers.
 * Phases: intro (3s) → 3 (1s) → 2 (1s) → 1 (1s) → GO (0.5s) → done
 */
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
      if (config.next === "done") {
        onDoneRef.current();
      } else {
        setStep(config.next);
      }
    }, config.ms);

    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {step === "intro" && (
        <div className="text-center px-8 animate-fade-in">
          <p className="text-4xl font-black text-white leading-tight">
            10 questions
          </p>
          <p className="text-2xl font-bold text-burgundy-400 mt-2">
            12s par question
          </p>
          <p className="text-2xl font-bold text-white/60 mt-1">
            1min20
          </p>
          <p className="text-xl font-black gradient-text mt-4">
            À toi de jouer !
          </p>
        </div>
      )}

      {(step === "3" || step === "2" || step === "1") && (
        <div key={step} className="countdown-number">
          <span className="text-8xl font-black text-white">
            {step}
          </span>
        </div>
      )}

      {step === "go" && (
        <div className="countdown-number">
          <span className="text-5xl font-black gradient-text">
            GO !
          </span>
        </div>
      )}

      <style jsx>{`
        .countdown-number {
          animation: countPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes countPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
