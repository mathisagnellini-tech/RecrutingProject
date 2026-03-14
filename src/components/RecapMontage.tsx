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

export default function RecapMontage({
  answeredIds,
  videoBlob,
  questionTimestamps,
  onRestart,
}: RecapMontageProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  // Sync current question with video playback time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || questionTimestamps.length === 0) return;

    const onTimeUpdate = () => {
      const currentTime = video.currentTime;
      let idx = 0;
      for (let i = questionTimestamps.length - 1; i >= 0; i--) {
        if (currentTime >= questionTimestamps[i]) {
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
        // User cancelled - fallback to download
      }
    } else {
      handleDownload();
    }
  }, [videoBlob, handleDownload]);

  const jumpToQuestion = useCallback(
    (idx: number) => {
      const video = videoRef.current;
      if (!video || questionTimestamps[idx] === undefined) return;
      video.currentTime = questionTimestamps[idx];
      video.play();
    },
    [questionTimestamps]
  );

  const currentQuestion = questions[currentQuestionIdx];
  const answeredQuestions = questions.filter((q) => answeredIds.includes(q.id));

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Video container with overlaid question */}
      <div className="flex-1 relative min-h-0">
        {videoUrl && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </motion.div>
        )}

        {/* Header overlay on video */}
        <motion.div
          className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-8"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="text-base font-bold gradient-text text-center">
            Bravo, c&apos;est dans la boîte ! 🎬
          </h1>
          <p className="text-[10px] text-white/40 text-center mt-0.5">
            {answeredIds.length}/{questions.length} questions
          </p>
        </motion.div>

        {/* Question overlay on video - bottom */}
        <div className="absolute bottom-14 left-3 right-3 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id ?? 0}
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -15, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {currentQuestion && (
                <div
                  className={`rounded-xl p-3 bg-gradient-to-r ${currentQuestion.gradient} shadow-lg border border-white/10 backdrop-blur-sm bg-opacity-90`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                      {currentQuestion.category}
                    </span>
                    <span className="text-[9px] text-white/40">
                      &#8226; {currentQuestionIdx + 1}/{answeredQuestions.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{currentQuestion.emoji}</span>
                    <p className="text-sm font-bold text-white leading-snug">
                      {currentQuestion.text}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Question timeline dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {answeredQuestions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => jumpToQuestion(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentQuestionIdx
                    ? "w-5 bg-burgundy-400"
                    : "w-1 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Compact action bar */}
      <motion.div
        className="shrink-0 px-4 py-3 flex items-center gap-2 bg-black"
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
