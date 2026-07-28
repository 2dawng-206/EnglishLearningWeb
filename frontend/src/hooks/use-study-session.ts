import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDueCards } from '../features/progress/progress-api';
import { submitReview } from '../features/progress/progress-api';
import { completeSession } from '../features/gamification/gamification-api';
import { apiClient } from '../services/api-client';
import { useAuthStore } from '../features/auth/auth-store';
import { getErrorMessage } from '../utils/get-error-message';
import type { SessionType, UserProgress } from '../types/progress';
import type { UserProfile } from '../types/user';

export function useStudySession() {
  const [cards, setCards] = useState<UserProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const setUser = useAuthStore((state) => state.setUser);

  // Session-start timestamp, fixed once when the hook mounts — used to
  // compute the session's total duration for recordSessionComplete().
  const sessionStartedAtRef = useRef(Date.now());
  const hasReportedCompletionRef = useRef(false);

  useEffect(() => {
    fetchDueCards(20)
      .then(setCards)
      .catch((err) => setError(getErrorMessage(err, 'Could not load your due cards.')))
      .finally(() => setIsLoading(false));
  }, []);

  const isComplete = !isLoading && cards.length > 0 && currentIndex >= cards.length;

  // Fires exactly once per session, right when the last card is submitted —
  // not per-review, since "one sitting" is a session-level concept that
  // can't be derived from individual review timestamps.
  useEffect(() => {
    if (!isComplete || hasReportedCompletionRef.current) return;
    hasReportedCompletionRef.current = true;
    const durationMs = Date.now() - sessionStartedAtRef.current;
    completeSession(durationMs).catch(() => {
      // Non-critical — session stats just won't reflect this sitting.
    });
  }, [isComplete]);

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

        // Refresh the store's user so XP/level/streak show up immediately
        // on the Dashboard without waiting for the next login/reload.
        try {
          const { data } = await apiClient.get<UserProfile>('/users/me');
          setUser(data);
        } catch {
          // ignore — non-critical, session keeps moving either way
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Could not save that review — moving on anyway.'));
      } finally {
        setCurrentIndex((index) => index + 1);
      }
    },
    [cards, currentIndex, setUser],
  );

  return {
    currentCard: cards[currentIndex] ?? null,
    totalCards: cards.length,
    currentIndex,
    isLoading,
    error,
    isComplete,
    stats,
    submitAndAdvance,
  };
}
