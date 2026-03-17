"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "@/data/questions";

interface RecapMontageProps {
  answeredIds: number[];
  videoBlob: Blob | null;
  questionTimestamps: number[];
  onRestart: () => void;
}

const DISPLAY_DELAY = 3;
const CARD_DURATION = 1400;

type RecapPhase = "intro" | "playing" | "ended";

export default function RecapMontage({
  answeredIds,
  videoBlob,
  questionTimestamps,
  onRestart,
}: RecapMontageProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [showingCard, setShowingCard] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [recapPhase, setRecapPhase] = useState<RecapPhase>("intro");
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentRef = useRef(0);
  const playingRef = useRef(false); // guards against double-advance
  const showingCardRef = useRef(false);

  const answeredQuestions = useMemo(
    () => questions.filter((q) => answeredIds.includes(q.id)),
    [answeredIds]
  );

  const segments = useMemo(
    () =>
      questionTimestamps.map((ts, i) => ({
        answerStart: ts + DISPLAY_DELAY,
        answerEnd:
          i < questionTimestamps.length - 1
            ? questionTimestamps[i + 1]
            : Infinity,
        question: answeredQuestions[i],
      })),
    [questionTimestamps, answeredQuestions]
  );

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  const triggerFlash = useCallback(() => {
    setFlashVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlashVisible(false);
      });
    });
  }, []);

  const playSegment = useCallback(
    (segIdx: number) => {
      const video = videoRef.current;
      if (!video || segIdx >= segments.length) {
        playingRef.current = false;
        setRecapPhase("ended");
        return;
      }

      // Clear any pending card timer
      if (cardTimerRef.current) {
        clearTimeout(cardTimerRef.current);
        cardTimerRef.current = null;
      }

      segmentRef.current = segIdx;
      playingRef.current = true;
      showingCardRef.current = true;
      setCurrentSegment(segIdx);
      setRecapPhase("playing");
      setShowingCard(true);

      triggerFlash();
      video.pause();

      cardTimerRef.current = setTimeout(() => {
        showingCardRef.current = false;
        setShowingCard(false);
        triggerFlash();

        // Seek then play
        video.currentTime = segments[segIdx].answerStart;
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => {
            // Autoplay blocked — user interaction needed, ignore
          });
        }
      }, CARD_DURATION);
    },
    [segments, triggerFlash]
  );

  // Intro → first segment
  useEffect(() => {
    if (recapPhase !== "intro" || !videoUrl) return;
    const t = setTimeout(() => playSegment(0), 800);
    return () => clearTimeout(t);
  }, [recapPhase, videoUrl, playSegment]);

  // On video loaded, keep paused
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    const onLoaded = () => {
      video.pause();
    };
    if (video.readyState >= 1) onLoaded();
    else {
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      return () => video.removeEventListener("loadedmetadata", onLoaded);
    }
  }, [videoUrl]);

  // Watch video time — advance segments
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      // Use refs to avoid stale closures
      if (showingCardRef.current || !playingRef.current) return;

      const idx = segmentRef.current;
      const seg = segments[idx];
      if (!seg) return;

      if (
        seg.answerEnd !== Infinity &&
        video.currentTime >= seg.answerEnd - 0.15
      ) {
        const nextIdx = idx + 1;
        if (nextIdx < segments.length) {
          playSegment(nextIdx);
        } else {
          video.pause();
          playingRef.current = false;
          triggerFlash();
          setTimeout(() => setRecapPhase("ended"), 200);
        }
      }
    };

    const onEnded = () => {
      playingRef.current = false;
      triggerFlash();
      setTimeout(() => setRecapPhase("ended"), 200);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [segments, playSegment, triggerFlash]);

  // Cleanup timers on unmount
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
    const file = new File([videoBlob], "fast-and-curious.webm", {
      type: videoBlob.type,
    });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Ma vidéo Fast & Curious",
          text: "Regarde ma vidéo de recrutement Fast & Curious !",
          files: [file],
        });
      } catch {
        // cancelled
      }
    } else {
      handleDownload();
    }
  }, [videoBlob, handleDownload]);

  const handleReplay = useCallback(() => {
    if (cardTimerRef.current) {
      clearTimeout(cardTimerRef.current);
      cardTimerRef.current = null;
    }
    segmentRef.current = 0;
    playingRef.current = false;
    showingCardRef.current = false;
    setCurrentSegment(0);
    setShowingCard(false);
    setRecapPhase("intro");
  }, []);

  const currentQuestion = segments[currentSegment]?.question;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* ===== FULL-SCREEN VIDEO ===== */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: "scaleX(-1)",
            opacity:
              showingCard || recapPhase === "ended" || recapPhase === "intro"
                ? 0
                : 1,
            transition: "opacity 0.2s ease",
          }}
        />
      )}

      {/* ===== FLASH (CSS only) ===== */}
      <div
        className="absolute inset-0 z-[100] bg-white pointer-events-none"
        style={{
          opacity: flashVisible ? 0.85 : 0,
          transition: flashVisible ? "none" : "opacity 0.15s ease-out",
        }}
      />

      {/* ===== INTRO — brutalist ===== */}
      <AnimatePresence>
        {recapPhase === "intro" && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 200 }}
            >
              <span className="brutal-tag brutal-tag-red text-lg px-6 py-3">
                Ton récap
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== QUESTION CARD (full screen, brutalist) ===== */}
      <AnimatePresence mode="wait">
        {showingCard && currentQuestion && (
          <motion.div
            key={`card-${currentQuestion.id}`}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Big question number */}
            <motion.div
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.1 }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-[150px] font-black text-white leading-none">
                {currentSegment + 1}
              </span>
            </motion.div>

            {/* Category pill — brutalist */}
            <motion.span
              className="-mt-16 brutal-tag brutal-tag-red mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {currentQuestion.category}
            </motion.span>

            {/* Question text */}
            <motion.div
              className="mx-6 max-w-sm w-full"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 300,
                delay: 0.15,
              }}
            >
              <div className="flex items-start gap-4 px-2">
                <motion.span
                  className="text-5xl shrink-0"
                  animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {currentQuestion.emoji}
                </motion.span>
                <p className="text-2xl font-black text-white leading-tight pt-1 uppercase">
                  {currentQuestion.text}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== PLAYING OVERLAY (progress + question reminder) ===== */}
      {recapPhase === "playing" && !showingCard && (
        <>
          {/* Progress segments at top — sharp */}
          <div className="absolute top-0 left-0 right-0 z-30 px-2 pt-2">
            <div className="flex gap-1">
              {answeredQuestions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 transition-all duration-300 ${
                    i < currentSegment
                      ? "bg-brutal-red"
                      : i === currentSegment
                      ? "bg-white"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question at bottom */}
          {currentQuestion && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-5 px-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{currentQuestion.emoji}</span>
                  <p className="text-sm font-black text-white leading-snug uppercase">
                    {currentQuestion.text}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 ml-8">
                  <span className="brutal-tag brutal-tag-red text-[8px] py-0.5 px-1.5" style={{ borderWidth: '1px' }}>
                    {currentQuestion.category}
                  </span>
                  <span className="text-[10px] text-white/30 font-black">
                    {currentSegment + 1}/{answeredQuestions.length}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ===== END CARD — brutalist ===== */}
      <AnimatePresence>
        {recapPhase === "ended" && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Decorative geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] bg-brutal-yellow border-[4px] border-black"
                style={{ transform: "rotate(15deg)" }}
              />
              <div
                className="absolute bottom-[-30px] left-[-30px] w-[180px] h-[180px] bg-brutal-red border-[4px] border-black"
                style={{ transform: "rotate(-10deg)" }}
              />
            </div>

            <motion.div
              className="relative z-10 text-center px-6"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.h1
                className="text-4xl font-black text-black uppercase leading-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                C&apos;est dans
                <br />
                la{" "}
                <span className="bg-brutal-red text-white px-2 inline-block">
                  boîte !
                </span>
              </motion.h1>

              <motion.p
                className="text-black/40 text-xs mt-3 font-black uppercase tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {answeredIds.length} questions — Fast &amp; Curious
              </motion.p>

              {/* Actions — brutalist buttons */}
              <motion.div
                className="mt-8 space-y-3 w-full max-w-xs mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={handleShare}
                  disabled={!videoBlob}
                  className="w-full py-3.5 brutal-btn brutal-btn-primary text-sm disabled:opacity-50"
                >
                  Partager la vidéo →
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!videoBlob || downloading}
                  className="w-full py-3 brutal-btn brutal-btn-secondary text-sm disabled:opacity-50"
                >
                  {downloading ? "Téléchargement..." : "Télécharger"}
                </button>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleReplay}
                    className="flex-1 py-2.5 brutal-btn brutal-btn-secondary text-xs"
                  >
                    Revoir
                  </button>
                  <button
                    onClick={onRestart}
                    className="flex-1 py-2.5 brutal-btn brutal-btn-secondary text-xs"
                  >
                    Recommencer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
