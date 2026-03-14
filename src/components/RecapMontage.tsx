"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { questions } from "@/data/questions";

interface RecapMontageProps {
  answeredIds: number[];
  videoBlob: Blob | null;
  onRestart: () => void;
}

export default function RecapMontage({ answeredIds, videoBlob, onRestart }: RecapMontageProps) {
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

  const handleDownload = () => {
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
  };

  const handleShare = async () => {
    if (!videoBlob) return;
    const file = new File([videoBlob], "fast-and-curious.webm", { type: videoBlob.type });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Ma vidéo Fast & Curious",
          text: "Regarde ma vidéo de recrutement !",
          files: [file],
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg p-4 border-b border-white/10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-xl font-bold gradient-text text-center">Bravo, c&apos;est dans la boîte ! 🎬</h1>
      </motion.div>

      <div className="p-4 space-y-6">
        {/* Video preview */}
        {videoUrl && (
          <motion.div
            className="rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              className="w-full aspect-[9/16] object-cover bg-black"
            />
          </motion.div>
        )}

        {/* Questions recap */}
        <motion.div
          className="space-y-2"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-white/80 mb-3">
            {answeredIds.length}/{questions.length} questions
          </h2>
          {questions.map((q, i) => {
            const wasAnswered = answeredIds.includes(q.id);
            return (
              <motion.div
                key={q.id}
                className={`rounded-xl p-3 flex items-center gap-3 ${
                  wasAnswered
                    ? `bg-gradient-to-r ${q.gradient}`
                    : "bg-white/5 opacity-40"
                }`}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: wasAnswered ? 1 : 0.4 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <span className="text-lg shrink-0">{q.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60">{q.category}</p>
                  <p className="font-bold text-sm truncate">{q.text}</p>
                </div>
                {wasAnswered && (
                  <span className="text-xs text-white/60">✓</span>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="space-y-3 pb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={handleDownload}
            disabled={!videoBlob || downloading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-burgundy-500 to-navy-500 font-bold text-lg shadow-lg shadow-burgundy-500/25 active:scale-95 transition-transform disabled:opacity-50"
          >
            {downloading ? "Téléchargement..." : "Télécharger ma vidéo 📥"}
          </button>

          <button
            onClick={handleShare}
            disabled={!videoBlob}
            className="w-full py-4 rounded-xl bg-white/10 backdrop-blur font-bold text-lg border border-white/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            Partager 🔗
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl text-white/50 font-medium text-sm hover:text-white/80 transition-colors"
          >
            Recommencer
          </button>
        </motion.div>
      </div>
    </div>
  );
}
