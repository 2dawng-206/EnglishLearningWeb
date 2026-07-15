import { useCallback, useEffect, useState } from 'react';
import { fetchDueCards } from '../features/progress/progress-api';
import { submitReview } from '../features/progress/progress-api';
import { getErrorMessage } from '../utils/get-error-message';
import type { SessionType, UserProgress } from '../types/progress';

export function useStudySession() {
  const [cards, setCards] = useState<UserProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    fetchDueCards(20)
      .then(setCards)
      .catch((err) => setError(getErrorMessage(err, 'Could not load your due cards.')))
      .finally(() => setIsLoading(false));
  }, []);

  const submitAndAdvance = useCallback(
    async (quality: number, timeTakenMs: number, sessionType: SessionType) => {
      const card = cards[currentIndex];
      if (!card) return;

      try {
        await submitReview(card.wordId, { quality, timeTakenMs, sessionType });
        setStats((current) => ({
          correct: current.correct + (quality >= 3 ? 1 : 0),
          total: current.total + 1,
        }));
      } catch (err) {
        // Don't strand the user on a broken card — log the error and
        // keep the session moving; the card just stays due for next time.
        setError(getErrorMessage(err, 'Could not save that review — moving on anyway.'));
      } finally {
        setCurrentIndex((index) => index + 1);
      }
    },
    [cards, currentIndex],
  );

  return {
    currentCard: cards[currentIndex] ?? null,
    totalCards: cards.length,
    currentIndex,
    isLoading,
    error,
    isComplete: !isLoading && cards.length > 0 && currentIndex >= cards.length,
    stats,
    submitAndAdvance,
  };
}
