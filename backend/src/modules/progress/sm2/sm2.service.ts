import { Injectable } from '@nestjs/common';

export interface Sm2Input {
  /** SM-2 quality of recall, integer 0–5 (see review_history.quality CHECK constraint). */
  quality: number;
  /** Consecutive-correct-answer count going into this review. */
  repetition: number;
  /** Ease factor going into this review. */
  easeFactor: number;
  /** The interval (days) that led to *this* review — only used when repetition >= 2. */
  previousIntervalDays: number;
}

export interface Sm2Result {
  /** Consecutive-correct-answer count after this review (0 if it was a lapse). */
  repetition: number;
  /** New ease factor, clamped to [MIN_EASE_FACTOR, MAX_EASE_FACTOR]. */
  easeFactor: number;
  /** New interval (days) until the next review. */
  intervalDays: number;
}

export class InvalidSm2QualityError extends Error {
  constructor(quality: number) {
    super(`SM-2 quality must be an integer between 0 and 5, got: ${quality}`);
    this.name = 'InvalidSm2QualityError';
  }
}

/**
 * Textbook SuperMemo-2 algorithm. Deliberately has no repository/HTTP
 * dependencies — it's a pure state-transition function, which is what makes
 * it cheap to unit test exhaustively (see sm2.service.spec.ts) without
 * touching a database or bootstrapping Nest's DI container.
 *
 * App-specific concerns (deriving `status`, writing to user_progress,
 * logging review_history, XP/streak) live in ProgressService, one layer up
 * — keeping this class a faithful, unmodified implementation of the
 * published algorithm.
 */
@Injectable()
export class Sm2Service {
  static readonly MIN_EASE_FACTOR = 1.3;
  // user_progress.ease_factor is DECIMAL(5,4) — 1 digit before the decimal
  // point, so 9.9999 is the largest value the column can physically hold.
  // The schema comment documents the range as [1.3, ∞); this clamp keeps us
  // from ever attempting to write a value MySQL would reject.
  static readonly MAX_EASE_FACTOR = 9.9999;
  static readonly PASSING_QUALITY = 3;

  calculate(input: Sm2Input): Sm2Result {
    this.assertValidQuality(input.quality);

    const isCorrect = input.quality >= Sm2Service.PASSING_QUALITY;

    let repetition: number;
    let intervalDays: number;

    if (isCorrect) {
      repetition = input.repetition + 1;
      if (input.repetition === 0) {
        intervalDays = 1;
      } else if (input.repetition === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(input.previousIntervalDays * input.easeFactor);
      }
    } else {
      // Lapse: start the interval ladder over. Ease factor still gets
      // penalized below rather than reset — a word that's lapsed once
      // after 20 successful reviews shouldn't relearn as slowly as a
      // genuinely new word.
      repetition = 0;
      intervalDays = 1;
    }

    const easeFactor = this.nextEaseFactor(input.easeFactor, input.quality);

    return { repetition, easeFactor, intervalDays };
  }

  private nextEaseFactor(previousEaseFactor: number, quality: number): number {
    const raw = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    const clamped = Math.min(Math.max(raw, Sm2Service.MIN_EASE_FACTOR), Sm2Service.MAX_EASE_FACTOR);
    // Round to 4 decimal places to match the DECIMAL(5,4) column exactly —
    // otherwise tiny floating-point drift accumulates silently across
    // hundreds of reviews, and re-hydrated values (rounded by MySQL on
    // write) would stop matching what this function computes in memory.
    return Math.round(clamped * 10000) / 10000;
  }

  private assertValidQuality(quality: number): void {
    if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
      throw new InvalidSm2QualityError(quality);
    }
  }
}
