import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { ReviewHistory } from "../progress/entities/review-history.entity";
import { UserProgress } from "../progress/entities/user-progress.entity";
import { Sm2Service } from "../progress/sm2/sm2.service";
import { xpForQuality, calculateLevel } from "./xp-level";
import { computeStreakUpdate, todayDateString, StreakState } from "./streak";
import { DailyActivity } from "./daily-activity.type";

const WEEKLY_WINDOW_DAYS = 7;

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async recordReview(
    manager: EntityManager,
    userId: number,
    quality: number,
    isCorrect: boolean,
    justMastered: boolean,
  ): Promise<void> {
    const user = await manager.findOneByOrFail(User, { id: userId });

    const currentStreak: StreakState = {
      streakCurrent: user.streakCurrent,
      streakLongest: user.streakLongest,
      streakLastStudiedDate: user.streakLastStudiedDate,
      streakFreezes: user.streakFreezes,
    };
    const updatedStreak = computeStreakUpdate(currentStreak, todayDateString());

    user.xp += xpForQuality(quality);
    user.level = calculateLevel(user.xp);
    user.streakCurrent = updatedStreak.streakCurrent;
    user.streakLongest = updatedStreak.streakLongest;
    user.streakLastStudiedDate = updatedStreak.streakLastStudiedDate;
    user.streakFreezes = updatedStreak.streakFreezes;
    user.statTotalAnswers += 1;
    if (isCorrect) user.statCorrectAnswers += 1;
    if (justMastered) user.statWordsLearned += 1;

    await manager.save(user);
  }

  async recordSessionComplete(
    userId: number,
    durationMs: number,
  ): Promise<void> {
    const minutes = Math.max(1, Math.round(durationMs / 60_000));
    await this.userRepo.increment({ id: userId }, "statReviewSessions", 1);
    await this.userRepo.increment(
      { id: userId },
      "statStudyTimeMinutes",
      minutes,
    );
  }

  /**
   * Last 7 calendar UTC days (including today), zero-filled so the chart
   * always has a consistent 7-entry shape even on days with no activity.
   * "Correct" vs "missed" is derived from quality >= PASSING_QUALITY, the
   * same threshold ProgressService.submitReview() already uses.
   */
  async getWeeklyActivity(userId: number): Promise<DailyActivity[]> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (WEEKLY_WINDOW_DAYS - 1));
    since.setUTCHours(0, 0, 0, 0);

    const rows: { date: string | Date; total: string; correct: string }[] =
      await this.userRepo.manager
        .createQueryBuilder(ReviewHistory, "rh")
        .innerJoin(UserProgress, "up", "up.id = rh.userProgressId")
        .select("DATE(rh.reviewedAt)", "date")
        .addSelect("COUNT(*)", "total")
        .addSelect(
          `SUM(CASE WHEN rh.quality >= :passing THEN 1 ELSE 0 END)`,
          "correct",
        )
        .where("up.userId = :userId", { userId })
        .andWhere("rh.reviewedAt >= :since", { since })
        .setParameter("passing", Sm2Service.PASSING_QUALITY)
        .groupBy("DATE(rh.reviewedAt)")
        .getRawMany();

    const byDate = new Map<string, { total: number; correct: number }>();
    for (const row of rows) {
      const dateStr =
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : String(row.date);
      byDate.set(dateStr, {
        total: Number(row.total),
        correct: Number(row.correct),
      });
    }

    const result: DailyActivity[] = [];
    for (let i = WEEKLY_WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = byDate.get(dateStr);
      result.push({
        date: dateStr,
        totalReviews: entry?.total ?? 0,
        correctReviews: entry?.correct ?? 0,
      });
    }

    return result;
  }
}
