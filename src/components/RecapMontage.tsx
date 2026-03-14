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
  const [showShareMenu, setShowShareMenu] = useState(false);
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

  const handleNativeShare = useCallback(async () => {
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
      setShowShareMenu(true);
    }
  }, [videoBlob]);

  const handleShareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      "Regarde ma vidéo de recrutement Fast & Curious ! 🎬🔥"
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, []);

  const handleShareLinkedIn = useCallback(() => {
    const text = encodeURIComponent(
      "Je viens de passer mon entretien Fast & Curious ! 🎬 10 questions flash, face caméra. Une nouvelle façon de se présenter aux recruteurs !"
    );
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?text=${text}`,
      "_blank"
    );
  }, []);

  const handleShareX = useCallback(() => {
    const text = encodeURIComponent(
      "Je viens de faire mon Fast & Curious recrutement ! 🎬🔥 10 questions flash face caméra"
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(
      "Regarde ma vidéo de recrutement Fast & Curious ! 🎬🔥"
    );
    setShowShareMenu(false);
  }, []);

  const jumpToQuestion = useCallback((idx: number) => {
    const video = videoRef.current;
    if (!video || !questionTimestamps[idx]) return;
    video.currentTime = questionTimestamps[idx];
    video.play();
  }, [questionTimestamps]);

  const currentQuestion = questions[currentQuestionIdx];
  const answeredQuestions = questions.filter((q) => answeredIds.includes(q.id));

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Header */}
      <motion.div
        className="shrink-0 bg-black/80 backdrop-blur-lg px-4 py-3 border-b border-white/10 z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-lg font-bold gradient-text text-center">
          Bravo, c&apos;est dans la boîte ! 🎬
        </h1>
        <p className="text-xs text-white/40 text-center mt-0.5">
          {answeredIds.length}/{questions.length} questions
        </p>
      </motion.div>

      {/* Video + synced question - takes most of the space */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Video */}
        {videoUrl && (
          <motion.div
            className="relative flex-1 min-h-0"
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

        {/* Current question - synced with video */}
        <div className="shrink-0 px-4 py-3">
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
                  className={`rounded-2xl p-4 bg-gradient-to-r ${currentQuestion.gradient} shadow-lg border border-white/10`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                      {currentQuestion.category}
                    </span>
                    <span className="text-[10px] text-white/40">
                      &#8226; Question {currentQuestionIdx + 1}/{answeredQuestions.length}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{currentQuestion.emoji}</span>
                    <p className="text-base font-bold text-white leading-snug">
                      {currentQuestion.text}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Question timeline dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {answeredQuestions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => jumpToQuestion(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentQuestionIdx
                    ? "w-6 bg-burgundy-400"
                    : "w-1.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <motion.div
        className="shrink-0 px-4 pb-6 pt-2 space-y-2.5 border-t border-white/5"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Share row */}
        <div className="flex gap-2">
          <button
            onClick={handleNativeShare}
            disabled={!videoBlob}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-burgundy-500 to-navy-500 font-bold text-sm shadow-lg shadow-burgundy-500/25 active:scale-95 transition-transform disabled:opacity-50"
          >
            Partager 🔗
          </button>
          <button
            onClick={handleDownload}
            disabled={!videoBlob || downloading}
            className="py-3.5 px-4 rounded-xl bg-white/10 backdrop-blur font-bold text-sm border border-white/10 active:scale-95 transition-transform disabled:opacity-50"
          >
            {downloading ? "..." : "📥"}
          </button>
        </div>

        {/* Social network buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-3 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 text-sm font-bold text-[#25D366] active:scale-95 transition-transform"
          >
            WhatsApp
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="flex-1 py-3 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-sm font-bold text-[#0A66C2] active:scale-95 transition-transform"
          >
            LinkedIn
          </button>
          <button
            onClick={handleShareX}
            className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold text-white/80 active:scale-95 transition-transform"
          >
            X
          </button>
          <button
            onClick={handleCopyLink}
            className="py-3 px-3 rounded-xl bg-white/10 border border-white/10 text-sm active:scale-95 transition-transform"
            title="Copier le texte"
          >
            📋
          </button>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-2.5 rounded-xl text-white/40 font-medium text-xs hover:text-white/70 transition-colors"
        >
          Recommencer
        </button>
      </motion.div>

      {/* Fallback share menu overlay (for browsers without native share) */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareMenu(false)}
          >
            <motion.div
              className="w-full bg-gray-900 rounded-t-3xl p-6 space-y-3 border-t border-white/10"
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-bold text-center mb-4">Partager sur...</h3>

              <button
                onClick={() => { handleShareWhatsApp(); setShowShareMenu(false); }}
                className="w-full py-3.5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 font-bold text-[#25D366] active:scale-95 transition-transform"
              >
                WhatsApp
              </button>
              <button
                onClick={() => { handleShareLinkedIn(); setShowShareMenu(false); }}
                className="w-full py-3.5 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/30 font-bold text-[#0A66C2] active:scale-95 transition-transform"
              >
                LinkedIn
              </button>
              <button
                onClick={() => { handleShareX(); setShowShareMenu(false); }}
                className="w-full py-3.5 rounded-xl bg-white/10 border border-white/15 font-bold text-white/80 active:scale-95 transition-transform"
              >
                X (Twitter)
              </button>
              <button
                onClick={() => { handleDownload(); setShowShareMenu(false); }}
                className="w-full py-3.5 rounded-xl bg-white/10 border border-white/10 font-bold text-white/60 active:scale-95 transition-transform"
              >
                Télécharger la vidéo 📥
              </button>
              <button
                onClick={() => setShowShareMenu(false)}
                className="w-full py-3 text-white/40 text-sm font-medium"
              >
                Annuler
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
