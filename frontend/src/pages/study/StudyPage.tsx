import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDueCards } from '../../features/progress/progress-api';
import { getErrorMessage } from '../../utils/get-error-message';

const MODES = [
  {
    to: '/study/flashcards',
    title: 'Flashcards',
    description: 'Flip to reveal the definition, then rate how well you remembered it.',
  },
  {
    to: '/study/quiz',
    title: 'Reflex quiz',
    description: 'Pick the right definition against the clock — speed counts.',
  },
  {
    to: '/study/pronunciation',
    title: 'Pronunciation practice',
    description: 'Say the word out loud; your mic checks it against the target.',
  },
];

export function StudyPage() {
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDueCards(100)
      .then((cards) => setDueCount(cards.length))
      .catch((err) => setError(getErrorMessage(err, 'Could not load your due cards.')));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-950">Study</h1>
        <p className="mt-1 font-body text-ink-700">
          {error ? (
            error
          ) : dueCount === null ? (
            'Checking what’s due…'
          ) : dueCount === 0 ? (
            <>
              Nothing due right now.{' '}
              <Link to="/vocabulary" className="font-medium text-amber-600 hover:underline">
                Add some words
              </Link>{' '}
              to get started.
            </>
          ) : (
            `${dueCount} card${dueCount === 1 ? '' : 's'} due for review.`
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map((mode) => {
          const isDisabled = dueCount === 0;
          return (
            <Link
              key={mode.to}
              to={isDisabled ? '#' : mode.to}
              aria-disabled={isDisabled}
              className={`flex flex-col gap-2 rounded-xl border border-paper-300 bg-white px-5 py-5 transition-shadow ${
                isDisabled ? 'pointer-events-none opacity-50' : 'hover:shadow-md'
              }`}
            >
              <span className="font-display text-lg font-semibold text-ink-950">
                {mode.title}
              </span>
              <span className="font-body text-sm text-ink-700">{mode.description}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
