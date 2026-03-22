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

/* ─── Geometric pattern components for transitions ─── */

function RadialBurst({ color1, color2 }: { color1: string; color2: string }) {
  const lines = Array.from({ length: 36 });
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      {lines.map((_, i) => (
        <motion.div
          key={i}
          className="absolute origin-center"
          style={{
            width: '2px',
            height: '200%',
            background: i % 2 === 0 ? color1 : color2,
            transform: `rotate(${i * 5}deg)`,
            opacity: 0.3,
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.02, duration: 0.3 }}
        />
      ))}
    </motion.div>
  );
}

function ConcentricRings({ color }: { color: string }) {
  const rings = Array.from({ length: 8 });
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {rings.map((_, i) => (
        <motion.div
          key={i}
          className="absolute border-2 rounded-none"
          style={{
            borderColor: color,
            opacity: 0.15 + i * 0.05,
          }}
          initial={{ width: 0, height: 0 }}
          animate={{
            width: (i + 1) * 90,
            height: (i + 1) * 90,
          }}
          transition={{
            delay: i * 0.06,
            duration: 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function StripedPattern({ color, vertical }: { color: string; vertical?: boolean }) {
  const stripes = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {stripes.map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            background: color,
            opacity: i % 2 === 0 ? 0.12 : 0,
            ...(vertical
              ? { top: 0, bottom: 0, width: '5%', left: `${i * 5}%` }
              : { left: 0, right: 0, height: '5%', top: `${i * 5}%` }),
          }}
          initial={vertical ? { scaleX: 0 } : { scaleY: 0 }}
          animate={vertical ? { scaleX: 1 } : { scaleY: 1 }}
          transition={{ delay: i * 0.03, duration: 0.2 }}
        />
      ))}
    </div>
  );
}

function DiagonalBlocks({ color1, color2 }: { color1: string; color2: string }) {
  const blocks = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {blocks.map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: '120%',
            height: '30px',
            background: i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : 'transparent',
            opacity: 0.2,
            top: `${i * 8}%`,
            left: '-10%',
            transform: 'rotate(-12deg)',
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function WaveLines({ color }: { color: string }) {
  const lines = Array.from({ length: 15 });
  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col justify-center">
      {lines.map((_, i) => (
        <motion.div
          key={i}
          style={{
            height: '2px',
            background: color,
            opacity: 0.15 + Math.sin(i * 0.5) * 0.1,
            marginBottom: '12px',
          }}
          initial={{ scaleX: 0, x: i % 2 === 0 ? -50 : 50 }}
          animate={{ scaleX: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.4 }}
        />
      ))}
    </div>
  );
}

function CheckerGrid({ color }: { color: string }) {
  const cells = Array.from({ length: 64 });
  return (
    <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
      {cells.map((_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const isActive = (row + col) % 2 === 0;
        return (
          <motion.div
            key={i}
            style={{
              background: isActive ? color : 'transparent',
              opacity: isActive ? 0.15 : 0,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: (row + col) * 0.03,
              duration: 0.2,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

// Cycle through patterns for each question transition
const PATTERNS = [
  'radial', 'stripes-v', 'rings', 'diagonal', 'waves', 'checker',
  'stripes-h', 'radial', 'rings', 'diagonal',
] as const;

function TransitionPattern({ patternIndex }: { patternIndex: number }) {
  const pattern = PATTERNS[patternIndex % PATTERNS.length];
  const navy = '#1a2744';
  const burgundy = '#8B1A2B';

  switch (pattern) {
    case 'radial':
      return <RadialBurst color1={burgundy} color2="white" />;
    case 'stripes-v':
      return <StripedPattern color="white" vertical />;
    case 'stripes-h':
      return <StripedPattern color={burgundy} />;
    case 'rings':
      return <ConcentricRings color="white" />;
    case 'diagonal':
      return <DiagonalBlocks color1={burgundy} color2={navy} />;
    case 'waves':
      return <WaveLines color="white" />;
    case 'checker':
      return <CheckerGrid color="white" />;
    default:
      return <RadialBurst color1={burgundy} color2="white" />;
  }
}

/* ─── Decorative shapes for question cards ─── */

function FloatingShapes() {
  return (
    <>
      {/* Top-right triangle */}
      <motion.div
        className="absolute -top-3 -right-3 w-12 h-12 bg-burgundy-500"
        style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", damping: 12 }}
      />
      {/* Bottom-left block */}
      <motion.div
        className="absolute -bottom-2 -left-2 w-8 h-8 bg-navy-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring", damping: 12 }}
      />
      {/* Side accent line */}
      <motion.div
        className="absolute top-2 -left-4 w-1.5 h-16 bg-burgundy-500"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        style={{ transformOrigin: 'top' }}
      />
    </>
  );
}

/* ─── Main Component ─── */

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
    if (transitioningRef.current || phaseRef.current === "transition") return;
    transitioningRef.current = true;
    setPhase("transition");

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

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
    }, 1800); // Slightly longer to enjoy the pattern
  }, []);

  // Countdown phase: strict 12s timer (skip for last question - unlimited)
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
      {/* ═══ TOP BAR — always visible except during transition ═══ */}
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
          {/* Progress bars */}
          <div className="flex gap-1 mt-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 transition-all duration-500 ${
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

      {/* ═══ CAMERA FRAME CORNERS ═══ */}
      {isCountdown && (
        <div className="absolute inset-6 pointer-events-none">
          <div className="absolute top-0 left-0 w-10 h-10 border-white" style={{ borderTopWidth: '3px', borderLeftWidth: '3px' }} />
          <div className="absolute top-0 right-0 w-10 h-10 border-white" style={{ borderTopWidth: '3px', borderRightWidth: '3px' }} />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-white" style={{ borderBottomWidth: '3px', borderLeftWidth: '3px' }} />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-white" style={{ borderBottomWidth: '3px', borderRightWidth: '3px' }} />
          {/* Diagonal accent */}
          <motion.div
            className="absolute top-0 right-0 w-16 h-1 bg-burgundy-500 origin-right"
            style={{ transform: 'rotate(-45deg) translateY(-8px) translateX(4px)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
        </div>
      )}

      {/* ═══ DISPLAY PHASE: centered question with brutalist design ═══ */}
      <AnimatePresence>
        {isDisplayPhase && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dark backdrop with geometric noise */}
            <div className="absolute inset-0 bg-black/75" />
            {/* Decorative diagonal stripe */}
            <motion.div
              className="absolute top-0 right-0 w-32 bg-burgundy-500/20"
              style={{ height: '150%', transform: 'rotate(15deg) translateX(50%)' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-20 bg-navy-500/20"
              style={{ height: '150%', transform: 'rotate(15deg) translateX(-50%)' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />

            {/* Question card - brutalist with shapes */}
            <motion.div
              className="relative z-10 mx-6 max-w-sm w-full"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 250 }}
            >
              {/* Category + question number */}
              <motion.div
                className="flex items-center justify-between mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="brutal-tag brutal-tag-red text-xs">
                  {question.category}
                </span>
                <span className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase">
                  Q.{questionIndex + 1}
                </span>
              </motion.div>

              {/* Main card with decorative shapes */}
              <div className="relative">
                <FloatingShapes />
                <div className="bg-black p-6" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white' }}>
                  {/* Thick accent bar at top */}
                  <div className="absolute top-0 left-6 right-6 h-1 bg-burgundy-500" style={{ transform: 'translateY(-2px)' }} />

                  <div className="flex items-start gap-4">
                    <motion.span
                      className="text-4xl shrink-0"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    >
                      {question.emoji}
                    </motion.span>
                    <p className="text-xl font-black text-white leading-snug pt-1 uppercase">
                      {question.text}
                    </p>
                  </div>

                  {/* Reading progress bar with brutalist styling */}
                  <div className="mt-5 relative">
                    <div className="h-2 bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-burgundy-500"
                        style={{ width: `${(displayTimer / QUESTION_DISPLAY_DELAY) * 100}%` }}
                      />
                    </div>
                    {/* Tick marks */}
                    <div className="flex justify-between mt-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-px h-1.5 bg-white/20" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1 text-center font-black uppercase tracking-[0.2em]">
                    Prépare ta réponse
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TRANSITION — Geometric pattern + text ═══ */}
      <AnimatePresence>
        {isTransition && (
          <motion.div
            className="absolute inset-0 z-40 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-navy-500" />

            {/* Geometric pattern */}
            <TransitionPattern patternIndex={questionIndex} />

            {/* Thick border frame */}
            <div className="absolute inset-3" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.15)' }} />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isLastQuestion ? (
                <motion.div
                  className="text-center relative z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <motion.div
                    className="inline-block bg-burgundy-500 px-6 py-3 mb-4"
                    style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white' }}
                    initial={{ rotate: -3 }}
                    animate={{ rotate: 0 }}
                  >
                    <p className="text-3xl font-black text-white uppercase tracking-tight">
                      Récap !
                    </p>
                  </motion.div>
                  <motion.p
                    className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Voici tes réponses
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  className="text-center relative z-10 px-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  {/* Transition message */}
                  <motion.p
                    className="text-lg font-black text-white/60 uppercase tracking-wider mb-4"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {transitionMessage}
                  </motion.p>

                  {/* ENTRE TOI & NOUS */}
                  <h2 className="text-[48px] leading-[0.9] font-black text-white tracking-tight">
                    ENTRE TOI
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[48px] font-black text-white leading-none">&amp;</span>
                    <motion.span
                      className="text-[48px] font-black leading-none bg-burgundy-500 text-white px-4"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      NOUS
                    </motion.span>
                  </div>

                  {/* Question counter */}
                  <motion.div
                    className="mt-5 flex items-center justify-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="h-px w-8 bg-white/30" />
                    <span className="text-xs font-black tracking-[0.2em] text-white/50 uppercase">
                      Question {questionIndex + 1}/{questions.length}
                    </span>
                    <div className="h-px w-8 bg-white/30" />
                  </motion.div>

                  {/* Decorative bottom shapes */}
                  <motion.div
                    className="flex justify-center gap-2 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="w-2 h-2 bg-burgundy-500" />
                    <div className="w-2 h-2 bg-white" />
                    <div className="w-2 h-2 bg-burgundy-500" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ COUNTDOWN PHASE: question card — RAISED for mobile ═══ */}
      {isCountdown && (
        <div className="absolute inset-x-3 pointer-events-auto" style={{ bottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`countdown-${question.id}`}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              {/* Question card with brutalist shapes */}
              <div className="relative">
                {/* Side accent */}
                <motion.div
                  className="absolute -left-1.5 top-2 bottom-2 w-1.5 bg-burgundy-500"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  style={{ transformOrigin: 'top' }}
                />
                {/* Corner triangle */}
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-burgundy-500/80"
                  style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                />

                <div className="bg-black/85 p-4" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white' }}>
                  {/* Category tag inside card */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black tracking-[0.15em] text-burgundy-400 uppercase">
                      {question.category}
                    </span>
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

                  {/* Timer bar (hidden for last question) */}
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
              </div>

              {/* Button — brutalist with accent */}
              <motion.button
                className={`mt-2 w-full py-3 text-sm font-black uppercase tracking-wider transition-transform ${
                  isLastQuestion
                    ? "brutal-btn brutal-btn-primary"
                    : "brutal-btn brutal-btn-dark"
                }`}
                whileTap={{ scale: 0.97 }}
                onClick={advanceToNext}
                disabled={isTransition}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isLastQuestion ? "Terminer ■" : "Question suivante →"}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
