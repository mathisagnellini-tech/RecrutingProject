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
    <main className="flex items-center justify-center min-h-screen bg-white">
      <div className="relative w-full max-w-[430px] mx-auto video-container overflow-hidden bg-white" style={{ height: '100dvh' }}>
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
              className="absolute inset-0 flex flex-col bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Hero illustration — top ~32% */}
              <motion.div
                className="relative w-full"
                style={{ height: '32%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <img
                  src="/hero-illustration.png"
                  alt="Video interview illustration"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '0 0 24px 24px' }}
                />
                {/* Badges overlapping the image bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-5 flex items-center justify-between z-10">
                  <span className="brutal-tag brutal-tag-yellow">
                    Video Interview
                  </span>
                  <span className="border-2 border-navy-500 text-navy-500 text-[0.6rem] font-bold tracking-[0.1em] uppercase px-2.5 py-1 bg-white">
                    Wesser
                  </span>
                </div>
              </motion.div>

              {/* Content below image */}
              <div className="relative z-10 flex flex-col flex-1 px-5 pt-5 pb-2">
                <motion.div
                  className="text-left w-full"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Main title */}
                  <h1 className="text-[32px] leading-[0.95] font-black text-black mb-1 tracking-tight">
                    ENTRE TOI
                    <br />
                    &amp;{" "}
                    <span className="bg-burgundy-500 text-white px-2 inline-block">
                      NOUS
                    </span>
                  </h1>

                  <div className="text-[0.5rem] font-semibold tracking-[0.2em] text-black/40 uppercase mb-1">
                    Between You &amp; Us
                  </div>

                  <p className="text-black/80 text-[13px] leading-snug mb-2 max-w-[260px]">
                    10 questions flash face caméra.
                    Réponds à voix haute, montre ta personnalité !
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleStartExample}
                      className="brutal-btn brutal-btn-primary py-2 px-5 text-xs"
                      whileTap={{ scale: 0.97 }}
                    >
                      C&apos;est parti !&ensp;→
                    </motion.button>

                    <motion.button
                      onClick={handleGoDirectly}
                      className="brutal-btn brutal-btn-secondary py-2 px-4 text-xs"
                      whileTap={{ scale: 0.97 }}
                    >
                      Go direct
                    </motion.button>
                  </div>
                </motion.div>

                {/* Steps preview — bottom */}
                <motion.div
                  className="mt-auto pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex justify-between text-center text-[9px] font-bold uppercase text-black/40 tracking-wider">
                    <div>
                      <div className="w-6 h-6 border-2 border-black bg-navy-500 flex items-center justify-center mx-auto mb-1 text-white text-[10px] font-black">
                        1
                      </div>
                      Exemple
                    </div>
                    <div className="flex-1 flex items-center px-2">
                      <div className="h-[1.5px] bg-black/20 w-full" />
                    </div>
                    <div>
                      <div className="w-6 h-6 border-2 border-black bg-white flex items-center justify-center mx-auto mb-1 text-black text-[10px] font-black">
                        2
                      </div>
                      Caméra
                    </div>
                    <div className="flex-1 flex items-center px-2">
                      <div className="h-[1.5px] bg-black/20 w-full" />
                    </div>
                    <div>
                      <div className="w-6 h-6 border-2 border-black bg-burgundy-500 flex items-center justify-center mx-auto mb-1 text-white text-[10px] font-black">
                        3
                      </div>
                      Action
                    </div>
                  </div>
                </motion.div>
              </div>
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
