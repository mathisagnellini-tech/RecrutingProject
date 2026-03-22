"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "@/data/questions";

interface ExampleVideoProps {
  onFinished: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export default function ExampleVideo({ onFinished, videoRef }: ExampleVideoProps) {
  const [currentQ, setCurrentQ] = useState(-1);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [showIntro, setShowIntro] = useState(true);

  const advanceQuestion = useCallback(() => {
    setCurrentQ((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        onFinished();
        return prev;
      }
      if (prev >= 0) setAnsweredQuestions((a) => [...a, prev]);
      return next;
    });
  }, [onFinished]);

  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => {
      setShowIntro(false);
      setCurrentQ(0);
    }, 2500);
    return () => clearTimeout(t);
  }, [showIntro]);

  useEffect(() => {
    if (currentQ < 0 || showIntro) return;
    const t = setTimeout(() => advanceQuestion(), 4000);
    return () => clearTimeout(t);
  }, [currentQ, showIntro, advanceQuestion]);

  const currentQuestion = currentQ >= 0 ? questions[currentQ] : null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {videoRef && (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      )}

      {/* Soft gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      {/* EXEMPLE pill */}
      <motion.div
        className="absolute top-5 left-4 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span className="pill pill-rec">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          Exemple
        </span>
      </motion.div>

      {/* Counter */}
      {currentQ >= 0 && (
        <motion.div
          className="absolute top-5 right-14 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="pill">{currentQ + 1}/3</span>
        </motion.div>
      )}

      {/* Intro */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <motion.h1
              className="text-5xl font-extrabold text-white mb-2 tracking-tight"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              Regarde !
            </motion.h1>
            <motion.p
              className="text-white/50 text-sm font-medium"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Voilà comment ça se passe...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions — bottom area */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-20">
        {/* Answered */}
        <div className="space-y-2 mb-3">
          <AnimatePresence>
            {answeredQuestions.map((qIdx) => {
              const q = questions[qIdx];
              return (
                <motion.div
                  key={q.id}
                  className="glass-dark px-4 py-2.5"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{q.emoji}</span>
                    <span className="text-xs text-white/50 line-through">{q.text}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Current question */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
            >
              <motion.div
                className="mb-2"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="pill pill-accent text-[10px]">{currentQuestion.category}</span>
              </motion.div>

              <div className="glass-card p-5">
                <div className="flex items-start gap-3">
                  <motion.span
                    className="text-2xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {currentQuestion.emoji}
                  </motion.span>
                  <motion.p
                    className="text-base font-semibold text-white leading-snug"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {currentQuestion.text}
                  </motion.p>
                </div>

                {/* Voice bars */}
                <motion.div
                  className="flex items-center gap-2 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-accent-purple"
                        animate={{ height: [3, 10 + Math.random() * 8, 3] }}
                        transition={{
                          duration: 0.3 + Math.random() * 0.2,
                          repeat: Infinity,
                          delay: i * 0.08,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-accent-purple font-medium">
                    Réponse en cours...
                  </span>
                </motion.div>

                {/* Timer */}
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #2D5BFF, #5B8DEF)' }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 4, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="absolute left-0 right-0 z-20 flex justify-center gap-2 px-4" style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === currentQ
                ? "flex-[2] bg-accent-purple"
                : i < currentQ
                ? "flex-1 bg-white/60"
                : "flex-1 bg-white/15"
            }`}
            layout
          />
        ))}
      </div>
    </div>
  );
}
