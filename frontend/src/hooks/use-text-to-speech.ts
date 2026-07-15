import { useCallback, useEffect, useState } from 'react';

interface SpeakOptions {
  lang?: string;
  rate?: number;
}

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    // Stop mid-utterance if whatever's using this unmounts (e.g. the user
    // flips to the next card before playback finishes).
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang ?? 'en-US';
      utterance.rate = options.rate ?? 0.9; // a touch slower helps learners
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  return { speak, isSpeaking, isSupported };
}
