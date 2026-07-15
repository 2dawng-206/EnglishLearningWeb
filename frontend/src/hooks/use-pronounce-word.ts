import { useCallback, useRef } from 'react';
import { useTextToSpeech } from './use-text-to-speech';
import type { Word } from '../types/word';

type PronounceableWord = Pick<Word, 'word' | 'audioUrlUs' | 'audioUrlUk'>;

/**
 * Prefers a real recorded clip (audio_url_us/uk — populated once the
 * dictionary-API scraping feature exists) over synthesized speech, since
 * most words won't have one yet. Falls back to TTS both when there's no
 * URL and when playback of an existing one fails.
 */
export function usePronounceWord() {
  const { speak, isSpeaking, isSupported: isTtsSupported } = useTextToSpeech();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pronounce = useCallback(
    (word: PronounceableWord) => {
      const audioUrl = word.audioUrlUs ?? word.audioUrlUk;
      if (audioUrl) {
        audioRef.current?.pause();
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().catch(() => speak(word.word));
        return;
      }
      speak(word.word);
    },
    [speak],
  );

  return { pronounce, isSpeaking, isTtsSupported };
}
