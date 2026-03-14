"use client";

import { useRef, useCallback } from "react";

/**
 * Generates a lo-fi hip-hop style background track using Web Audio API.
 * Features: kick, snare, hi-hat, piano chords, bass, vinyl crackle.
 * ~75 BPM, chill vibes, at 10% volume.
 */
export function useBackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startMusic = useCallback(() => {
    if (ctxRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Master gain – 10% volume with fade-in
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 2);
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    // === VINYL CRACKLE ===
    const crackleNode = createCrackle(ctx);
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.08;
    crackleNode.connect(crackleGain);
    crackleGain.connect(masterGain);

    // === PIANO / KEYS PAD ===
    const pianoGain = ctx.createGain();
    pianoGain.gain.value = 0.35;
    pianoGain.connect(masterGain);

    const pianoFilter = ctx.createBiquadFilter();
    pianoFilter.type = "lowpass";
    pianoFilter.frequency.value = 800;
    pianoFilter.Q.value = 0.5;
    pianoFilter.connect(pianoGain);

    // Chord progression: Am7 → Fmaj7 → Cmaj7 → Em7 (lo-fi classic)
    const chords = [
      [220.0, 261.63, 329.63, 392.0],    // Am7: A3 C4 E4 G4
      [174.61, 220.0, 261.63, 329.63],    // Fmaj7: F3 A3 C4 E4
      [130.81, 164.81, 196.0, 246.94],    // Cmaj7: C3 E3 G3 B3
      [164.81, 196.0, 246.94, 293.66],    // Em7: E3 G3 B3 D4
    ];

    const BPM = 75;
    const beatDuration = 60 / BPM;
    const barDuration = beatDuration * 4;

    // Schedule chord changes every bar, looping
    function scheduleChords(startTime: number, loopCount: number) {
      for (let loop = 0; loop < loopCount; loop++) {
        chords.forEach((chord, chordIdx) => {
          const chordTime = startTime + (loop * chords.length + chordIdx) * barDuration;

          chord.forEach((freq, noteIdx) => {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = freq;
            osc.detune.value = (noteIdx - 1.5) * 6 + (Math.random() - 0.5) * 8;

            const noteGain = ctx.createGain();
            // Soft attack and release for lo-fi feel
            noteGain.gain.setValueAtTime(0, chordTime);
            noteGain.gain.linearRampToValueAtTime(0.15, chordTime + 0.08);
            noteGain.gain.setValueAtTime(0.15, chordTime + barDuration * 0.7);
            noteGain.gain.linearRampToValueAtTime(0, chordTime + barDuration);

            osc.connect(noteGain);
            noteGain.connect(pianoFilter);
            osc.start(chordTime);
            osc.stop(chordTime + barDuration + 0.1);
          });
        });
      }
    }
    scheduleChords(ctx.currentTime + 0.5, 30); // ~4 min of music

    // === BASS ===
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.25;
    bassGain.connect(masterGain);

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 250;
    bassFilter.connect(bassGain);

    const bassNotes = [110, 87.31, 65.41, 82.41]; // A2, F2, C2, E2

    function scheduleBass(startTime: number, loopCount: number) {
      for (let loop = 0; loop < loopCount; loop++) {
        bassNotes.forEach((freq, noteIdx) => {
          const noteTime = startTime + (loop * bassNotes.length + noteIdx) * barDuration;

          // Play bass on beat 1 and beat 3 of each bar
          [0, 2].forEach((beat) => {
            const t = noteTime + beat * beatDuration;
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = freq;

            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.2, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.01, t + beatDuration * 1.8);

            osc.connect(g);
            g.connect(bassFilter);
            osc.start(t);
            osc.stop(t + beatDuration * 2);
          });
        });
      }
    }
    scheduleBass(ctx.currentTime + 0.5, 30);

    // === DRUMS ===
    const drumGain = ctx.createGain();
    drumGain.gain.value = 0.3;
    drumGain.connect(masterGain);

    function scheduleKick(time: number) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.6, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

      osc.connect(g);
      g.connect(drumGain);
      osc.start(time);
      osc.stop(time + 0.3);
    }

    function scheduleSnare(time: number) {
      // Noise burst for snare
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const snareFilter = ctx.createBiquadFilter();
      snareFilter.type = "highpass";
      snareFilter.frequency.value = 1500;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

      noise.connect(snareFilter);
      snareFilter.connect(g);
      g.connect(drumGain);
      noise.start(time);
      noise.stop(time + 0.15);

      // Body tone
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 180;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.15, time);
      og.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
      osc.connect(og);
      og.connect(drumGain);
      osc.start(time);
      osc.stop(time + 0.1);
    }

    function scheduleHiHat(time: number, open: boolean) {
      const bufferSize = ctx.sampleRate * (open ? 0.15 : 0.04);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const hhFilter = ctx.createBiquadFilter();
      hhFilter.type = "highpass";
      hhFilter.frequency.value = 7000;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + (open ? 0.15 : 0.04));

      noise.connect(hhFilter);
      hhFilter.connect(g);
      g.connect(drumGain);
      noise.start(time);
      noise.stop(time + (open ? 0.2 : 0.06));
    }

    function scheduleDrumLoop(startTime: number, loopCount: number) {
      const totalBars = loopCount * chords.length;
      for (let bar = 0; bar < totalBars; bar++) {
        const barStart = startTime + bar * barDuration;
        // Lo-fi swing: slightly late beats
        const swing = 0.02;

        // Kick: beat 1 and sometimes beat 3
        scheduleKick(barStart);
        if (bar % 2 === 0) scheduleKick(barStart + beatDuration * 2 + swing);

        // Snare: beat 2 and 4 (backbeat)
        scheduleSnare(barStart + beatDuration * 1 + swing);
        scheduleSnare(barStart + beatDuration * 3 + swing);

        // Hi-hat: every 8th note with slight swing
        for (let eighth = 0; eighth < 8; eighth++) {
          const hhTime = barStart + eighth * (beatDuration / 2) + (eighth % 2 === 1 ? swing : 0);
          scheduleHiHat(hhTime, eighth === 4); // open hi-hat on the "and" of 3
        }
      }
    }
    scheduleDrumLoop(ctx.currentTime + 0.5 + barDuration, 30); // drums start after 1 bar intro

    // === SUBTLE LFO ON MASTER (tape wobble) ===
    const wobble = ctx.createOscillator();
    const wobbleGain = ctx.createGain();
    wobble.frequency.value = 0.3;
    wobbleGain.gain.value = 0.005;
    wobble.connect(wobbleGain);
    wobbleGain.connect(masterGain.gain);
    wobble.start();
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

/** Creates a vinyl crackle noise node */
function createCrackle(ctx: AudioContext): AudioNode {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Sparse crackle: mostly silent with occasional pops
    if (Math.random() < 0.002) {
      data[i] = (Math.random() - 0.5) * 0.8;
    } else if (Math.random() < 0.01) {
      data[i] = (Math.random() - 0.5) * 0.15;
    } else {
      data[i] = (Math.random() - 0.5) * 0.01;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();

  // Filter crackle for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  filter.Q.value = 0.3;
  source.connect(filter);

  return filter;
}
