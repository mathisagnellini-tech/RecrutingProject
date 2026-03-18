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
        // Only show 3 questions in example
        onFinished();
        return prev;
      }
      if (prev >= 0) {
        setAnsweredQuestions((a) => [...a, prev]);
      }
      return next;
    });
  }, [onFinished]);

  // Intro → first question
  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => {
      setShowIntro(false);
      setCurrentQ(0);
    }, 2500);
    return () => clearTimeout(t);
  }, [showIntro]);

  // Auto-advance each question after 4s in example
  useEffect(() => {
    if (currentQ < 0 || showIntro) return;
    const t = setTimeout(() => advanceQuestion(), 4000);
    return () => clearTimeout(t);
  }, [currentQ, showIntro, advanceQuestion]);

  const currentQuestion = currentQ >= 0 ? questions[currentQ] : null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Camera feed background */}
      {videoRef && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />

      {/* "EXEMPLE" badge top-left — brutalist */}
      <motion.div
        className="absolute top-5 left-4 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="brutal-tag brutal-tag-red">
            <span className="flex items-center gap-1.5">
              <motion.div
                className="w-2 h-2 bg-white"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              Exemple
            </span>
          </span>
        </div>
      </motion.div>

      {/* Progress counter top-right */}
      {currentQ >= 0 && (
        <motion.div
          className="absolute top-5 right-14 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="brutal-tag brutal-tag-white">
            {currentQ + 1}/3
          </span>
        </motion.div>
      )}

      {/* Intro splash */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
          >
            <motion.h1
              className="text-5xl font-black text-white mb-2 uppercase"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              Regarde !
            </motion.h1>
            <motion.p
              className="text-white/60 text-sm font-bold uppercase tracking-wider"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Voilà comment ça se passe...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question display - stacks at the bottom */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-20">
        {/* Already answered questions - faded and stacked above */}
        <div className="space-y-2 mb-3">
          <AnimatePresence>
            {answeredQuestions.map((qIdx) => {
              const q = questions[qIdx];
              return (
                <motion.div
                  key={q.id}
                  className="bg-black/60 border-2 border-white/20 px-4 py-2.5"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0.4, y: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{q.emoji}</span>
                    <span className="text-xs text-white/60 line-through">{q.text}</span>
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
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {/* Category tag */}
              <motion.div
                className="mb-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="brutal-tag brutal-tag-red">
                  {currentQuestion.category}
                </span>
              </motion.div>

              {/* Question card — brutalist */}
              <div className="bg-black/80 border-3 border-white p-5" style={{ borderWidth: '3px' }}>
                <div className="flex items-start gap-3">
                  <motion.span
                    className="text-2xl"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {currentQuestion.emoji}
                  </motion.span>
                  <motion.p
                    className="text-lg font-black text-white leading-snug uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {currentQuestion.text}
                  </motion.p>
                </div>

                {/* Simulated voice activity */}
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
                        className="w-1 bg-burgundy-500 rounded-none"
                        animate={{ height: [3, 10 + Math.random() * 8, 3] }}
                        transition={{
                          duration: 0.3 + Math.random() * 0.2,
                          repeat: Infinity,
                          delay: i * 0.08,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-burgundy-400 font-black uppercase tracking-wider">
                    Réponse en cours...
                  </span>
                </motion.div>

                {/* Timer bar — sharp */}
                <div className="mt-3 h-1.5 bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-burgundy-500"
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

      {/* Progress bars at very bottom — sharp */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2 px-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`h-1 transition-all duration-500 ${
              i === currentQ
                ? "w-10 bg-burgundy-500"
                : i < currentQ
                ? "w-6 bg-white"
                : "w-6 bg-white/20"
            }`}
            layout
          />
        ))}
      </div>
    </div>
  );
}
