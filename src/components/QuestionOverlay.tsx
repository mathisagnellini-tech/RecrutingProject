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
   GEOMETRIC PATTERNS — rendered behind the text,
   only in the background/edges, never over the text zone
   ───────────────────────────────────────────────────────── */

function PatternRadialDots() {
  const dots = Array.from({ length: 40 });
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ rotate: 0 }}
      animate={{ rotate: 180 }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    >
      {dots.map((_, i) => {
        const angle = (i / 40) * 360;
        const radius = 35 + (i % 3) * 15;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + (i % 4) * 3,
              height: 4 + (i % 4) * 3,
              background: i % 3 === 0 ? '#8B1A2B' : i % 3 === 1 ? 'white' : '#364d7a',
              opacity: 0.25,
              top: `${50 + radius * Math.sin((angle * Math.PI) / 180)}%`,
              left: `${50 + radius * Math.cos((angle * Math.PI) / 180)}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          />
        );
      })}
    </motion.div>
  );
}

function PatternConcentricCircles() {
  const rings = Array.from({ length: 10 });
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {rings.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            border: `${i % 2 === 0 ? 2 : 1}px solid ${i % 3 === 0 ? '#8B1A2B' : 'white'}`,
            opacity: 0.12 + i * 0.03,
          }}
          initial={{ width: 0, height: 0 }}
          animate={{
            width: (i + 1) * 80,
            height: (i + 1) * 80,
          }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function PatternHorizontalBars() {
  const bars = Array.from({ length: 16 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0"
          style={{
            height: i % 2 === 0 ? '3px' : '6px',
            background: i % 4 === 0 ? '#8B1A2B' : i % 4 === 2 ? 'white' : 'transparent',
            opacity: i % 4 === 3 ? 0 : 0.15,
            top: `${(i / 16) * 100}%`,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: i * 0.03, duration: 0.3, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function PatternScatteredShapes() {
  const shapes = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    type: ['circle', 'square', 'diamond'][i % 3] as string,
    x: 5 + (i * 37 + 13) % 85,
    y: 3 + (i * 53 + 7) % 90,
    size: 6 + (i % 5) * 4,
    color: i % 3 === 0 ? '#8B1A2B' : i % 3 === 1 ? 'white' : '#364d7a',
    delay: i * 0.04,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className={s.type === 'circle' ? 'rounded-full' : ''}
          style={{
            position: 'absolute',
            width: s.size,
            height: s.size,
            background: s.type === 'diamond' ? 'transparent' : s.color,
            border: s.type === 'diamond' ? `2px solid ${s.color}` : 'none',
            opacity: 0.2,
            top: `${s.y}%`,
            left: `${s.x}%`,
            transform: s.type === 'diamond' ? 'rotate(45deg)' : undefined,
          }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: s.type === 'diamond' ? 45 : 0 }}
          transition={{ delay: s.delay, duration: 0.4, type: "spring", damping: 12 }}
        />
      ))}
    </div>
  );
}

function PatternWavyCircles() {
  const circles = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {circles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 20 + i * 8,
            height: 20 + i * 8,
            border: '2px solid',
            borderColor: i % 2 === 0 ? 'rgba(139,26,43,0.25)' : 'rgba(255,255,255,0.12)',
            top: `${15 + (i % 4) * 20}%`,
            left: i % 2 === 0 ? '-5%' : undefined,
            right: i % 2 === 1 ? '-5%' : undefined,
          }}
          initial={{ scale: 0, x: i % 2 === 0 ? -30 : 30 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.5 }}
        />
      ))}
    </div>
  );
}

function PatternDiagonalStripes() {
  const stripes = Array.from({ length: 14 });
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ transform: 'rotate(-15deg) scale(1.4)' }}>
      {stripes.map((_, i) => (
        <motion.div
          key={i}
          style={{
            height: i % 3 === 0 ? '4px' : '2px',
            background: i % 4 === 0 ? '#8B1A2B' : i % 4 === 2 ? 'rgba(255,255,255,0.5)' : 'transparent',
            opacity: 0.15,
            marginBottom: '20px',
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
        />
      ))}
    </div>
  );
}

const PATTERNS = [
  PatternRadialDots,
  PatternConcentricCircles,
  PatternHorizontalBars,
  PatternScatteredShapes,
  PatternWavyCircles,
  PatternDiagonalStripes,
  PatternRadialDots,
  PatternConcentricCircles,
  PatternScatteredShapes,
  PatternWavyCircles,
] as const;

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
  const PatternComponent = PATTERNS[questionIndex % PATTERNS.length];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">

      {/* ═══════════════ TOP BAR ═══════════════ */}
      {!isTransition && (
        <div className="absolute top-4 left-4 right-4 pointer-events-auto z-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 brutal-tag brutal-tag-red">
                <motion.div
                  className="w-2 h-2 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-[10px] font-black tracking-wider uppercase">REC</span>
              </div>
              {isSpeaking && isCountdown && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-burgundy-400 rounded-full"
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black tabular-nums brutal-tag ${
                isDisplayPhase ? "brutal-tag-white" : remainingSeconds <= 3 ? "brutal-tag-red" : "brutal-tag-white"
              }`}>
                {isDisplayPhase ? "LIS..." : isLastQuestion ? "∞" : `${remainingSeconds}S`}
              </span>
              <span className="text-xs font-black brutal-tag brutal-tag-yellow">
                {questionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 transition-all duration-500 ${
                  i < questionIndex ? "bg-burgundy-500" : i === questionIndex ? "bg-white" : "bg-white/20"
                }`}
                style={{ borderRadius: i === questionIndex ? '4px' : '0' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ CAMERA CORNERS ═══════════════ */}
      {isCountdown && (
        <div className="absolute inset-6 pointer-events-none">
          <div className="absolute top-0 left-0 w-10 h-10 border-white" style={{ borderTopWidth: '3px', borderLeftWidth: '3px' }} />
          <div className="absolute top-0 right-0 w-10 h-10 border-white" style={{ borderTopWidth: '3px', borderRightWidth: '3px' }} />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-white" style={{ borderBottomWidth: '3px', borderLeftWidth: '3px' }} />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-white" style={{ borderBottomWidth: '3px', borderRightWidth: '3px' }} />
          {/* Decorative circles in corners */}
          <motion.div
            className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-burgundy-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          />
          <motion.div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-burgundy-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          />
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
            <div className="absolute inset-0 bg-black/80" />

            {/* Decorative corner circles */}
            <motion.div className="absolute top-8 left-6 w-16 h-16 rounded-full border-2 border-burgundy-500/20"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} />
            <motion.div className="absolute bottom-12 right-8 w-24 h-24 rounded-full border border-white/10"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} />
            <motion.div className="absolute top-20 right-4 w-5 h-5 rounded-full bg-burgundy-500/30"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }} />
            <motion.div className="absolute bottom-24 left-10 w-3 h-3 rounded-full bg-white/15"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35 }} />

            {/* Question card */}
            <motion.div
              className="relative z-10 mx-5 max-w-sm w-full"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 250 }}
            >
              {/* Category + number row */}
              <motion.div
                className="flex items-center justify-between mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <span className="brutal-tag brutal-tag-red text-xs">{question.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-burgundy-500/60" />
                  <span className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase">
                    Q.{questionIndex + 1}
                  </span>
                </div>
              </motion.div>

              {/* Card */}
              <div className="relative">
                {/* Decorative dot cluster top-right */}
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-burgundy-500" />
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <div className="w-2 h-2 rounded-full bg-burgundy-500/50" />
                </div>
                {/* Side accent */}
                <motion.div
                  className="absolute top-3 -left-3 w-1.5 h-14 bg-burgundy-500 rounded-full"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  style={{ transformOrigin: 'top' }}
                />

                <div className="bg-black p-5" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white' }}>
                  <div className="flex items-start gap-4">
                    <motion.div
                      className="relative shrink-0"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    >
                      <span className="text-3xl">{question.emoji}</span>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-burgundy-500/40" />
                    </motion.div>
                    <p className="text-lg font-black text-white leading-snug pt-0.5 uppercase">
                      {question.text}
                    </p>
                  </div>

                  <div className="mt-4 relative">
                    <div className="h-2 bg-white/10 overflow-hidden rounded-full">
                      <motion.div
                        className="h-full bg-burgundy-500 rounded-full"
                        style={{ width: `${(displayTimer / QUESTION_DISPLAY_DELAY) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-white/35 mt-2 text-center font-black uppercase tracking-[0.25em]">
                    Prépare ta réponse
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ TRANSITION ═══════════════
           Pattern is in the BACKGROUND,
           text sits in a solid panel on top so it's always readable
      */}
      <AnimatePresence>
        {isTransition && (
          <motion.div
            className="absolute inset-0 z-40 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Solid background */}
            <div className="absolute inset-0 bg-navy-500" />

            {/* Geometric pattern — background only */}
            <PatternComponent />

            {/* Border frame with rounded corners */}
            <div className="absolute inset-3 rounded-sm" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Corner dots */}
            <div className="absolute top-5 left-5 flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-burgundy-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-burgundy-500/50" />
            </div>
            <div className="absolute bottom-5 right-5 flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-burgundy-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-burgundy-500" />
            </div>

            {/* ── TEXT CONTENT: sits on solid backdrop ── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isLastQuestion ? (
                <motion.div
                  className="text-center relative z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  {/* Solid background panel */}
                  <div className="bg-navy-500 px-10 py-6 rounded-sm" style={{ boxShadow: '0 0 60px 30px #1a2744' }}>
                    <motion.div
                      className="inline-block bg-burgundy-500 px-6 py-3 mb-3"
                      style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white' }}
                    >
                      <p className="text-3xl font-black text-white uppercase tracking-tight">
                        Récap !
                      </p>
                    </motion.div>
                    <motion.p
                      className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase"
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
                  transition={{ type: "spring", damping: 15 }}
                >
                  {/* ★ SOLID BACKGROUND PANEL — ensures text is always readable ★ */}
                  <div className="bg-navy-500 px-6 py-8 relative" style={{ boxShadow: '0 0 80px 40px #1a2744' }}>
                    {/* Decorative circles inside panel */}
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full border border-white/15" />
                    <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-burgundy-500/30" />

                    {/* Transition message */}
                    <motion.p
                      className="text-sm font-black text-white/50 uppercase tracking-[0.15em] mb-4"
                      initial={{ y: -15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {transitionMessage}
                    </motion.p>

                    {/* ENTRE TOI & NOUS */}
                    <h2 className="text-[44px] leading-[0.9] font-black text-white tracking-tight">
                      ENTRE TOI
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-[44px] font-black text-white leading-none">&amp;</span>
                      <motion.span
                        className="text-[44px] font-black leading-none bg-burgundy-500 text-white px-4 inline-block"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        NOUS
                      </motion.span>
                    </div>

                    {/* Separator line with dots */}
                    <motion.div
                      className="mt-5 flex items-center justify-center gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="h-px w-6 bg-white/25" />
                      <div className="w-1.5 h-1.5 rounded-full bg-burgundy-500" />
                      <span className="text-[11px] font-black tracking-[0.15em] text-white/50 uppercase">
                        Question {questionIndex + 1}/{questions.length}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-burgundy-500" />
                      <div className="h-px w-6 bg-white/25" />
                    </motion.div>

                    {/* Bottom decorative dots */}
                    <motion.div
                      className="flex justify-center gap-1.5 mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-burgundy-500" />
                      <div className="w-2 h-2 rounded-full bg-white/50" />
                      <div className="w-2 h-2 rounded-full bg-burgundy-500" />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ COUNTDOWN PHASE — RAISED for mobile ═══════════════ */}
      {isCountdown && (
        <div className="absolute inset-x-3 pointer-events-auto" style={{ bottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`countdown-${question.id}`}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              <div className="relative">
                {/* Side accent bar — rounded */}
                <motion.div
                  className="absolute -left-1.5 top-3 bottom-3 w-1.5 bg-burgundy-500 rounded-full"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  style={{ transformOrigin: 'top' }}
                />
                {/* Dot cluster top-right */}
                <div className="absolute -top-1.5 -right-1.5 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-burgundy-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-0.5" />
                </div>

                <div className="bg-black/85 p-4" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-burgundy-400" />
                      <span className="text-[9px] font-black tracking-[0.15em] text-burgundy-400 uppercase">
                        {question.category}
                      </span>
                    </div>
                    <span className="text-[9px] font-black tracking-[0.1em] text-white/30 uppercase">
                      Q.{questionIndex + 1}
                    </span>
                  </div>

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
                              className="w-1 bg-burgundy-500 rounded-full"
                              animate={{ height: [3, 10 + Math.random() * 8, 3] }}
                              transition={{ duration: 0.3 + Math.random() * 0.2, repeat: Infinity, delay: i * 0.08 }}
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

                  {!isLastQuestion && (
                    <div className="mt-3 h-2 bg-white/10 overflow-hidden rounded-full">
                      <motion.div
                        className={`h-full rounded-full transition-colors duration-500 ${
                          remainingSeconds <= 3 ? "bg-burgundy-500" : isSpeaking ? "bg-burgundy-500" : "bg-white"
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
              </div>

              <motion.button
                className={`mt-2 w-full py-3 text-sm font-black uppercase tracking-wider transition-transform ${
                  isLastQuestion ? "brutal-btn brutal-btn-primary" : "brutal-btn brutal-btn-dark"
                }`}
                whileTap={{ scale: 0.97 }}
                onClick={advanceToNext}
                disabled={isTransition}
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
