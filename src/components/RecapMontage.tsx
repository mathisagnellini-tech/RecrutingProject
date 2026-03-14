"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface RecapMontageProps {
  answeredIds: number[];
  videoBlob: Blob | null;
  questionTimestamps: number[];
  onRestart: () => void;
}

export default function RecapMontage({
  answeredIds,
  videoBlob,
  onRestart,
}: RecapMontageProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

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

      {/* Video - just the plain recorded video */}
      <div className="flex-1 min-h-0 px-3 pb-2">
        {videoUrl && (
          <motion.div
            className="w-full h-full rounded-2xl overflow-hidden"
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
