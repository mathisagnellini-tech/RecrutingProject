"use client";

import { useState, useEffect, useRef } from "react";

interface CountdownProps {
  onDone: () => void;
}

/**
 * Brutalist countdown.
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
      {step === "intro" && (
        <div className="text-center px-8 animate-fade-in">
          <p className="text-5xl font-black text-white leading-none uppercase">
            10 Questions
          </p>
          <div className="mt-3 inline-block">
            <span className="brutal-tag brutal-tag-red text-sm px-4 py-2">
              12s par question
            </span>
          </div>
          <p className="text-xs font-bold text-white/40 mt-3 uppercase tracking-wider">
            La dernière est libre, prends ton temps
          </p>
          <p className="text-2xl font-black text-burgundy-200 mt-5 uppercase">
            À toi de jouer !
          </p>
        </div>
      )}

      {(step === "3" || step === "2" || step === "1") && (
        <div key={step} className="countdown-number">
          <span className="text-[120px] font-black text-white leading-none" style={{ WebkitTextStroke: '3px white' }}>
            {step}
          </span>
        </div>
      )}

      {step === "go" && (
        <div className="countdown-number">
          <span className="text-6xl font-black bg-burgundy-500 text-white px-6 py-2 uppercase">
            GO !
          </span>
        </div>
      )}

      <style jsx>{`
        .countdown-number {
          animation: countPop 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes countPop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
