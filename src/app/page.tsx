"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExampleVideo from "@/components/ExampleVideo";
import QuestionOverlay from "@/components/QuestionOverlay";
import Countdown from "@/components/Countdown";
import RecapMontage from "@/components/RecapMontage";
import { useCamera } from "@/hooks/useCamera";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

type AppPhase =
  | "landing"
  | "example"
  | "countdown"
  | "recording"
  | "recap";

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [questionTimestamps, setQuestionTimestamps] = useState<number[]>([]);
  const recordingStartRef = useRef<number>(0);
  const {
    videoRef,
    stream,
    recordedBlob,
    startCamera,
    startRecording,
    stopRecording,
    stopCamera,
    resetRecording,
  } = useCamera();
  const { startMusic, stopMusic } = useBackgroundMusic();

  // Attach the camera stream to the video element whenever it mounts
  useEffect(() => {
    if (
      (phase === "example" || phase === "countdown" || phase === "recording") &&
      videoRef.current &&
      stream
    ) {
      videoRef.current.srcObject = stream;
    }
  }, [phase, stream, videoRef]);

  // Start music when example begins, stop when recap
  useEffect(() => {
    if (phase === "example") {
      startMusic();
    } else if (phase === "recap" || phase === "landing") {
      stopMusic();
    }
  }, [phase, startMusic, stopMusic]);

  const handleStartExample = useCallback(async () => {
    try {
      await startCamera();
      setPhase("example");
    } catch {
      alert("Impossible d'accéder à la caméra. Vérifie tes autorisations.");
    }
  }, [startCamera]);

  const handleExampleDone = useCallback(() => {
    setPhase("countdown");
  }, []);

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
    setQuestionTimestamps([0]); // First question starts at t=0
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
      <div className="relative w-full max-w-[430px] mx-auto h-screen video-container overflow-hidden bg-black">
        {/* Camera feed for countdown & recording */}
        {(phase === "countdown" || phase === "recording") && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        )}

        <AnimatePresence mode="wait">
          {/* LANDING */}
          {phase === "landing" && (
            <motion.div
              key="landing"
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-navy-700 via-burgundy-800/40 to-navy-900 p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Decorative circles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-burgundy-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-navy-400/20 blur-3xl" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-burgundy-400/15 blur-2xl" />
              </div>

              <motion.div
                className="relative z-10 text-center"
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎬
                </motion.div>

                <h1 className="text-4xl font-black mb-2">
                  <span className="gradient-text">Fast & Curious</span>
                </h1>
                <p className="text-sm text-white/50 font-medium tracking-wider uppercase mb-8">
                  Édition Recrutement
                </p>

                <p className="text-white/70 text-base leading-relaxed mb-10 max-w-xs">
                  <strong className="text-white">10 questions flash</strong> face caméra.
                  <br />
                  Réponds à voix haute, montre ta personnalité !
                </p>

                <div className="space-y-3">
                  <motion.button
                    onClick={handleStartExample}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-burgundy-500 via-burgundy-400 to-navy-500 font-bold text-lg shadow-lg shadow-burgundy-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    C&apos;est parti !
                  </motion.button>

                  <motion.button
                    onClick={handleGoDirectly}
                    className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 font-medium text-sm text-white/60"
                    whileTap={{ scale: 0.97 }}
                  >
                    Je connais, go direct →
                  </motion.button>
                </div>
              </motion.div>

              {/* Steps preview */}
              <motion.div
                className="absolute bottom-8 left-0 right-0 px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex justify-between text-center text-xs text-white/30">
                  <div>
                    <div className="w-8 h-8 rounded-full bg-burgundy-500/30 flex items-center justify-center mx-auto mb-1">
                      📺
                    </div>
                    Exemple
                  </div>
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-px bg-white/10 w-full" />
                  </div>
                  <div>
                    <div className="w-8 h-8 rounded-full bg-navy-400/30 flex items-center justify-center mx-auto mb-1">
                      🎥
                    </div>
                    Caméra
                  </div>
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-px bg-white/10 w-full" />
                  </div>
                  <div>
                    <div className="w-8 h-8 rounded-full bg-burgundy-500/30 flex items-center justify-center mx-auto mb-1">
                      🎤
                    </div>
                    Action !
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* EXAMPLE VIDEO */}
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
                className="absolute top-5 right-4 z-30 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-white/70 active:bg-white/20 transition-colors"
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
