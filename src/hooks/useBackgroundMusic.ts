"use client";

import { useRef, useCallback } from "react";

/**
 * Generates a subtle ambient background pad using Web Audio API.
 * Creates a warm Am7 chord with triangle oscillators, filtered for warmth.
 */
export function useBackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startMusic = useCallback(() => {
    if (ctxRef.current) return; // already playing

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Master gain with fade-in
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2);
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    // Low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.Q.value = 0.8;
    filter.connect(masterGain);

    // Slow LFO on filter frequency for gentle movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Chord notes: Am7 spread (A2, C3, E3, G3)
    const notes = [110, 130.81, 164.81, 196.0];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 4;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.22;

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(ctx.currentTime + i * 0.08);

      // Sub oscillator (octave lower) for first two notes
      if (i < 2) {
        const sub = ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.value = freq / 2;
        const subGain = ctx.createGain();
        subGain.gain.value = 0.12;
        sub.connect(subGain);
        subGain.connect(filter);
        sub.start(ctx.currentTime);
      }
    });

    // Subtle gain "breathing"
    const breathLfo = ctx.createOscillator();
    const breathGain = ctx.createGain();
    breathLfo.frequency.value = 0.07;
    breathGain.gain.value = 0.008;
    breathLfo.connect(breathGain);
    breathGain.connect(masterGain.gain);
    breathLfo.start();
  }, []);

  const stopMusic = useCallback(() => {
    if (gainRef.current && ctxRef.current) {
      const ctx = ctxRef.current;
      gainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => {
        ctx.close();
        ctxRef.current = null;
        gainRef.current = null;
      }, 2000);
    }
  }, []);

  return { startMusic, stopMusic };
}
