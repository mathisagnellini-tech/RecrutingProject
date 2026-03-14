"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, type Question } from "@/data/questions";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";

interface QuestionOverlayProps {
  questionIndex: number;
  stream: MediaStream | null;
  onAnswered: (questionId: number) => void;
  onAllDone: () => void;
}

const SILENCE_THRESHOLD_MS = 1500;

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
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);

  const question: Question | undefined = questions[questionIndex];
  const isLastQuestion = questionIndex >= questions.length - 1;
  const nextQuestion: Question | undefined = questions[questionIndex + 1];
  const { isSpeaking, hasSpoken, silenceDurationMs } = useVoiceActivity(stream, questionIndex);

  // Update silence countdown display
  useEffect(() => {
    if (hasSpoken && !isSpeaking && !isAdvancing && silenceDurationMs > 0) {
      const remaining = Math.ceil((SILENCE_THRESHOLD_MS - silenceDurationMs) / 1000);
      if (remaining > 0 && remaining <= 3) {
        setSilenceCountdown(remaining);
      } else {
        setSilenceCountdown(null);
      }
    } else {
      setSilenceCountdown(null);
    }
  }, [hasSpoken, isSpeaking, silenceDurationMs, isAdvancing]);

  const advanceToNext = useCallback(() => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setAnsweredQuestions((prev) => [...prev, questionIndex]);
    onAnswered(question.id);

    setShowTransition(true);
    setTimeout(() => {
      setShowTransition(false);
      setTimer(0);
      setIsAdvancing(false);
      if (isLastQuestion) {
        onAllDone();
      }
    }, 1500);
  }, [isAdvancing, questionIndex, question, isLastQuestion, onAnswered, onAllDone]);

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
        return isSpeaking ? t : next;
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

      {/* Silence countdown circle - centered on screen */}
      <AnimatePresence>
        {silenceCountdown !== null && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-20 h-20">
              {/* Background circle */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="url(#countdownGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 35}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 35 }}
                  transition={{ duration: SILENCE_THRESHOLD_MS / 1000, ease: "linear" }}
                />
                <defs>
                  <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c2185b" />
                    <stop offset="100%" stopColor="#e91e63" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Number */}
              <motion.div
                key={silenceCountdown}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <span className="text-2xl font-black text-white">
                  {silenceCountdown}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition: show next question big OR recap message */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-40 pointer-events-none px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isLastQuestion ? (
              /* Last question → "Voici le récap" */
              <motion.div
                className="text-center"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
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
                <motion.p
                  className="text-white/50 text-sm mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Bien joué, c&apos;est terminé !
                </motion.p>
              </motion.div>
            ) : (
              /* Normal transition → show next question big */
              <motion.div
                className="text-center"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <motion.div
                  className="mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${nextQuestion?.gradient} shadow-lg`}>
                    {nextQuestion?.category}
                  </span>
                </motion.div>
                <motion.p
                  className="text-3xl font-black text-white leading-tight"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", damping: 12 }}
                >
                  <span className="text-4xl mr-2">{nextQuestion?.emoji}</span>
                  {nextQuestion?.text}
                </motion.p>
                <motion.p
                  className="text-white/40 text-xs mt-4 uppercase tracking-widest font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Prépare-toi...
                </motion.p>
              </motion.div>
            )}
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
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full border-2 border-burgundy-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{
                        borderTopColor: "transparent",
                      }}
                    />
                    <span className="text-[10px] text-burgundy-300 font-semibold uppercase tracking-wider">
                      Question suivante...
                    </span>
                  </motion.div>
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
