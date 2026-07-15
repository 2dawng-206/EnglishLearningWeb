// Mirrors backend/src/modules/progress/entities/*.ts

import type { Word } from './word';

export type ProgressStatus = 'new' | 'learning' | 'reviewing' | 'mastered';
export type SessionType = 'flashcard' | 'multiple_choice' | 'typing' | 'pronunciation';

export interface UserProgress {
  id: number;
  userId: number;
  wordId: number;
  intervalDays: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  status: ProgressStatus;
  totalReviews: number;
  correctReviews: number;
  isFavorited: boolean;
  isIgnored: boolean;
  word: Word;
}

export interface SubmitReviewPayload {
  quality: number; // 0-5, SM-2 quality of recall
  timeTakenMs?: number;
  sessionType?: SessionType;
}
