import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, QueryFailedError, Repository } from 'typeorm';
import { UserProgress, ProgressStatus } from './entities/user-progress.entity';
import { ReviewHistory } from './entities/review-history.entity';
import { Sm2Service } from './sm2/sm2.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { UpdateProgressFlagsDto } from './dto/update-progress-flags.dto';

// MySQL errno 1062 = ER_DUP_ENTRY. Hit here if two "start learning" requests
// for the same (user_id, word_id) race each other — uq_user_word catches it.
const MYSQL_DUP_ENTRY = 1062;

// A word graduates to "mastered" once its interval reaches this many days —
// not part of the SM-2 spec itself, just this app's own status labeling.
const MASTERED_INTERVAL_DAYS = 90;

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(UserProgress) private readonly progressRepository: Repository<UserProgress>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sm2Service: Sm2Service,
  ) {}

  /** Adds a word to the user's list. Idempotent — calling it twice just returns the existing row. */
  async startLearning(userId: number, wordId: number): Promise<UserProgress> {
    const existing = await this.progressRepository.findOne({ where: { userId, wordId } });
    if (existing) return existing;

    // interval_days / repetition / ease_factor / next_review_date all take
    // their schema defaults (1 / 0 / 2.5000 / CURRENT_TIMESTAMP) — nothing
    // needs setting explicitly for a brand-new card.
    const progress = this.progressRepository.create({ userId, wordId, status: ProgressStatus.NEW });

    try {
      return await this.progressRepository.save(progress);
    } catch (error) {
      const errno = (error as QueryFailedError & { driverError?: { errno?: number } }).driverError
        ?.errno;
      if (error instanceof QueryFailedError && errno === MYSQL_DUP_ENTRY) {
        // Lost a race with a concurrent identical request — just return
        // what's there now rather than surfacing a spurious error.
        return this.getOne(userId, wordId);
      }
      throw error;
    }
  }

  /** Cards due for review right now, ordered soonest-first. Powers the idx_due_cards index. */
  findDueCards(userId: number, limit: number): Promise<UserProgress[]> {
    return this.progressRepository.find({
      where: {
        userId,
        isIgnored: false,
        nextReviewDate: LessThanOrEqual(new Date()),
      },
      relations: { word: { definitions: true } },
      order: { nextReviewDate: 'ASC' },
      take: limit,
    });
  }

  async getOne(userId: number, wordId: number): Promise<UserProgress> {
    const progress = await this.progressRepository.findOne({
      where: { userId, wordId },
      relations: { word: { definitions: true } },
    });
    if (!progress) {
      throw new NotFoundException(
        `Not learning word #${wordId} yet — call POST /progress first.`,
      );
    }
    return progress;
  }

  async submitReview(userId: number, wordId: number, dto: SubmitReviewDto): Promise<UserProgress> {
    const progress = await this.progressRepository.findOne({ where: { userId, wordId } });
    if (!progress) {
      throw new NotFoundException(
        `Word #${wordId} isn't in your learning list yet — call POST /progress first.`,
      );
    }

    const { repetition, easeFactor, intervalDays } = this.sm2Service.calculate({
      quality: dto.quality,
      repetition: progress.repetition,
      easeFactor: progress.easeFactor,
      previousIntervalDays: progress.intervalDays,
    });

    const now = new Date();
    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    const isCorrect = dto.quality >= Sm2Service.PASSING_QUALITY;
    const totalReviews = progress.totalReviews + 1;

    // Both writes commit together or not at all — a logged review with no
    // matching schedule update (or vice versa) would corrupt the SM-2 state.
    await this.dataSource.transaction(async (manager) => {
      await manager.update(UserProgress, progress.id, {
        repetition,
        easeFactor,
        intervalDays,
        nextReviewDate,
        lastReviewDate: now,
        status: this.deriveStatus(repetition, intervalDays, totalReviews),
        totalReviews,
        correctReviews: progress.correctReviews + (isCorrect ? 1 : 0),
      });

      await manager.save(
        manager.create(ReviewHistory, {
          userProgressId: progress.id,
          quality: dto.quality,
          reviewedAt: now,
          timeTakenMs: dto.timeTakenMs,
          sessionType: dto.sessionType,
        }),
      );

      // XP / streak / stat_* updates on the User row hook in here — Phase 6,
      // not built yet. Deliberately not touching users.xp etc. in this phase.
    });

    // Read the fresh, relation-loaded state *after* the transaction commits
    // — same reasoning as WordsService: reading through this.progressRepository
    // from inside the callback above would use a different DB connection.
    return this.getOne(userId, wordId);
  }

  async setFlags(userId: number, wordId: number, dto: UpdateProgressFlagsDto): Promise<UserProgress> {
    const progress = await this.progressRepository.findOne({ where: { userId, wordId } });
    if (!progress) {
      throw new NotFoundException(`Not learning word #${wordId} yet`);
    }
    await this.progressRepository.update(progress.id, dto);
    return this.getOne(userId, wordId);
  }

  /**
   * App-specific status labeling — not part of SM-2 itself, which is why it
   * lives here rather than in Sm2Service. A lapsed word that had built up a
   * long streak drops back to `learning`, never all the way to `new`
   * (which is reserved for "never reviewed at all").
   */
  private deriveStatus(
    repetition: number,
    intervalDays: number,
    totalReviews: number,
  ): ProgressStatus {
    if (totalReviews === 0) return ProgressStatus.NEW;
    if (repetition < 2) return ProgressStatus.LEARNING;
    if (intervalDays >= MASTERED_INTERVAL_DAYS) return ProgressStatus.MASTERED;
    return ProgressStatus.REVIEWING;
  }
}
