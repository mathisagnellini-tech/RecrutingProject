"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "@/data/questions";

export default function ExampleVideo({ onFinished }: { onFinished: () => void }) {
  const [currentQ, setCurrentQ] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState(0);

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

  useEffect(() => {
    if (currentQ === -1) {
      const t = setTimeout(() => advanceQuestion(), 2000);
      return () => clearTimeout(t);
    }

    const q = questions[currentQ];
    if (!q) return;

    // Use shorter durations for example (3s per question)
    const exampleDuration = 3000;
    const answerTimeout = setTimeout(() => setShowAnswer(true), exampleDuration / 2);
    const nextTimeout = setTimeout(() => advanceQuestion(), exampleDuration);

    const interval = setInterval(() => {
      setTimer((t) => Math.min(t + 0.1, exampleDuration / 1000));
    }, 100);

    return () => {
      clearTimeout(answerTimeout);
      clearTimeout(nextTimeout);
      clearInterval(interval);
    };
  }, [currentQ, advanceQuestion]);

  const currentQuestion = currentQ >= 0 ? questions[currentQ] : null;
  const exampleDuration = 3;
  const progress = currentQuestion ? (timer / exampleDuration) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-burgundy-700 via-navy-600 to-navy-800 overflow-hidden">
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
                ["#8B1A2B", "#aa2040", "#1a2744", "#364d7a", "#5f121d", "#5772ab"][i]
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

      {/* Header */}
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
            <motion.span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-white/20 backdrop-blur-sm"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentQuestion.category}
            </motion.span>

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

              <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${100 - progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            <div className="flex justify-center mt-3 gap-1.5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentQ
                      ? "w-6 bg-white"
                      : i < currentQ
                      ? "w-3 bg-burgundy-400"
                      : "w-3 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] z-10 pointer-events-none">
        <p className="text-6xl font-black text-white/5 tracking-widest">EXEMPLE</p>
      </div>
    </div>
  );
}
