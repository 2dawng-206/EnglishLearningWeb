import { useCallback, useEffect, useRef, useState } from 'react';

export type RecognitionStatus = 'idle' | 'listening' | 'no-match' | 'error';

/**
 * Chrome/Edge/Safari 14.1+ support this (Safari and most others only under
 * the webkitSpeechRecognition prefix); Firefox does not ship it enabled by
 * default. Always check `isSupported` before offering the pronunciation
 * mini-game, and show a plain-language fallback message rather than a
 * broken mic button.
 */
export function useSpeechRecognition() {
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const RecognitionCtor =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
      : undefined;
  const isSupported = !!RecognitionCtor;

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(
    (lang = 'en-US') => {
      if (!RecognitionCtor) return;

      const recognition = new RecognitionCtor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setTranscript('');
        setStatus('listening');
      };
      recognition.onresult = (event) => {
        setTranscript(event.results[0]?.[0]?.transcript ?? '');
        setStatus('idle');
      };
      recognition.onnomatch = () => setStatus('no-match');
      recognition.onerror = () => setStatus('error');
      recognition.onend = () => {
        // Only fall back to idle if nothing else already settled the
        // status (result/no-match/error all already set it explicitly).
        setStatus((current) => (current === 'listening' ? 'idle' : current));
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [RecognitionCtor],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { startListening, stopListening, status, transcript, isSupported };
}
