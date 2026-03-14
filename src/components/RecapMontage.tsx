"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "@/data/questions";

interface RecapMontageProps {
  answeredIds: number[];
  videoBlob: Blob | null;
  questionTimestamps: number[];
  onRestart: () => void;
}

const DISPLAY_DELAY = 4; // must match QUESTION_DISPLAY_DELAY in QuestionOverlay

export default function RecapMontage({
  answeredIds,
  videoBlob,
  questionTimestamps,
  onRestart,
}: RecapMontageProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(-1);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  // Sync question overlay with video time
  // Only show question AFTER the 4s display phase (when candidate was reading)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || questionTimestamps.length === 0) return;

    const onTimeUpdate = () => {
      const t = video.currentTime;
      let idx = -1;

      for (let i = questionTimestamps.length - 1; i >= 0; i--) {
        const questionStart = questionTimestamps[i];
        const answerStart = questionStart + DISPLAY_DELAY;
        const nextQuestionStart = i < questionTimestamps.length - 1
          ? questionTimestamps[i + 1]
          : Infinity;

        // Show question only during the answer phase (after reading)
        if (t >= answerStart && t < nextQuestionStart) {
          idx = i;
          break;
        }
      }

      setCurrentQuestionIdx(idx);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [questionTimestamps]);

  const handleDownload = useCallback(() => {
    if (!videoBlob) return;
    setDownloading(true);
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fast-and-curious-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 1000);
  }, [videoBlob]);

  const handleShare = useCallback(async () => {
    if (!videoBlob) return;
    const file = new File([videoBlob], "fast-and-curious.webm", { type: videoBlob.type });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Ma vidéo Fast & Curious",
          text: "Regarde ma vidéo de recrutement Fast & Curious !",
          files: [file],
        });
      } catch {
        // User cancelled
      }
    } else {
      handleDownload();
    }
  }, [videoBlob, handleDownload]);

  const answeredQuestions = questions.filter((q) => answeredIds.includes(q.id));
  const currentQuestion = currentQuestionIdx >= 0 ? answeredQuestions[currentQuestionIdx] : null;

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Header */}
      <motion.div
        className="shrink-0 bg-black px-4 pt-4 pb-2 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-lg font-bold gradient-text">
          Bravo, c&apos;est dans la boîte ! 🎬
        </h1>
        <p className="text-[11px] text-white/40 mt-0.5">
          {answeredIds.length} questions
        </p>
      </motion.div>

      {/* Video with question overlay */}
      <div className="flex-1 min-h-0 px-3 pb-2 relative">
        {videoUrl && (
          <motion.div
            className="w-full h-full rounded-2xl overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              autoPlay
              className="w-full h-full object-cover bg-black"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Question overlay on video - only during answer phases */}
            <div className="absolute bottom-12 left-3 right-3 z-10 pointer-events-none">
              <AnimatePresence mode="wait">
                {currentQuestion && (
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  >
                    <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-lg shrink-0">{currentQuestion.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">
                            {currentQuestion.category}
                          </p>
                          <p className="text-sm font-bold text-white leading-snug">
                            {currentQuestion.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      {/* Compact action bar */}
      <motion.div
        className="shrink-0 px-4 pb-4 pt-2 flex items-center gap-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={handleShare}
          disabled={!videoBlob}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-burgundy-500 to-navy-500 font-bold text-xs active:scale-95 transition-transform disabled:opacity-50"
        >
          Partager
        </button>
        <button
          onClick={handleDownload}
          disabled={!videoBlob || downloading}
          className="py-2.5 px-3 rounded-xl bg-white/10 text-xs active:scale-95 transition-transform disabled:opacity-50"
        >
          {downloading ? "..." : "📥"}
        </button>
        <button
          onClick={onRestart}
          className="py-2.5 px-3 rounded-xl bg-white/5 text-xs text-white/40 active:scale-95 transition-transform"
        >
          Refaire
        </button>
      </motion.div>
    </div>
  );
}
