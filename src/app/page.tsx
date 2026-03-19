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
              className="absolute inset-0 flex flex-col bg-white overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* W decorations */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-deco font-bebas">W</div>
              ))}

              <div className="relative z-10 flex flex-col h-full px-7">
                {/* Header */}
                <motion.div
                  className="pt-[52px] flex items-center justify-between"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span
                    className="bg-navy-500 text-white text-[0.65rem] font-bold tracking-[0.15em] uppercase px-[14px] py-[7px]"
                  >
                    Video Interview
                  </span>
                  <span
                    className="border-2 border-navy-500 text-navy-500 text-[0.65rem] font-bold tracking-[0.1em] uppercase px-3 py-[5px]"
                  >
                    Wesser
                  </span>
                </motion.div>

                {/* Cards area */}
                <motion.div
                  className="relative h-[260px] mt-8 ml-auto w-[260px]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div
                    className="absolute w-[200px] h-[200px] border-[3px] border-black bg-burgundy-500"
                    style={{ top: 30, right: 0, transform: "rotate(12deg)" }}
                  />
                  <div
                    className="absolute w-[200px] h-[200px] border-[3px] border-black bg-navy-500 flex items-center justify-center"
                    style={{ top: 10, right: 30, transform: "rotate(5deg)" }}
                  >
                    <span className="text-white text-5xl font-black opacity-80">*</span>
                  </div>
                </motion.div>

                {/* Title block */}
                <motion.div
                  className="relative z-10 -mt-[60px]"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="font-bebas text-[5.5rem] leading-[0.9] text-black tracking-[0.02em]">
                    ENTRE
                  </div>
                  <div className="flex items-center gap-[14px] mt-1">
                    <span className="font-bebas text-[5.5rem] text-black leading-none">&amp;</span>
                    <span className="font-bebas text-[5.5rem] leading-none bg-burgundy-500 text-white px-3 tracking-[0.02em]">
                      NOUS
                    </span>
                  </div>
                  <div className="text-[0.7rem] font-semibold tracking-[0.2em] text-gray-400 uppercase mt-[10px]">
                    Between Us
                  </div>
                </motion.div>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="mt-[22px] text-[1.05rem] font-semibold text-gray-900 leading-[1.5] max-w-[300px]">
                    10 questions flash <span className="text-burgundy-500">face camera.</span>
                  </p>
                  <p className="mt-2 text-[0.88rem] text-gray-400 leading-[1.55] max-w-[280px]">
                    Reponds a voix haute, montre ta personnalite — pas de bonne ou mauvaise reponse, juste toi.
                  </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  className="flex gap-3 mt-9 flex-wrap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    onClick={handleStartExample}
                    className="flex-1 min-w-[140px] bg-navy-500 text-white text-[0.8rem] font-bold tracking-[0.12em] uppercase py-[18px] px-7 border-none flex items-center justify-center gap-2 hover:bg-navy-400 transition-colors"
                    whileTap={{ scale: 0.97 }}
                  >
                    C&apos;est parti !&ensp;&rarr;
                  </motion.button>

                  <motion.button
                    onClick={handleGoDirectly}
                    className="flex-1 min-w-[140px] bg-transparent text-black text-[0.8rem] font-bold tracking-[0.12em] uppercase py-[18px] px-7 border-[2.5px] border-black hover:bg-black hover:text-white transition-colors"
                    whileTap={{ scale: 0.97 }}
                  >
                    Go Direct
                  </motion.button>
                </motion.div>

                {/* Steps — bottom */}
                <motion.div
                  className="mt-auto pb-10 pt-8 flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 flex items-center justify-center text-base font-extrabold bg-navy-500 text-white border-[2.5px] border-navy-500">
                      1
                    </div>
                    <div className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-gray-400">Exemple</div>
                  </div>
                  <div className="flex-1 h-[1.5px] bg-gray-200 mx-1 mb-5" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 flex items-center justify-center text-base font-extrabold border-[2.5px] border-black text-black">
                      2
                    </div>
                    <div className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-gray-400">Camera</div>
                  </div>
                  <div className="flex-1 h-[1.5px] bg-gray-200 mx-1 mb-5" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 flex items-center justify-center text-base font-extrabold bg-burgundy-500 text-white border-[2.5px] border-burgundy-500">
                      3
                    </div>
                    <div className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-gray-400">Action</div>
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
