"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, type Question } from "@/data/questions";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";

interface QuestionOverlayProps {
  questionIndex: number;
  stream: MediaStream | null;
  onAnswered: (questionId: number, answer: "A" | "B") => void;
  onAllDone: () => void;
}

const SILENCE_THRESHOLD_MS = 2000; // 2s of silence after speech → advance

export default function QuestionOverlay({
  questionIndex,
  stream,
  onAnswered,
  onAllDone,
}: QuestionOverlayProps) {
  const [timer, setTimer] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const question: Question | undefined = questions[questionIndex];
  const { isSpeaking, hasSpoken, silenceDurationMs } = useVoiceActivity(stream, questionIndex);

  const advanceToNext = useCallback(() => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    setShowTransition(true);
    setTimeout(() => {
      setShowTransition(false);
      setSelectedAnswer(null);
      setTimer(0);
      setIsAdvancing(false);
      if (questionIndex >= questions.length - 1) {
        onAllDone();
      }
    }, 800);
  }, [isAdvancing, questionIndex, onAllDone]);

  const handleAnswer = useCallback(
    (answer: "A" | "B") => {
      if (selectedAnswer || isAdvancing) return;
      setSelectedAnswer(answer);
      onAnswered(question.id, answer);
    },
    [selectedAnswer, isAdvancing, question, onAnswered]
  );

  // Voice-based auto-advance: when silence detected after speech
  useEffect(() => {
    if (!question || isAdvancing || showTransition) return;

    if (hasSpoken && silenceDurationMs >= SILENCE_THRESHOLD_MS) {
      // If no answer selected, auto-select A
      if (!selectedAnswer) {
        onAnswered(question.id, "A");
        setSelectedAnswer("A");
      }
      advanceToNext();
    }
  }, [hasSpoken, silenceDurationMs, question, selectedAnswer, isAdvancing, showTransition, onAnswered, advanceToNext]);

  // Manual answer: if user taps and has already spoken + is silent, advance quickly
  useEffect(() => {
    if (!selectedAnswer || isAdvancing || showTransition) return;

    // If user already spoke and is now silent, advance after brief visual feedback
    if (hasSpoken && !isSpeaking && silenceDurationMs > 500) {
      const t = setTimeout(() => advanceToNext(), 400);
      return () => clearTimeout(t);
    }

    // If user tapped but hasn't spoken yet (or is still speaking), wait for silence
    // The voice-based effect above will handle it
    // But also set a fallback: if they tap and 3s pass, advance anyway
    const fallback = setTimeout(() => {
      if (!isAdvancing) advanceToNext();
    }, 3000);

    return () => clearTimeout(fallback);
  }, [selectedAnswer, hasSpoken, isSpeaking, silenceDurationMs, isAdvancing, showTransition, advanceToNext]);

  // Safety net: max timer auto-advance
  useEffect(() => {
    if (!question || selectedAnswer || isAdvancing) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        const next = t + 0.1;
        if (next >= question.duration) {
          handleAnswer("A");
          return question.duration;
        }
        return isSpeaking ? t : next; // Pause timer while speaking
      });
    }, 100);

    return () => clearInterval(interval);
  }, [question, selectedAnswer, isAdvancing, isSpeaking, handleAnswer]);

  if (!question) return null;

  const progress = (timer / question.duration) * 100;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-white/60">
              Fast & Curious
            </span>
            {/* Voice activity indicator */}
            {isSpeaking && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-burgundy-400 rounded-full"
                    animate={{ height: [4, 12, 4] }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
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
                  ? "bg-burgundy-400"
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
            className="absolute inset-0 flex items-center justify-center bg-navy-500/80 backdrop-blur-sm z-40"
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
              {questionIndex < questions.length - 1 ? "NEXT!" : "FINI!"}
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

            {/* Timer + speaking indicator */}
            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors duration-500 ${
                  isSpeaking
                    ? "bg-burgundy-300"
                    : progress > 75
                    ? "bg-red-400"
                    : "bg-white"
                }`}
                style={{ width: `${100 - progress}%` }}
              />
            </div>
            {isSpeaking && (
              <p className="text-[10px] text-white/40 mt-1 text-center">
                En écoute...
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
