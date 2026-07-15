import { useEffect, useState } from 'react';
import { useStudySession } from '../../hooks/use-study-session';
import { useSpeechRecognition } from '../../hooks/use-speech-recognition';
import { usePronounceWord } from '../../hooks/use-pronounce-word';
import { isPronunciationMatch } from '../../utils/pronunciation-match';
import { SessionProgress } from '../../components/study/SessionProgress';
import { SessionSummary } from '../../components/study/SessionSummary';
import { Button } from '../../components/common/Button';

export function PronunciationSessionPage() {
  const {
    currentCard,
    totalCards,
    currentIndex,
    isLoading,
    error,
    isComplete,
    stats,
    submitAndAdvance,
  } = useStudySession();
  const { startListening, status, transcript, isSupported } = useSpeechRecognition();
  const { pronounce } = usePronounceWord();
  const [attemptStartedAt, setAttemptStartedAt] = useState(() => Date.now());
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    setHasResult(false);
    setAttemptStartedAt(Date.now());
  }, [currentIndex]);

  // A fresh (non-empty) transcript means the recognizer just returned a result.
  useEffect(() => {
    if (transcript) setHasResult(true);
  }, [transcript]);

  if (isLoading) return <p className="font-body text-ink-700">Loading your due cards…</p>;
  if (isComplete) return <SessionSummary correct={stats.correct} total={stats.total} />;
  if (!currentCard) return <p className="font-body text-ink-700">Nothing to study right now.</p>;

  const { word } = currentCard;
  const isMatch = hasResult && isPronunciationMatch(transcript, word.word);

  function handleContinue(quality: number) {
    void submitAndAdvance(quality, Date.now() - attemptStartedAt, 'pronunciation');
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <SessionProgress current={currentIndex} total={totalCards} />
      {error && (
        <p role="alert" className="font-body text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-3 rounded-xl border border-paper-300 bg-white px-6 py-10 text-center">
        <span className="font-display text-3xl font-semibold text-ink-950">{word.word}</span>
        {word.phoneticUs && (
          <span className="font-mono text-sm text-ink-700">/{word.phoneticUs}/</span>
        )}
        <button
          type="button"
          onClick={() => pronounce(word)}
          className="font-body text-sm font-medium text-amber-600 hover:underline"
        >
          🔊 Hear it first
        </button>

        {!isSupported ? (
          <p className="mt-4 font-body text-sm text-ink-700">
            Speech recognition isn't supported in this browser — try Chrome, Edge, or Safari to
            use this mini-game.
          </p>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => startListening('en-US')}
              disabled={status === 'listening'}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-ink-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
              aria-label="Record your pronunciation"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
                <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z" />
              </svg>
            </button>
            <p className="font-body text-sm text-ink-700">
              {status === 'listening' ? 'Listening…' : hasResult ? 'Heard:' : 'Tap to record'}
            </p>
            {hasResult && (
              <p className={`font-mono text-lg ${isMatch ? 'text-sage-600' : 'text-red-600'}`}>
                “{transcript}” {isMatch ? '✓' : '✗'}
              </p>
            )}
          </div>
        )}
      </div>

      {(hasResult || !isSupported) && (
        <div className="flex justify-center gap-3">
          {isSupported && !isMatch && (
            <Button variant="secondary" onClick={() => setHasResult(false)}>
              Try again
            </Button>
          )}
          <Button onClick={() => handleContinue(isSupported ? (isMatch ? 5 : 1) : 3)}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
