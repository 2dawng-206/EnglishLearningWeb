import { useEffect, useState } from 'react';
import { useStudySession } from '../../hooks/use-study-session';
import { SessionProgress } from '../../components/study/SessionProgress';
import { SessionSummary } from '../../components/study/SessionSummary';
import { SpeakerButton } from '../../components/common/SpeakerButton';

const RATINGS = [
  { label: 'Again', quality: 1, className: 'bg-red-50 text-red-700 hover:bg-red-100' },
  { label: 'Hard', quality: 3, className: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Good', quality: 4, className: 'bg-sage-400/10 text-sage-600 hover:bg-sage-400/20' },
  { label: 'Easy', quality: 5, className: 'bg-amber-400/20 text-amber-700 hover:bg-amber-400/30' },
];

export function FlashcardSessionPage() {
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now());

  // New card came up — reset the flip state and the reflex timer.
  useEffect(() => {
    setIsFlipped(false);
    setCardStartedAt(Date.now());
  }, [currentIndex]);

  if (isLoading) return <p className="font-body text-ink-700">Loading your due cards…</p>;
  if (isComplete) return <SessionSummary correct={stats.correct} total={stats.total} />;
  if (!currentCard) return <p className="font-body text-ink-700">Nothing to study right now.</p>;

  async function handleRate(quality: number) {
    await submitAndAdvance(quality, Date.now() - cardStartedAt, 'flashcard');
  }

  const { word } = currentCard;
  const firstDefinition = word.definitions[0];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <SessionProgress current={currentIndex} total={totalCards} />
      {error && (
        <p role="alert" className="font-body text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flashcard-perspective" onClick={() => setIsFlipped((flipped) => !flipped)}>
        <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
          <div className="flashcard-face">
            <span className="font-display text-3xl font-semibold text-ink-950">{word.word}</span>
            {word.phoneticUs && (
              <span className="font-mono text-sm text-ink-700">/{word.phoneticUs}/</span>
            )}
            <span onClick={(event) => event.stopPropagation()}>
              <SpeakerButton word={word} />
            </span>
            <p className="mt-4 font-body text-xs text-ink-700">Tap to reveal</p>
          </div>

          <div className="flashcard-face flashcard-back">
            {firstDefinition ? (
              <>
                <p className="font-body text-xs italic text-ink-700">
                  {firstDefinition.partOfSpeech}
                </p>
                <p className="font-body text-ink-950">{firstDefinition.definition}</p>
                {firstDefinition.example && (
                  <p className="font-body text-sm italic text-ink-700">
                    “{firstDefinition.example}”
                  </p>
                )}
              </>
            ) : (
              <p className="font-body text-ink-700">No definition on file yet.</p>
            )}
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((rating) => (
            <button
              key={rating.label}
              type="button"
              onClick={() => handleRate(rating.quality)}
              className={`rounded-lg py-2.5 font-body text-sm font-medium transition-colors ${rating.className}`}
            >
              {rating.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
