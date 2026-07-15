import { usePronounceWord } from "../../hooks/use-pronounce-word";
import type { Word } from "../../types/word";

export function SpeakerButton({
  word,
}: {
  word: Pick<Word, "word" | "audioUrlUs" | "audioUrlUk">;
}) {
  const { pronounce, isSpeaking, isTtsSupported } = usePronounceWord();

  // A missing audio_url still works fine via TTS, so only hide the button
  // entirely if neither path is available at all.
  if (!isTtsSupported && !word.audioUrlUs && !word.audioUrlUk) return null;

  return (
    <button
      type="button"
      onClick={() => pronounce(word)}
      aria-label={`Pronounce "${word.word}"`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 text-ink-800 transition-colors hover:bg-ink-950/5 ${
        isSpeaking ? "text-amber-600" : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
      </svg>
    </button>
  );
}
