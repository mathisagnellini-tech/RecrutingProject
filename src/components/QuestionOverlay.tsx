"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, transitions, type Question } from "@/data/questions";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";

interface QuestionOverlayProps {
  questionIndex: number;
  stream: MediaStream | null;
  onAnswered: (questionId: number) => void;
  onAllDone: () => void;
}

const SILENCE_THRESHOLD_MS = 2000;

export default function QuestionOverlay({
  questionIndex,
  stream,
  onAnswered,
  onAllDone,
}: QuestionOverlayProps) {
  const [timer, setTimer] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);

  const question: Question | undefined = questions[questionIndex];
  const { isSpeaking, hasSpoken, silenceDurationMs } = useVoiceActivity(stream, questionIndex);

  const advanceToNext = useCallback(() => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    setAnsweredQuestions((prev) => [...prev, questionIndex]);
    onAnswered(question.id);

    setShowTransition(true);
    setTimeout(() => {
      setShowTransition(false);
      setTimer(0);
      setIsAdvancing(false);
      if (questionIndex >= questions.length - 1) {
        onAllDone();
      }
    }, 800);
  }, [isAdvancing, questionIndex, question, onAnswered, onAllDone]);

  // Voice-based auto-advance: silence after speech
  useEffect(() => {
    if (!question || isAdvancing || showTransition) return;
    if (hasSpoken && silenceDurationMs >= SILENCE_THRESHOLD_MS) {
      advanceToNext();
    }
  }, [hasSpoken, silenceDurationMs, question, isAdvancing, showTransition, advanceToNext]);

  // Safety net: max timer auto-advance
  useEffect(() => {
    if (!question || isAdvancing) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        const next = t + 0.1;
        if (next >= question.duration) {
          advanceToNext();
          return question.duration;
        }
        return isSpeaking ? t : next; // Pause timer while speaking
      });
    }, 100);

    return () => clearInterval(interval);
  }, [question, isAdvancing, isSpeaking, advanceToNext]);

  if (!question) return null;

  const progress = (timer / question.duration) * 100;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* REC indicator */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/90">
                REC
              </span>
            </div>
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
          <span className="text-xs font-bold text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
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

      {/* Camera frame corners */}
      <div className="absolute inset-6 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br-lg" />
      </div>

      {/* Transition flash */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-navy-500/80 backdrop-blur-sm z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              className="text-3xl font-black text-white text-center"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", damping: 10 }}
            >
              {questionIndex < questions.length - 1
                ? transitions[Math.min(questionIndex, transitions.length - 1)]
                : "FINI ! 🎉"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom section: answered questions + current question + skip */}
      <div className="absolute inset-x-4 bottom-6 pointer-events-auto">
        {/* Previously answered - show last 2 max */}
        <div className="space-y-1.5 mb-3">
          <AnimatePresence>
            {answeredQuestions.slice(-2).map((qIdx) => {
              const q = questions[qIdx];
              return (
                <motion.div
                  key={q.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0.35 }}
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

        {/* Current question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ y: 80, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
          >
            {/* Category */}
            <motion.div
              className="mb-2"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${question.gradient} shadow-lg`}>
                {question.category}
              </span>
            </motion.div>

            {/* Question */}
            <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 shadow-2xl shadow-black/30 border border-white/10">
              <div className="flex items-start gap-3">
                <motion.span
                  className="text-2xl shrink-0"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {question.emoji}
                </motion.span>
                <p className="text-lg font-bold text-white leading-snug">
                  {question.text}
                </p>
              </div>

              {/* Voice status + timer */}
              <div className="mt-4 flex items-center gap-2">
                {isSpeaking ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-burgundy-400 rounded-full"
                          animate={{ height: [3, 10 + Math.random() * 8, 3] }}
                          transition={{
                            duration: 0.3 + Math.random() * 0.2,
                            repeat: Infinity,
                            delay: i * 0.08,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-burgundy-300 font-semibold uppercase tracking-wider">
                      En écoute...
                    </span>
                  </>
                ) : hasSpoken ? (
                  <motion.span
                    className="text-[10px] text-white/40 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Passage auto dans un instant...
                  </motion.span>
                ) : (
                  <span className="text-[10px] text-white/30 font-medium">
                    Réponds à voix haute !
                  </span>
                )}
              </div>

              {/* Timer bar */}
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors duration-500 ${
                    isSpeaking
                      ? "bg-burgundy-400"
                      : progress > 75
                      ? "bg-red-400"
                      : "bg-white/60"
                  }`}
                  style={{ width: `${100 - progress}%` }}
                />
              </div>
            </div>

            {/* Skip button */}
            <motion.button
              className="mt-3 w-full py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-sm font-semibold text-white/60 active:bg-white/20 transition-colors"
              whileTap={{ scale: 0.97 }}
              onClick={advanceToNext}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Passer →
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
