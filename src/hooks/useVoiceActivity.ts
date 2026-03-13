"use client";

import { useRef, useEffect, useState } from "react";

interface VoiceActivityState {
  isSpeaking: boolean;
  hasSpoken: boolean;
  silenceDurationMs: number;
}

/**
 * Detects voice activity on a MediaStream using Web Audio API.
 * Returns whether user is speaking, has spoken, and silence duration since last speech.
 * Pass resetKey to reset state between questions.
 */
export function useVoiceActivity(
  stream: MediaStream | null,
  resetKey: number = 0
): VoiceActivityState {
  const [state, setState] = useState<VoiceActivityState>({
    isSpeaking: false,
    hasSpoken: false,
    silenceDurationMs: 0,
  });

  const spokenRef = useRef(false);
  const silenceStartRef = useRef(Date.now());

  // Reset when question changes
  useEffect(() => {
    spokenRef.current = false;
    silenceStartRef.current = Date.now();
    setState({ isSpeaking: false, hasSpoken: false, silenceDurationMs: 0 });
  }, [resetKey]);

  useEffect(() => {
    if (!stream) return;

    let active = true;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      if (!active) return;

      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const speaking = avg > 10;

      if (speaking) {
        if (!spokenRef.current) {
          spokenRef.current = true;
        }
        silenceStartRef.current = Date.now();
        setState({ isSpeaking: true, hasSpoken: true, silenceDurationMs: 0 });
      } else if (spokenRef.current) {
        setState({
          isSpeaking: false,
          hasSpoken: true,
          silenceDurationMs: Date.now() - silenceStartRef.current,
        });
      }
    };

    const interval = setInterval(check, 100);

    return () => {
      active = false;
      clearInterval(interval);
      source.disconnect();
      audioContext.close();
    };
  }, [stream]);

  return state;
}
