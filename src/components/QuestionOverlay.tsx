"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, type Question } from "@/data/questions";

interface QuestionOverlayProps {
  questionIndex: number;
  onAnswered: (questionId: number, answer: "A" | "B") => void;
  onAllDone: () => void;
}

export default function QuestionOverlay({
  questionIndex,
  onAnswered,
  onAllDone,
}: QuestionOverlayProps) {
  const [timer, setTimer] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | null>(null);
  const [showTransition, setShowTransition] = useState(false);

  const question: Question | undefined = questions[questionIndex];

  const handleAnswer = useCallback(
    (answer: "A" | "B") => {
      if (selectedAnswer) return; // already answered
      setSelectedAnswer(answer);
      onAnswered(question.id, answer);

      // Brief pause to show selection, then move on
      setTimeout(() => {
        setShowTransition(true);
        setTimeout(() => {
          setShowTransition(false);
          setSelectedAnswer(null);
          setTimer(0);
          if (questionIndex >= questions.length - 1) {
            onAllDone();
          }
        }, 800);
      }, 600);
    },
    [selectedAnswer, question, questionIndex, onAnswered, onAllDone]
  );

  // Auto-advance if time runs out (auto-skip)
  useEffect(() => {
    if (!question || selectedAnswer) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        const next = t + 0.1;
        if (next >= question.duration) {
          // Time's up - auto-answer A
          handleAnswer("A");
          return question.duration;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [question, selectedAnswer, handleAnswer]);

  if (!question) return null;

  const progress = (timer / question.duration) * 100;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Top bar - question counter */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold tracking-wider uppercase text-white/60">
            Fast & Curious
          </span>
          <span className="text-xs font-bold text-white/80">
            {questionIndex + 1}/{questions.length}
          </span>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1 mt-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                i < questionIndex
                  ? "bg-white"
                  : i === questionIndex
                  ? "bg-white/80"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Transition flash */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              className="text-3xl font-black text-white"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", damping: 10 }}
            >
              {questionIndex < questions.length - 1 ? "NEXT! 🔥" : "FINI! 🎉"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          className="absolute inset-x-4 bottom-20 pointer-events-auto"
          initial={{ y: 120, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
        >
          {/* Category */}
          <motion.div
            className="mb-2"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
              {question.category}
            </span>
          </motion.div>

          {/* Options */}
          <div
            className={`bg-gradient-to-r ${question.gradient} rounded-2xl p-5 shadow-2xl shadow-black/30`}
          >
            <div className="flex items-center gap-3">
              {/* Option A */}
              <motion.button
                className={`flex-1 text-center p-4 rounded-xl font-bold text-base transition-all duration-200 ${
                  selectedAnswer === "A"
                    ? "bg-white text-gray-900 shadow-lg scale-105"
                    : "bg-white/20 hover:bg-white/30 active:scale-95"
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer("A")}
                disabled={selectedAnswer !== null}
              >
                {question.optionA}
              </motion.button>

              <span className="text-xl font-black text-white/50 shrink-0">OU</span>

              {/* Option B */}
              <motion.button
                className={`flex-1 text-center p-4 rounded-xl font-bold text-base transition-all duration-200 ${
                  selectedAnswer === "B"
                    ? "bg-white text-gray-900 shadow-lg scale-105"
                    : "bg-white/20 hover:bg-white/30 active:scale-95"
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer("B")}
                disabled={selectedAnswer !== null}
              >
                {question.optionB}
              </motion.button>
            </div>

            {/* Timer */}
            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors duration-500 ${
                  progress > 75 ? "bg-red-400" : "bg-white"
                }`}
                style={{ width: `${100 - progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
