"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExampleVideo from "@/components/ExampleVideo";
import QuestionOverlay from "@/components/QuestionOverlay";
import Countdown from "@/components/Countdown";
import RecapMontage from "@/components/RecapMontage";
import { useCamera } from "@/hooks/useCamera";

type AppPhase =
  | "landing"      // Welcome screen
  | "example"      // Watching the example video
  | "permission"   // Camera permission request
  | "countdown"    // 3-2-1 countdown
  | "recording"    // Recording with questions
  | "recap";       // Final montage + download

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B">>({});
  const {
    videoRef,
    isStreaming,
    recordedBlob,
    startCamera,
    startRecording,
    stopRecording,
    stopCamera,
    resetRecording,
  } = useCamera();

  const handleExampleDone = useCallback(() => {
    setPhase("permission");
  }, []);

  const handleCameraStart = useCallback(async () => {
    try {
      await startCamera();
      setPhase("countdown");
    } catch {
      alert("Impossible d'accéder à la caméra. Vérifie tes autorisations.");
    }
  }, [startCamera]);

  const handleCountdownDone = useCallback(() => {
    startRecording();
    setPhase("recording");
  }, [startRecording]);

  const handleAnswered = useCallback((questionId: number, answer: "A" | "B") => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setQuestionIndex((i) => i + 1);
  }, []);

  const handleAllDone = useCallback(() => {
    stopRecording();
    stopCamera();
    setPhase("recap");
  }, [stopRecording, stopCamera]);

  const handleRestart = useCallback(() => {
    setPhase("landing");
    setQuestionIndex(0);
    setAnswers({});
    resetRecording();
  }, [resetRecording]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative w-full max-w-[430px] mx-auto h-screen video-container overflow-hidden bg-black">
        {/* Camera feed (visible during countdown + recording) */}
        {(phase === "countdown" || phase === "recording") && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover mirror"
            style={{ transform: "scaleX(-1)" }}
          />
        )}

        <AnimatePresence mode="wait">
          {/* LANDING */}
          {phase === "landing" && (
            <motion.div
              key="landing"
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/50 to-black p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Decorative circles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-purple-500/15 blur-2xl" />
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
                  Réponds à <strong className="text-white">10 questions flash</strong> face caméra.
                  Montre ta personnalité en mode <strong className="text-white">Konbini</strong> !
                </p>

                <div className="space-y-3">
                  <motion.button
                    onClick={() => setPhase("example")}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-bold text-lg shadow-lg shadow-purple-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Voir l&apos;exemple d&apos;abord 👀
                  </motion.button>

                  <motion.button
                    onClick={() => setPhase("permission")}
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
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                      1
                    </div>
                    Exemple
                  </div>
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-px bg-white/10 w-full" />
                  </div>
                  <div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                      2
                    </div>
                    Caméra
                  </div>
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-px bg-white/10 w-full" />
                  </div>
                  <div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                      3
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
              <ExampleVideo onFinished={handleExampleDone} />

              {/* Skip button */}
              <motion.button
                className="absolute top-6 right-4 z-30 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-white/70"
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

          {/* CAMERA PERMISSION */}
          {phase === "permission" && (
            <motion.div
              key="permission"
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <motion.div
                className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-8 record-pulse"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg
                  className="w-14 h-14 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </motion.div>

              <h2 className="text-2xl font-bold mb-3 text-center">Active ta caméra</h2>
              <p className="text-white/50 text-sm text-center mb-8 max-w-xs">
                On va te filmer pendant que tu réponds aux questions. C&apos;est rapide, promis !
              </p>

              <motion.button
                onClick={handleCameraStart}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 font-bold text-lg text-black shadow-lg shadow-green-500/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Autoriser la caméra 📸
              </motion.button>

              <p className="text-white/30 text-xs mt-4 text-center">
                Ta vidéo reste privée et n&apos;est envoyée qu&apos;avec ton accord.
              </p>
            </motion.div>
          )}

          {/* COUNTDOWN */}
          {phase === "countdown" && (
            <Countdown key="countdown" onDone={handleCountdownDone} />
          )}

          {/* RECORDING - Question overlays */}
          {phase === "recording" && (
            <QuestionOverlay
              key="recording"
              questionIndex={questionIndex}
              onAnswered={handleAnswered}
              onAllDone={handleAllDone}
            />
          )}

          {/* RECAP MONTAGE */}
          {phase === "recap" && (
            <motion.div
              key="recap"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <RecapMontage
                answers={answers}
                videoBlob={recordedBlob}
                onRestart={handleRestart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
