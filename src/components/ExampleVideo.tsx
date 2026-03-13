"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "@/data/questions";

/**
 * Simulated "example" Fast & Curious video.
 * Shows animated question cards over a gradient background
 * to demonstrate what the candidate's video will look like.
 */
export default function ExampleVideo({ onFinished }: { onFinished: () => void }) {
  const [currentQ, setCurrentQ] = useState(-1); // -1 = intro
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState(0);

  // Example "answers" for the demo (alternating A/B)
  const exampleAnswers = [
    "A", "A", "B", "A", "A", "B", "B", "A", "A", "B",
  ];

  const advanceQuestion = useCallback(() => {
    if (currentQ >= questions.length - 1) {
      onFinished();
      return;
    }
    setShowAnswer(false);
    setCurrentQ((q) => q + 1);
    setTimer(0);
  }, [currentQ, onFinished]);

  // Auto-advance the demo
  useEffect(() => {
    if (currentQ === -1) {
      // Show intro for 2s then start
      const t = setTimeout(() => advanceQuestion(), 2000);
      return () => clearTimeout(t);
    }

    const q = questions[currentQ];
    if (!q) return;

    // Show question, then after half duration show "answer", then advance
    const answerTimeout = setTimeout(() => setShowAnswer(true), (q.duration * 1000) / 2);
    const nextTimeout = setTimeout(() => advanceQuestion(), q.duration * 1000);

    // Timer animation
    const interval = setInterval(() => {
      setTimer((t) => Math.min(t + 0.1, q.duration));
    }, 100);

    return () => {
      clearTimeout(answerTimeout);
      clearTimeout(nextTimeout);
      clearInterval(interval);
    };
  }, [currentQ, advanceQuestion]);

  const currentQuestion = currentQ >= 0 ? questions[currentQ] : null;
  const progress = currentQuestion ? (timer / currentQuestion.duration) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-black overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: 100 + i * 40,
              height: 100 + i * 40,
              background: `linear-gradient(135deg, ${
                ["#ff006e", "#ffbe0b", "#00f5d4", "#667eea", "#764ba2", "#f72585"][i]
              }, transparent)`,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Fake webcam silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
          <svg className="w-16 h-16 text-white/30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      {/* Header logo */}
      <motion.div
        className="absolute top-6 left-0 right-0 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-white/60">
          Fast & Curious
        </h2>
      </motion.div>

      {/* Intro screen */}
      <AnimatePresence>
        {currentQ === -1 && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <motion.h1
              className="text-4xl font-bold gradient-text mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              EXEMPLE
            </motion.h1>
            <p className="text-white/60 text-sm">Regarde comment ça marche...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question overlay */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            className="absolute inset-x-4 bottom-24 z-20"
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Category tag */}
            <motion.span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 backdrop-blur-sm"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentQuestion.category}
            </motion.span>

            {/* Question card */}
            <div className={`bg-gradient-to-r ${currentQuestion.gradient} rounded-2xl p-5 backdrop-blur-lg shadow-2xl`}>
              <div className="flex items-center justify-between gap-4">
                <motion.div
                  className={`flex-1 text-center p-3 rounded-xl font-bold text-lg ${
                    showAnswer && exampleAnswers[currentQ] === "A"
                      ? "bg-white text-gray-900 scale-110"
                      : "bg-white/20"
                  } transition-all duration-300`}
                  whileHover={{ scale: 1.05 }}
                >
                  {currentQuestion.optionA}
                </motion.div>

                <span className="text-2xl font-black text-white/40">OU</span>

                <motion.div
                  className={`flex-1 text-center p-3 rounded-xl font-bold text-lg ${
                    showAnswer && exampleAnswers[currentQ] === "B"
                      ? "bg-white text-gray-900 scale-110"
                      : "bg-white/20"
                  } transition-all duration-300`}
                  whileHover={{ scale: 1.05 }}
                >
                  {currentQuestion.optionB}
                </motion.div>
              </div>

              {/* Timer bar */}
              <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${100 - progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Question counter */}
            <div className="flex justify-center mt-3 gap-1.5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentQ
                      ? "w-6 bg-white"
                      : i < currentQ
                      ? "w-3 bg-white/60"
                      : "w-3 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "EXEMPLE" watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] z-10 pointer-events-none">
        <p className="text-6xl font-black text-white/5 tracking-widest">EXEMPLE</p>
      </div>
    </div>
  );
}
