"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExampleVideo from "@/components/ExampleVideo";
import QuestionOverlay from "@/components/QuestionOverlay";
import Countdown from "@/components/Countdown";
import RecapMontage from "@/components/RecapMontage";
import { useCamera } from "@/hooks/useCamera";

type AppPhase = "landing" | "example" | "countdown" | "recording" | "recap";

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [questionTimestamps, setQuestionTimestamps] = useState<number[]>([]);
  const recordingStartRef = useRef<number>(0);
  const {
    videoRef, stream, recordedBlob,
    startCamera, startRecording, stopRecording, stopCamera, resetRecording,
  } = useCamera();

  useEffect(() => {
    if (
      (phase === "example" || phase === "countdown" || phase === "recording") &&
      videoRef.current && stream
    ) {
      videoRef.current.srcObject = stream;
    }
  }, [phase, stream, videoRef]);

  const handleStartExample = useCallback(async () => {
    try {
      await startCamera();
      setPhase("example");
    } catch {
      alert("Impossible d'accéder à la caméra. Vérifie tes autorisations.");
    }
  }, [startCamera]);

  const handleExampleDone = useCallback(() => setPhase("countdown"), []);

  const handleGoDirectly = useCallback(async () => {
    try {
      await startCamera();
      setPhase("countdown");
    } catch {
      alert("Impossible d'accéder à la caméra. Vérifie tes autorisations.");
    }
  }, [startCamera]);

  const handleCountdownDone = useCallback(() => {
    startRecording();
    recordingStartRef.current = Date.now();
    setQuestionTimestamps([0]);
    setPhase("recording");
  }, [startRecording]);

  const handleAnswered = useCallback((questionId: number) => {
    setAnsweredIds((prev) => [...prev, questionId]);
    setQuestionIndex((i) => i + 1);
    const elapsed = (Date.now() - recordingStartRef.current) / 1000;
    setQuestionTimestamps((prev) => [...prev, elapsed]);
  }, []);

  const handleAllDone = useCallback(() => {
    stopRecording();
    stopCamera();
    setPhase("recap");
  }, [stopRecording, stopCamera]);

  const handleRestart = useCallback(() => {
    setPhase("landing");
    setQuestionIndex(0);
    setAnsweredIds([]);
    setQuestionTimestamps([]);
    resetRecording();
  }, [resetRecording]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative w-full max-w-[430px] mx-auto video-container overflow-hidden bg-black" style={{ height: '100dvh' }}>
        {(phase === "countdown" || phase === "recording") && (
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        )}

        <AnimatePresence mode="wait">
          {/* ═══ LANDING ═══ */}
          {phase === "landing" && (
            <motion.div
              key="landing"
              className="absolute inset-0 flex flex-col gradient-mesh"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5 }}
            >
              {/* Floating orbs — background decoration */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent-purple/20 blur-3xl orb-float" />
                <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-accent-pink/15 blur-3xl orb-float-slow" />
                <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-accent-blue/20 blur-2xl orb-float" />
              </div>

              {/* Hero image area */}
              <motion.div
                className="relative w-full flex-shrink-0"
                style={{ height: '35%' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <img
                  src="/hero-illustration.png"
                  alt="Video interview"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '0 0 32px 32px' }}
                />
                {/* Glass overlay on image bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-20"
                  style={{
                    background: 'linear-gradient(to top, rgba(15,12,41,1) 0%, transparent 100%)',
                  }}
                />
              </motion.div>

              {/* Content */}
              <div className="relative z-10 px-6 -mt-4 flex-1 flex flex-col">
                {/* Pills */}
                <motion.div
                  className="flex items-center gap-2 mb-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="pill pill-accent">Video Interview</span>
                  <span className="pill">Wesser</span>
                </motion.div>

                {/* Title — LIQUID GLASS */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <h1 className="text-[38px] leading-[0.92] font-extrabold tracking-tight mb-1">
                    <span className="text-white">ENTRE TOI</span>
                    <br />
                    <span className="flex items-center gap-3 mt-1">
                      <span className="text-white/60">&amp;</span>
                      <span className="liquid-glass-text">NOUS</span>
                    </span>
                  </h1>
                </motion.div>

                <motion.p
                  className="text-[11px] font-medium tracking-[0.15em] text-white/30 uppercase mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Between You &amp; Us
                </motion.p>

                <motion.p
                  className="text-white/50 text-[14px] leading-relaxed mb-5 max-w-[280px]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  10 questions flash face caméra.
                  <br />
                  Réponds à voix haute, montre ta personnalité !
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <motion.button
                    onClick={handleStartExample}
                    className="btn-primary flex items-center gap-2"
                    whileTap={{ scale: 0.97 }}
                  >
                    <span>C&apos;est parti !</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                  <motion.button
                    onClick={handleGoDirectly}
                    className="btn-glass"
                    whileTap={{ scale: 0.97 }}
                  >
                    Go direct
                  </motion.button>
                </motion.div>

                {/* Steps — glass style */}
                <motion.div
                  className="mt-auto mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="glass-card px-5 py-4">
                    <div className="flex items-center justify-between">
                      {[
                        { n: "1", label: "Exemple", active: true },
                        { n: "2", label: "Caméra", active: false },
                        { n: "3", label: "Action", active: false },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center">
                          {i > 0 && (
                            <div className="w-8 h-px bg-white/10 mx-2" />
                          )}
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                step.active
                                  ? "bg-accent-purple text-white"
                                  : "bg-white/8 text-white/40 border border-white/10"
                              }`}
                            >
                              {step.n}
                            </div>
                            <span className="text-[11px] font-medium text-white/40">
                              {step.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* EXAMPLE */}
          {phase === "example" && (
            <motion.div
              key="example"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ExampleVideo onFinished={handleExampleDone} videoRef={videoRef} />
              <motion.button
                className="absolute top-5 right-4 z-30 btn-glass py-2 px-4 text-[11px]"
                onClick={handleExampleDone}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                whileTap={{ scale: 0.95 }}
              >
                Passer →
              </motion.button>
            </motion.div>
          )}

          {/* COUNTDOWN */}
          {phase === "countdown" && (
            <Countdown key="countdown" onDone={handleCountdownDone} />
          )}

          {/* RECORDING */}
          {phase === "recording" && (
            <QuestionOverlay
              key="recording"
              questionIndex={questionIndex}
              stream={stream}
              onAnswered={handleAnswered}
              onAllDone={handleAllDone}
            />
          )}

          {/* RECAP */}
          {phase === "recap" && (
            <motion.div
              key="recap"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <RecapMontage
                answeredIds={answeredIds}
                videoBlob={recordedBlob}
                questionTimestamps={questionTimestamps}
                onRestart={handleRestart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
