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
  const [isPlaying, setIsPlaying] = useState(false);
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

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
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

  const jumpToQuestion = useCallback(
    (idx: number) => {
      const video = videoRef.current;
      if (!video || questionTimestamps[idx] === undefined) return;
      video.currentTime = questionTimestamps[idx];
      video.play();
    },
    [questionTimestamps]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const currentQuestion = questions[currentQuestionIdx];
  const answeredQuestions = questions.filter((q) => answeredIds.includes(q.id));

  return (
    <div className="relative w-full h-full bg-black">
      {/* Full-screen video */}
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
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            onClick={togglePlay}
          />
        </motion.div>
      )}

      {/* Header overlay */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-4 pt-3 pb-6"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-sm font-bold gradient-text text-center">
          Bravo, c&apos;est dans la boîte ! 🎬
        </h1>
        <p className="text-[10px] text-white/40 text-center">
          {answeredIds.length}/{questions.length} questions
        </p>
      </motion.div>

      {/* Centered question overlay with blur - like during recording display phase */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        {/* Blur backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id ?? 0}
            className="relative z-10 mx-6 max-w-sm w-full pointer-events-auto"
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {currentQuestion && (
              <>
                <div className="mb-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${currentQuestion.gradient} shadow-lg`}>
                    {currentQuestion.category}
                  </span>
                </div>

                <div className={`rounded-2xl p-5 bg-gradient-to-br ${currentQuestion.gradient} shadow-2xl border border-white/20`}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{currentQuestion.emoji}</span>
                    <p className="text-lg font-black text-white leading-snug pt-0.5">
                      {currentQuestion.text}
                    </p>
                  </div>
                  <p className="text-[10px] text-white/40 mt-3 text-center font-medium">
                    Question {currentQuestionIdx + 1}/{answeredQuestions.length}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Question timeline dots */}
        <div className="relative z-10 flex justify-center gap-1.5 mt-4 pointer-events-auto">
          {answeredQuestions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => jumpToQuestion(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentQuestionIdx
                  ? "w-6 bg-burgundy-400"
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Play/pause hint */}
        {!isPlaying && (
          <motion.button
            className="relative z-10 mt-4 pointer-events-auto px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/60 font-medium"
            onClick={togglePlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            ▶ Lire la vidéo
          </motion.button>
        )}
      </div>

      {/* Compact action bar at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pt-6 pb-4 flex items-center gap-2"
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
