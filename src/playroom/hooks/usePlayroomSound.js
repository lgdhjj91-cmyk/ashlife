import { useCallback, useRef } from 'react';

const tones = {
  flip: [540, 0.045],
  match: [760, 0.08],
  wrong: [220, 0.08],
  unlock: [920, 0.12],
  complete: [660, 0.16],
};

export const usePlayroomSound = (enabled) => {
  const audioRef = useRef(null);

  const getContext = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    return audioRef.current;
  }, [enabled]);

  const play = useCallback(
    (type) => {
      const context = getContext();
      const [frequency, duration] = tones[type] || tones.flip;
      if (!context) return;

      if (context.state === 'suspended') {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type === 'wrong' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration + 0.02);
    },
    [getContext]
  );

  return { play };
};

