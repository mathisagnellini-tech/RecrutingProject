"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, type Question } from "@/data/questions";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";

interface QuestionOverlayProps {
  questionIndex: number;
  stream: MediaStream | null;
  onAnswered: (questionId: number) => void;
  onAllDone: () => void;
}

const QUESTION_DURATION = 12;
const QUESTION_DISPLAY_DELAY = 3;

export default function QuestionOverlay({
  questionIndex,
  stream,
  onAnswered,
  onAllDone,
}: QuestionOverlayProps) {
  const [timer, setTimer] = useState(0);
  const [displayTimer, setDisplayTimer] = useState(0);
  const [phase, setPhase] = useState<"display" | "countdown" | "transition">("display");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const prevIndexRef = useRef(questionIndex);

  const question: Question | undefined = questions[questionIndex];
  const isLastQuestion = questionIndex >= questions.length - 1;
  const { isSpeaking } = useVoiceActivity(stream, questionIndex);

  // Reset timers only when questionIndex actually advances (NOT during transition)
  useEffect(() => {
    if (questionIndex !== prevIndexRef.current) {
      prevIndexRef.current = questionIndex;
      // Don't reset if we're in transition — the timeout in advanceToNext handles it
      if (phaseRef.current !== "transition") {
        setPhase("display");
        setDisplayTimer(0);
        setTimer(0);
      }
    }
  }, [questionIndex]);

  // Display phase: 3s reading time
  useEffect(() => {
    if (phase !== "display" || !question) return;

    const interval = setInterval(() => {
      setDisplayTimer((t) => {
        const next = t + 0.1;
        if (next >= QUESTION_DISPLAY_DELAY) {
          setPhase("countdown");
          return QUESTION_DISPLAY_DELAY;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, question]);

  const advanceToNext = useCallback(() => {
    if (phaseRef.current === "transition") return;
    setPhase("transition");

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const wasLastQuestion = isLastQuestion;
    onAnswered(question.id);

    setTimeout(() => {
      setTimer(0);
      setDisplayTimer(0);
      if (wasLastQuestion) {
        onAllDone();
      } else {
        setPhase("display");
      }
    }, 1200);
  }, [question, isLastQuestion, onAnswered, onAllDone]);

  // Countdown phase: strict 12s timer (skip for last question - unlimited)
  useEffect(() => {
    if (phase !== "countdown" || !question || isLastQuestion) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        const next = t + 0.1;
        if (next >= QUESTION_DURATION) {
          advanceToNext();
          return QUESTION_DURATION;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, question, isLastQuestion, advanceToNext]);

  if (!question) return null;

  const remainingSeconds = Math.ceil(QUESTION_DURATION - timer);
  const progress = phase === "countdown" ? (timer / QUESTION_DURATION) * 100 : 0;
  const isDisplayPhase = phase === "display";
  const isTransition = phase === "transition";
  const isCountdown = phase === "countdown";

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Top bar - always visible except during transition */}
      {!isTransition && (
        <div className="absolute top-4 left-4 right-4 pointer-events-auto z-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
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
              {isSpeaking && isCountdown && (
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
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black tabular-nums bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 ${
                  isDisplayPhase
                    ? "text-white/60"
                    : remainingSeconds <= 3
                    ? "text-red-400"
                    : "text-white/80"
                }`}
              >
                {isDisplayPhase ? "Lis..." : isLastQuestion ? "∞" : `${remainingSeconds}s`}
              </span>
              <span className="text-xs font-bold text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
                {questionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
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
      )}

      {/* Camera frame corners */}
      {isCountdown && (
        <div className="absolute inset-6 pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br-lg" />
        </div>
      )}

      {/* ===== DISPLAY PHASE: centered question with blur ===== */}
      <AnimatePresence>
        {isDisplayPhase && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Blur backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

            {/* Question card - centered */}
            <motion.div
              className="relative z-10 mx-6 max-w-sm w-full"
              initial={{ y: 40, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 250 }}
            >
              <motion.div
                className="mb-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${question.gradient} shadow-lg`}>
                  {question.category}
                </span>
              </motion.div>

              <div className={`rounded-2xl p-6 bg-gradient-to-br ${question.gradient} shadow-2xl border border-white/20`}>
                <div className="flex items-start gap-4">
                  <motion.span
                    className="text-4xl shrink-0"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    {question.emoji}
                  </motion.span>
                  <p className="text-xl font-black text-white leading-snug pt-1">
                    {question.text}
                  </p>
                </div>

                {/* Reading progress bar */}
                <div className="mt-5 h-1 bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white/50"
                    style={{ width: `${(displayTimer / QUESTION_DISPLAY_DELAY) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-2 text-center font-medium uppercase tracking-wider">
                  Prépare ta réponse...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition overlay */}
      <AnimatePresence>
        {isTransition && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-40 pointer-events-none px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isLastQuestion ? (
              <motion.div
                className="text-center"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
              >
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: 1 }}
                >
                  🎬
                </motion.div>
                <p className="text-3xl font-black gradient-text">
                  Voici le récap !
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="text-center"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <motion.span
                  className="text-5xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {question.emoji}
                </motion.span>
                <p className="text-lg font-bold text-white/60 mt-2">
                  ✓ {question.text}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== COUNTDOWN PHASE: question at bottom, camera visible ===== */}
      {isCountdown && (
        <div className="absolute inset-x-4 bottom-6 pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`countdown-${question.id}`}
              initial={{ y: 60, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 shadow-2xl shadow-black/30 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{question.emoji}</span>
                  <p className="text-base font-bold text-white leading-snug">
                    {question.text}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2">
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
                  ) : (
                    <span className="text-[10px] text-white/30 font-medium">
                      Réponds à voix haute !
                    </span>
                  )}
                </div>

                {/* Timer bar (hidden for last question) */}
                {!isLastQuestion && (
                  <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors duration-500 ${
                        remainingSeconds <= 3
                          ? "bg-red-400"
                          : isSpeaking
                          ? "bg-burgundy-400"
                          : "bg-white/60"
                      }`}
                      style={{ width: `${100 - progress}%` }}
                    />
                  </div>
                )}

                {isLastQuestion && (
                  <p className="mt-3 text-[10px] text-white/40 font-medium text-center">
                    Prends ton temps, pas de limite
                  </p>
                )}
              </div>

              {/* Button */}
              <motion.button
                className={`mt-2 w-full py-3 rounded-xl backdrop-blur-sm text-sm font-bold active:scale-95 transition-all ${
                  isLastQuestion
                    ? "bg-gradient-to-r from-burgundy-500 to-navy-500 text-white shadow-lg shadow-burgundy-500/30"
                    : "bg-white/20 border border-white/20 text-white"
                }`}
                whileTap={{ scale: 0.97 }}
                onClick={advanceToNext}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isLastQuestion ? "Terminer 🎬" : "Question suivante →"}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
