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
  const transitioningRef = useRef(false);

  const question: Question | undefined = questions[questionIndex];
  const isLastQuestion = questionIndex >= questions.length - 1;
  const { isSpeaking } = useVoiceActivity(stream, questionIndex);

  // Keep refs for callbacks to avoid stale closures
  const questionRef = useRef(question);
  questionRef.current = question;
  const isLastRef = useRef(isLastQuestion);
  isLastRef.current = isLastQuestion;
  const onAnsweredRef = useRef(onAnswered);
  onAnsweredRef.current = onAnswered;
  const onAllDoneRef = useRef(onAllDone);
  onAllDoneRef.current = onAllDone;

  // Reset timers only when questionIndex actually advances (NOT during transition)
  useEffect(() => {
    if (questionIndex !== prevIndexRef.current) {
      prevIndexRef.current = questionIndex;
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
    // Double guard with ref to prevent any race condition
    if (transitioningRef.current || phaseRef.current === "transition") return;
    transitioningRef.current = true;
    setPhase("transition");

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Capture values NOW before any re-render
    const currentQuestion = questionRef.current;
    const wasLast = isLastRef.current;

    if (currentQuestion) {
      onAnsweredRef.current(currentQuestion.id);
    }

    setTimeout(() => {
      transitioningRef.current = false;
      setTimer(0);
      setDisplayTimer(0);
      if (wasLast) {
        onAllDoneRef.current();
      } else {
        setPhase("display");
      }
    }, 1200);
  }, []); // No deps needed — everything is read from refs

  // Countdown phase: strict 12s timer (skip for last question - unlimited)
  useEffect(() => {
    if (phase !== "countdown" || !question || isLastQuestion) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        if (transitioningRef.current) return t; // Don't tick during transition
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
              <div className="flex items-center gap-1.5 brutal-tag brutal-tag-red">
                <motion.div
                  className="w-2 h-2 bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-[10px] font-black tracking-wider uppercase">
                  REC
                </span>
              </div>
              {isSpeaking && isCountdown && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-burgundy-400"
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
                className={`text-xs font-black tabular-nums brutal-tag ${
                  isDisplayPhase
                    ? "brutal-tag-white"
                    : remainingSeconds <= 3
                    ? "brutal-tag-red"
                    : "brutal-tag-white"
                }`}
              >
                {isDisplayPhase ? "LIS..." : isLastQuestion ? "∞" : `${remainingSeconds}S`}
              </span>
              <span className="text-xs font-black brutal-tag brutal-tag-yellow">
                {questionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
          {/* Progress bars — sharp */}
          <div className="flex gap-1 mt-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 transition-all duration-500 ${
                  i < questionIndex
                    ? "bg-burgundy-500"
                    : i === questionIndex
                    ? "bg-white"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Camera frame corners — thick, sharp */}
      {isCountdown && (
        <div className="absolute inset-6 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white" style={{ borderTopWidth: '3px', borderLeftWidth: '3px' }} />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white" style={{ borderTopWidth: '3px', borderRightWidth: '3px' }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white" style={{ borderBottomWidth: '3px', borderLeftWidth: '3px' }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white" style={{ borderBottomWidth: '3px', borderRightWidth: '3px' }} />
        </div>
      )}

      {/* ===== DISPLAY PHASE: centered question with dark bg ===== */}
      <AnimatePresence>
        {isDisplayPhase && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dark backdrop — no blur, raw */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Question card - centered, brutalist */}
            <motion.div
              className="relative z-10 mx-6 max-w-sm w-full"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 250 }}
            >
              <motion.div
                className="mb-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="brutal-tag brutal-tag-red text-xs">
                  {question.category}
                </span>
              </motion.div>

              <div className="bg-black border-3 border-white p-6" style={{ borderWidth: '3px' }}>
                <div className="flex items-start gap-4">
                  <motion.span
                    className="text-4xl shrink-0"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    {question.emoji}
                  </motion.span>
                  <p className="text-xl font-black text-white leading-snug pt-1 uppercase">
                    {question.text}
                  </p>
                </div>

                {/* Reading progress bar — sharp red */}
                <div className="mt-5 h-1.5 bg-white/15 overflow-hidden">
                  <motion.div
                    className="h-full bg-burgundy-500"
                    style={{ width: `${(displayTimer / QUESTION_DISPLAY_DELAY) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-2 text-center font-black uppercase tracking-wider">
                  Prépare ta réponse...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition overlay — Entre Nous bumper */}
      <AnimatePresence>
        {isTransition && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-navy-500 z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isLastQuestion ? (
              <motion.div
                className="text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
              >
                <p className="text-4xl font-black text-white uppercase">
                  Voici le{" "}
                  <span className="bg-burgundy-500 px-2">récap !</span>
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <h2 className="text-[48px] leading-[0.95] font-black text-white tracking-tight">
                  ENTRE
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[48px] font-black text-white leading-none">&amp;</span>
                  <span className="text-[48px] font-black leading-none bg-burgundy-500 text-white px-3">
                    NOUS
                  </span>
                </div>
                <motion.div
                  className="mt-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                    Question {questionIndex + 2}/{questions.length}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== COUNTDOWN PHASE: question at bottom, camera visible ===== */}
      {isCountdown && (
        <div className="absolute inset-x-4 pointer-events-auto" style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`countdown-${question.id}`}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              <div className="bg-black/80 border-3 border-white p-4" style={{ borderWidth: '3px' }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{question.emoji}</span>
                  <p className="text-base font-black text-white leading-snug uppercase">
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
                            className="w-1 bg-burgundy-500"
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
                        En écoute...
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/30 font-black uppercase">
                      Réponds à voix haute !
                    </span>
                  )}
                </div>

                {/* Timer bar (hidden for last question) — sharp */}
                {!isLastQuestion && (
                  <div className="mt-3 h-2 bg-white/10 overflow-hidden">
                    <motion.div
                      className={`h-full transition-colors duration-500 ${
                        remainingSeconds <= 3
                          ? "bg-burgundy-500"
                          : isSpeaking
                          ? "bg-burgundy-500"
                          : "bg-white"
                      }`}
                      style={{ width: `${100 - progress}%` }}
                    />
                  </div>
                )}

                {isLastQuestion && (
                  <p className="mt-3 text-[10px] text-white/40 font-black text-center uppercase tracking-wider">
                    Prends ton temps, pas de limite
                  </p>
                )}
              </div>

              {/* Button — brutalist */}
              <motion.button
                className={`mt-2 w-full py-3 text-sm font-black uppercase tracking-wider active:translate-x-[2px] active:translate-y-[2px] transition-transform ${
                  isLastQuestion
                    ? "brutal-btn brutal-btn-primary"
                    : "brutal-btn brutal-btn-dark"
                }`}
                whileTap={{ scale: 0.97 }}
                onClick={advanceToNext}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isLastQuestion ? "Terminer" : "Question suivante →"}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
