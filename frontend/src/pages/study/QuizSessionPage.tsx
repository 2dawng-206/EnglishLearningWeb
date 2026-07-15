import { useEffect, useState } from 'react';
import { useStudySession } from '../../hooks/use-study-session';
import { fetchWords } from '../../features/words/words-api';
import { SessionProgress } from '../../components/study/SessionProgress';
import { SessionSummary } from '../../components/study/SessionSummary';
import { getErrorMessage } from '../../utils/get-error-message';
import { sample, shuffle } from '../../utils/array';
import type { Word } from '../../types/word';

const FAST_ANSWER_THRESHOLD_MS = 3000;

export function QuizSessionPage() {
  const {
    currentCard,
    totalCards,
    currentIndex,
    isLoading,
    error: sessionError,
    isComplete,
    stats,
    submitAndAdvance,
  } = useStudySession();

  const [distractorPool, setDistractorPool] = useState<Word[]>([]);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());

  // One batch of "other words" fetched once, reused as the distractor
  // source for every question in this session rather than a request per card.
  useEffect(() => {
    fetchWords({ limit: 50 })
      .then((page) => setDistractorPool(page.items))
      .catch((err) => setPoolError(getErrorMessage(err, 'Could not load quiz options.')));
  }, []);

  const correctDefinition = currentCard?.word.definitions[0]?.definition ?? null;

  useEffect(() => {
    if (!currentCard || !correctDefinition || distractorPool.length === 0) return;

    const otherWords = distractorPool.filter(
      (candidate) => candidate.id !== currentCard.wordId && candidate.definitions[0],
    );
    const distractors = sample(otherWords, Math.min(3, otherWords.length)).map(
      (candidate) => candidate.definitions[0].definition,
    );

    setOptions(shuffle([correctDefinition, ...distractors]));
    setSelectedOption(null);
    setQuestionStartedAt(Date.now());
  }, [currentCard, correctDefinition, distractorPool]);

  if (isLoading) return <p className="font-body text-ink-700">Loading your due cards…</p>;
  if (isComplete) return <SessionSummary correct={stats.correct} total={stats.total} />;
  if (!currentCard) return <p className="font-body text-ink-700">Nothing to study right now.</p>;

  function handleSelect(option: string) {
    if (selectedOption) return; // already answered this one
    setSelectedOption(option);

    const timeTakenMs = Date.now() - questionStartedAt;
    const isCorrect = option === correctDefinition;
    const quality = !isCorrect ? 1 : timeTakenMs < FAST_ANSWER_THRESHOLD_MS ? 5 : 4;

    // Brief pause so the correct/incorrect highlight is visible before the
    // next question replaces it.
    setTimeout(() => {
      void submitAndAdvance(quality, timeTakenMs, 'multiple_choice');
    }, 1100);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <SessionProgress current={currentIndex} total={totalCards} />
      {(sessionError || poolError) && (
        <p role="alert" className="font-body text-sm text-red-600">
          {sessionError ?? poolError}
        </p>
      )}

      <div className="rounded-xl border border-paper-300 bg-white px-6 py-8 text-center">
        <span className="font-display text-2xl font-semibold text-ink-950">
          {currentCard.word.word}
        </span>
        {currentCard.word.phoneticUs && (
          <span className="ml-2 font-mono text-sm text-ink-700">
            /{currentCard.word.phoneticUs}/
          </span>
        )}
        <p className="mt-1 font-body text-xs text-ink-700">Which definition matches?</p>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === correctDefinition;
          const showResult = selectedOption !== null;

          let stateClasses = 'border-paper-300 hover:border-amber-600';
          if (showResult && isCorrectOption) {
            stateClasses = 'border-sage-600 bg-sage-400/10';
          } else if (showResult && isSelected && !isCorrectOption) {
            stateClasses = 'border-red-400 bg-red-50';
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`rounded-lg border px-4 py-3 text-left font-body text-sm text-ink-950 transition-colors ${stateClasses}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
