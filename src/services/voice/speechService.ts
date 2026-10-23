/**
 * NEXORA AI — Voice & Speech Synthesis Service
 * Native low-latency TTS using expo-speech with barge-in interruption support
 */

import * as Speech from 'expo-speech';

export interface SpeechOptions {
  pitch?: number;
  rate?: number;
  language?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export const SpeechService = {
  isSpeaking: false,

  /**
   * Speak a phrase using native hardware speech synthesizer
   */
  async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    // Immediate cancellation of any previous speech (barge-in)
    await this.stop();

    if (!text || text.trim() === '') {
      this.isSpeaking = false;
      if (options.onDone) options.onDone();
      return;
    }

    this.isSpeaking = true;
    if (options.onStart) options.onStart();

    return new Promise<void>((resolve) => {
      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimer);
        this.isSpeaking = false;
        resolve();
      };

      // Safety timeout: average reading rate ~15 chars/sec; guarantee resolution even if OS drops callback
      const estimatedDurationMs = Math.max(4000, Math.min(30000, Math.round((text.length / 10) * 1000) + 3000));
      const safetyTimer = setTimeout(() => {
        if (options.onDone) options.onDone();
        finish();
      }, estimatedDurationMs);

      try {
        Speech.speak(text, {
          pitch: options.pitch ?? 1.0,
          rate: options.rate ?? 0.95,
          language: options.language ?? 'en-US',
          onDone: () => {
            if (options.onDone) options.onDone();
            finish();
          },
          onError: (err) => {
            if (options.onError) options.onError(new Error(String(err)));
            finish();
          },
        });
      } catch {
        if (options.onDone) options.onDone();
        finish();
      }
    });
  },

  /**
   * Instantly halt current speech playback (Barge-In)
   */
  async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch {
      // Silent error handling for audio stop
    }
  },

  /**
   * Pause current speech playback if supported by platform
   */
  async pause(): Promise<void> {
    try {
      if (Speech.pause) await Speech.pause();
    } catch {}
  },

  /**
   * Resume paused speech playback if supported by platform
   */
  async resume(): Promise<void> {
    try {
      if (Speech.resume) await Speech.resume();
    } catch {}
  },

  /**
   * Check if speech synthesis is currently active
   */
  async getStatus(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  },
};
