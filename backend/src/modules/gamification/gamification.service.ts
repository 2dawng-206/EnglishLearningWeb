import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ReviewHistory } from '../progress/entities/review-history.entity';
import { calculateLevel, xpForQuality } from './xp-level';
import { computeStreakUpdate, todayDateString } from './streak';
import type { DailyActivity } from './daily-activity.type';

const ACTIVITY_WINDOW_DAYS = 7;
const MS_PER_MINUTE = 60_000;

export interface RecordReviewParams {
  userId: number;
  quality: number;
  justMastered: boolean;
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(ReviewHistory)
    private readonly reviewHistoryRepository: Repository<ReviewHistory>,
  ) {}

  /**
   * Must be called with the SAME transactional EntityManager that
   * ProgressService.submitReview() uses for its own writes — XP/streak
   * updates and the review they're derived from need to commit together.
   */
  async recordReview(manager: EntityManager, params: RecordReviewParams): Promise<void> {
    const user = await manager.findOneOrFail(User, { where: { id: params.userId } });

    const newXp = user.xp + xpForQuality(params.quality);
    const streakUpdate = computeStreakUpdate(user, todayDateString());

    await manager.update(User, params.userId, {
      xp: newXp,
      level: calculateLevel(newXp),
      streakCurrent: streakUpdate.streakCurrent,
      streakLongest: streakUpdate.streakLongest,
      streakLastStudiedDate: streakUpdate.streakLastStudiedDate,
      streakFreezes: streakUpdate.streakFreezes,
      statTotalAnswers: user.statTotalAnswers + 1,
      statCorrectAnswers: user.statCorrectAnswers + (params.quality >= 3 ? 1 : 0),
      statWordsLearned: user.statWordsLearned + (params.justMastered ? 1 : 0),
    });
  }

  /** Called once per finished study session (not per card) — see the frontend's useStudySession. */
  async recordSessionComplete(userId: number, durationMs: number): Promise<void> {
    const minutesStudied = Math.max(1, Math.round(durationMs / MS_PER_MINUTE));
    // Atomic increments — no read-modify-write race here, unlike recordReview
    // which needs the current streak state to compute its next state anyway.
    await this.usersRepository.increment({ id: userId }, 'statReviewSessions', 1);
    await this.usersRepository.increment({ id: userId }, 'statStudyTimeMinutes', minutesStudied);
  }

  async getWeeklyActivity(userId: number): Promise<DailyActivity[]> {
    const windowStart = new Date();
    windowStart.setUTCDate(windowStart.getUTCDate() - (ACTIVITY_WINDOW_DAYS - 1));
    windowStart.setUTCHours(0, 0, 0, 0);

    const rows = await this.reviewHistoryRepository
      .createQueryBuilder('review')
      .innerJoin('review.userProgress', 'progress')
      .select('DATE(review.reviewedAt)', 'date')
      .addSelect('COUNT(*)', 'totalReviews')
      .addSelect('SUM(CASE WHEN review.quality >= 3 THEN 1 ELSE 0 END)', 'correctReviews')
      .where('progress.userId = :userId', { userId })
      .andWhere('review.reviewedAt >= :windowStart', { windowStart })
      .groupBy('DATE(review.reviewedAt)')
      .getRawMany<{ date: string; totalReviews: string; correctReviews: string }>();

    const byDate = new Map(
      rows.map((row) => [
        // mysql2 can return DATE() results as a Date object or a string
        // depending on driver config — normalize defensively either way.
        typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().slice(0, 10),
        { totalReviews: Number(row.totalReviews), correctReviews: Number(row.correctReviews) },
      ]),
    );

    // Always return exactly ACTIVITY_WINDOW_DAYS entries, zero-filled, so
    // the chart has a consistent shape even on days with no activity.
    const days: DailyActivity[] = [];
    for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
      const day = new Date();
      day.setUTCDate(day.getUTCDate() - i);
      const dateString = day.toISOString().slice(0, 10);
      const found = byDate.get(dateString);
      days.push({
        date: dateString,
        totalReviews: found?.totalReviews ?? 0,
        correctReviews: found?.correctReviews ?? 0,
      });
    }
    return days;
  }
}
