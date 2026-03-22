"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, type Question, transitions } from "@/data/questions";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";

interface QuestionOverlayProps {
  questionIndex: number;
  stream: MediaStream | null;
  onAnswered: (questionId: number) => void;
  onAllDone: () => void;
}

const QUESTION_DURATION = 12;
const QUESTION_DISPLAY_DELAY = 3;

/* ─────────────────────────────────────────────────────────
   LIQUID GLASS TRANSITION ANIMATIONS
   Soft, flowing shapes that animate through the screen
   ───────────────────────────────────────────────────────── */

function LiquidOrbs({ variant }: { variant: number }) {
  const colors = [
    ['#2D5BFF', '#5B8DEF', '#C93A5A'],
    ['#C93A5A', '#2D5BFF', '#5B8DEF'],
    ['#5B8DEF', '#C93A5A', '#2D5BFF'],
  ][variant % 3];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 120 + i * 40,
            height: 120 + i * 40,
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
          initial={{
            x: i % 2 === 0 ? '-30%' : '130%',
            y: `${20 + i * 25}%`,
            scale: 0.5,
            opacity: 0,
          }}
          animate={{
            x: `${20 + i * 25}%`,
            y: `${15 + i * 20}%`,
            scale: [0.5, 1.2, 1],
            opacity: [0, 0.6, 0.4],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────── */

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

  const transitionMessage = useMemo(
    () => transitions[questionIndex % transitions.length],
    [questionIndex]
  );

  const questionRef = useRef(question);
  questionRef.current = question;
  const isLastRef = useRef(isLastQuestion);
  isLastRef.current = isLastQuestion;
  const onAnsweredRef = useRef(onAnswered);
  onAnsweredRef.current = onAnswered;
  const onAllDoneRef = useRef(onAllDone);
  onAllDoneRef.current = onAllDone;

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
    if (transitioningRef.current || phaseRef.current === "transition") return;
    transitioningRef.current = true;
    setPhase("transition");
    if (navigator.vibrate) navigator.vibrate(50);

    const currentQuestion = questionRef.current;
    const wasLast = isLastRef.current;
    if (currentQuestion) onAnsweredRef.current(currentQuestion.id);

    setTimeout(() => {
      transitioningRef.current = false;
      setTimer(0);
      setDisplayTimer(0);
      if (wasLast) {
        onAllDoneRef.current();
      } else {
        setPhase("display");
      }
    }, 1800);
  }, []);

  useEffect(() => {
    if (phase !== "countdown" || !question || isLastQuestion) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (transitioningRef.current) return t;
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

      {/* ═══════════════ TOP BAR ═══════════════ */}
      {!isTransition && (
        <div className="absolute top-4 left-4 right-4 pointer-events-auto z-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="pill pill-rec">
                <motion.div
                  className="w-2 h-2 rounded-full bg-red-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-[10px] font-semibold tracking-wider uppercase">REC</span>
              </span>
              {isSpeaking && isCountdown && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 rounded-full bg-accent-purple"
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="pill text-xs font-semibold">
                {isDisplayPhase ? "Lis..." : isLastQuestion ? "∞" : `${remainingSeconds}s`}
              </span>
              <span className="pill pill-accent text-xs font-semibold">
                {questionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-3">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-all duration-500 ${
                  i < questionIndex ? "bg-accent-purple" : i === questionIndex ? "bg-white" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ DISPLAY PHASE ═══════════════ */}
      <AnimatePresence>
        {isDisplayPhase && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Blurred dark backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Question card */}
            <motion.div
              className="relative z-10 mx-5 max-w-sm w-full"
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -15, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
            >
              {/* Category pill */}
              <motion.div
                className="flex items-center justify-between mb-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="pill pill-accent text-[10px]">{question.category}</span>
                <span className="text-[10px] font-medium text-white/30">
                  Q.{questionIndex + 1}
                </span>
              </motion.div>

              {/* Glass card */}
              <div className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <motion.span
                    className="text-3xl shrink-0"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {question.emoji}
                  </motion.span>
                  <p className="text-lg font-semibold text-white leading-snug pt-0.5">
                    {question.text}
                  </p>
                </div>

                {/* Reading progress */}
                <div className="mt-5">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #2D5BFF, #5B8DEF)',
                        width: `${(displayTimer / QUESTION_DISPLAY_DELAY) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-white/30 mt-2 text-center font-medium tracking-wide">
                  Prépare ta réponse...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ TRANSITION ═══════════════
           Liquid glass animation with text always on solid backdrop
      */}
      <AnimatePresence>
        {isTransition && (
          <motion.div
            className="absolute inset-0 z-40 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Dark gradient base */}
            <div className="absolute inset-0 gradient-mesh" />
            <div className="absolute inset-0 bg-black/30" />

            {/* Liquid orbs flowing */}
            <LiquidOrbs variant={questionIndex} />

            {/* Content — always on solid backdrop */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isLastQuestion ? (
                <motion.div
                  className="text-center relative z-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <div className="glass-heavy px-10 py-8">
                    <p className="text-4xl font-extrabold liquid-glass-text tracking-tight">
                      Récap !
                    </p>
                    <motion.p
                      className="text-[11px] font-medium text-white/40 mt-2 tracking-wide"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      Voici tes réponses
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="text-center relative z-10 w-full max-w-xs"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 18 }}
                >
                  {/* Glass panel for text */}
                  <div className="glass-heavy px-6 py-8">
                    {/* Transition message */}
                    <motion.p
                      className="text-sm font-medium text-white/40 tracking-wide mb-4"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {transitionMessage}
                    </motion.p>

                    {/* ENTRE TOI & NOUS — liquid glass */}
                    <h2 className="text-[42px] leading-[0.9] font-extrabold tracking-tight">
                      <span className="text-white">ENTRE TOI</span>
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-[42px] font-extrabold text-white/40 leading-none">&amp;</span>
                      <motion.span
                        className="text-[42px] font-extrabold leading-none liquid-glass-text"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      >
                        NOUS
                      </motion.span>
                    </div>

                    {/* Question counter */}
                    <motion.div
                      className="mt-5 flex items-center justify-center gap-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="h-px w-8 bg-white/15" />
                      <span className="text-[11px] font-medium text-white/35 tracking-wide">
                        Question {questionIndex + 1}/{questions.length}
                      </span>
                      <div className="h-px w-8 bg-white/15" />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ COUNTDOWN — question card ═══════════════ */}
      {isCountdown && (
        <div className="absolute inset-x-3 pointer-events-auto" style={{ bottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`countdown-${question.id}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
            >
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="pill pill-accent text-[9px] py-1 px-2.5">{question.category}</span>
                  <span className="text-[9px] font-medium text-white/25">
                    Q.{questionIndex + 1}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{question.emoji}</span>
                  <p className="text-[15px] font-semibold text-white leading-snug">
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
                        En écoute...
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/25 font-medium">
                      Réponds à voix haute !
                    </span>
                  )}
                </div>

                {/* Timer bar */}
                {!isLastQuestion && (
                  <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors duration-500`}
                      style={{
                        width: `${100 - progress}%`,
                        background: remainingSeconds <= 3
                          ? 'linear-gradient(90deg, #ef4444, #f97316)'
                          : 'linear-gradient(90deg, #2D5BFF, #5B8DEF)',
                      }}
                    />
                  </div>
                )}

                {isLastQuestion && (
                  <p className="mt-3 text-[10px] text-white/30 text-center font-medium">
                    Prends ton temps, pas de limite ✨
                  </p>
                )}
              </div>

              <motion.button
                className={`mt-2.5 w-full py-3.5 text-sm font-semibold rounded-2xl transition-all ${
                  isLastQuestion ? "btn-primary" : "btn-glass"
                }`}
                whileTap={{ scale: 0.97 }}
                onClick={advanceToNext}
                disabled={isTransition}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {isLastQuestion ? "Terminer ✨" : "Question suivante →"}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
