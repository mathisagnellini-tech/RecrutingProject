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

const DISPLAY_DELAY = 3; // must match QUESTION_DISPLAY_DELAY in QuestionOverlay
const QUESTION_CARD_DURATION = 2000; // ms to show question card before video

export default function RecapMontage({
  answeredIds,
  videoBlob,
  questionTimestamps,
  onRestart,
}: RecapMontageProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [showingCard, setShowingCard] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answeredQuestions = questions.filter((q) => answeredIds.includes(q.id));

  // Build segments: for each question, answer starts after DISPLAY_DELAY
  const segments = questionTimestamps.map((ts, i) => ({
    answerStart: ts + DISPLAY_DELAY,
    answerEnd: i < questionTimestamps.length - 1 ? questionTimestamps[i + 1] : Infinity,
    question: answeredQuestions[i],
  }));

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  // Start playback: show card for segment 0, then play video
  const playSegment = useCallback((segIdx: number) => {
    const video = videoRef.current;
    if (!video || segIdx >= segments.length) return;

    // Show the question card first
    setCurrentSegment(segIdx);
    setShowingCard(true);
    video.pause();

    cardTimerRef.current = setTimeout(() => {
      setShowingCard(false);
      // Seek to answer start (skip reading phase)
      video.currentTime = segments[segIdx].answerStart;
      video.play();
    }, QUESTION_CARD_DURATION);
  }, [segments]);

  // On video loaded, start first segment
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const onLoaded = () => {
      playSegment(0);
    };

    if (video.readyState >= 1) {
      onLoaded();
    } else {
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      return () => video.removeEventListener("loadedmetadata", onLoaded);
    }
  }, [videoUrl, playSegment]);

  // Watch video time — when answer segment ends, advance to next
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (showingCard) return;
      const seg = segments[currentSegment];
      if (!seg) return;

      // If we've reached the end of this answer segment
      if (seg.answerEnd !== Infinity && video.currentTime >= seg.answerEnd) {
        const nextIdx = currentSegment + 1;
        if (nextIdx < segments.length) {
          playSegment(nextIdx);
        }
        // Last segment: let video play to natural end
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [currentSegment, showingCard, segments, playSegment]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cardTimerRef.current) clearTimeout(cardTimerRef.current);
    };
  }, []);

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

  const currentQuestion = segments[currentSegment]?.question;

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

      {/* Video area */}
      <div className="flex-1 min-h-0 px-3 pb-2 relative">
        <motion.div
          className="w-full h-full rounded-2xl overflow-hidden relative bg-black"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Video element (hidden during question card) */}
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              muted={false}
              className={`absolute inset-0 w-full h-full object-cover bg-black transition-opacity duration-300 ${
                showingCard ? "opacity-0" : "opacity-100"
              }`}
              style={{ transform: "scaleX(-1)" }}
            />
          )}

          {/* Question card overlay (full screen, like candidate sees it) */}
          <AnimatePresence mode="wait">
            {showingCard && currentQuestion && (
              <motion.div
                key={`card-${currentQuestion.id}`}
                className="absolute inset-0 flex flex-col items-center justify-center z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${currentQuestion.gradient} opacity-90`} />

                {/* Question number */}
                <motion.div
                  className="relative z-10 mb-4"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                    {currentSegment + 1}/{answeredQuestions.length} — {currentQuestion.category}
                  </span>
                </motion.div>

                {/* Question content */}
                <motion.div
                  className="relative z-10 mx-6 max-w-sm w-full"
                  initial={{ y: 30, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 250, delay: 0.15 }}
                >
                  <div className="rounded-2xl p-6 bg-black/30 backdrop-blur-sm border border-white/20">
                    <div className="flex items-start gap-4">
                      <motion.span
                        className="text-4xl shrink-0"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        {currentQuestion.emoji}
                      </motion.span>
                      <p className="text-xl font-black text-white leading-snug pt-1">
                        {currentQuestion.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots during video playback */}
          {!showingCard && (
            <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
              {answeredQuestions.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                    i < currentSegment
                      ? "bg-burgundy-400"
                      : i === currentSegment
                      ? "bg-white/80"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Small question reminder at bottom during video */}
          {!showingCard && currentQuestion && (
            <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">{currentQuestion.emoji}</span>
                  <p className="text-xs font-semibold text-white/80 leading-snug truncate">
                    {currentQuestion.text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
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
