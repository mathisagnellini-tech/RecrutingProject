"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExampleVideo from "@/components/ExampleVideo";
import QuestionOverlay from "@/components/QuestionOverlay";
import Countdown from "@/components/Countdown";
import RecapMontage from "@/components/RecapMontage";
import { useCamera } from "@/hooks/useCamera";

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
              className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Decorative geometric shapes — brutalist style */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Big navy rectangle, tilted */}
                <div
                  className="absolute top-1/4 right-[-40px] w-[280px] h-[280px] bg-navy-500 border-[4px] border-black"
                  style={{ transform: "rotate(12deg)" }}
                />
                {/* Burgundy rectangle behind navy */}
                <div
                  className="absolute top-[22%] right-[-60px] w-[280px] h-[280px] bg-burgundy-500 border-[4px] border-black"
                  style={{ transform: "rotate(20deg)" }}
                />
                {/* Navy-light rectangle behind burgundy */}
                <div
                  className="absolute top-[26%] right-[-50px] w-[260px] h-[260px] bg-navy-400 border-[4px] border-black"
                  style={{ transform: "rotate(28deg)" }}
                />
                {/* Asterisk */}
                <div
                  className="absolute top-[38%] right-[60px] text-5xl font-black text-white"
                  style={{ transform: "rotate(12deg)" }}
                >
                  *
                </div>
              </div>

              <motion.div
                className="relative z-10 text-left w-full"
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Tag */}
                <div className="mb-6">
                  <span className="brutal-tag brutal-tag-yellow">
                    Video Interview
                  </span>
                </div>

                {/* Main title — huge, black, brutalist */}
                <h1 className="text-[52px] leading-[0.95] font-black text-black mb-4 tracking-tight">
                  FAST
                  <br />
                  &amp;{" "}
                  <span className="bg-burgundy-500 text-white px-2 inline-block">
                    CURIOUS
                  </span>
                </h1>

                <p className="text-black/60 text-sm leading-relaxed mb-8 max-w-[240px]">
                  10 questions flash face caméra.
                  Réponds à voix haute, montre ta personnalité !
                </p>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleStartExample}
                    className="brutal-btn brutal-btn-primary py-3 px-6 text-sm"
                    whileTap={{ scale: 0.97 }}
                  >
                    C&apos;est parti !&ensp;→
                  </motion.button>

                  <motion.button
                    onClick={handleGoDirectly}
                    className="brutal-btn brutal-btn-secondary py-3 px-5 text-xs"
                    whileTap={{ scale: 0.97 }}
                  >
                    Go direct
                  </motion.button>
                </div>
              </motion.div>

              {/* Steps preview — bottom */}
              <motion.div
                className="absolute bottom-6 left-0 right-0 px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex justify-between text-center text-[10px] font-bold uppercase text-black/40 tracking-wider">
                  <div>
                    <div className="w-8 h-8 border-2 border-black bg-navy-500 flex items-center justify-center mx-auto mb-1 text-white text-sm font-black">
                      1
                    </div>
                    Exemple
                  </div>
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-[2px] bg-black/20 w-full" />
                  </div>
                  <div>
                    <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center mx-auto mb-1 text-black text-sm font-black">
                      2
                    </div>
                    Caméra
                  </div>
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-[2px] bg-black/20 w-full" />
                  </div>
                  <div>
                    <div className="w-8 h-8 border-2 border-black bg-burgundy-500 flex items-center justify-center mx-auto mb-1 text-white text-sm font-black">
                      3
                    </div>
                    Action
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
                className="absolute top-5 right-4 z-30 brutal-btn brutal-btn-dark py-2 px-4 text-[10px]"
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
