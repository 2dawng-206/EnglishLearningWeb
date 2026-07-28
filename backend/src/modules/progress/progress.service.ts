import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  LessThanOrEqual,
  QueryFailedError,
  Repository,
} from "typeorm";
import { UserProgress, ProgressStatus } from "./entities/user-progress.entity";
import { ReviewHistory } from "./entities/review-history.entity";
import { Sm2Service } from "./sm2/sm2.service";
import { SubmitReviewDto } from "./dto/submit-review.dto";
import { UpdateProgressFlagsDto } from "./dto/update-progress-flags.dto";
import { GamificationService } from "../gamification/gamification.service";

const MYSQL_DUP_ENTRY = 1062;
const MASTERED_INTERVAL_DAYS = 90;

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepository: Repository<UserProgress>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sm2Service: Sm2Service,
    private readonly gamificationService: GamificationService,
  ) {}

  async startLearning(userId: number, wordId: number): Promise<UserProgress> {
    const existing = await this.progressRepository.findOne({
      where: { userId, wordId },
    });
    if (existing) return existing;

    const progress = this.progressRepository.create({
      userId,
      wordId,
      status: ProgressStatus.NEW,
    });

    try {
      return await this.progressRepository.save(progress);
    } catch (error) {
      const errno = (
        error as QueryFailedError & { driverError?: { errno?: number } }
      ).driverError?.errno;
      if (error instanceof QueryFailedError && errno === MYSQL_DUP_ENTRY) {
        return this.getOne(userId, wordId);
      }
      throw error;
    }
  }

  findDueCards(userId: number, limit: number): Promise<UserProgress[]> {
    return this.progressRepository.find({
      where: {
        userId,
        isIgnored: false,
        nextReviewDate: LessThanOrEqual(new Date()),
      },
      relations: { word: { definitions: true } },
      order: { nextReviewDate: "ASC" },
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

  async submitReview(
    userId: number,
    wordId: number,
    dto: SubmitReviewDto,
  ): Promise<UserProgress> {
    const progress = await this.progressRepository.findOne({
      where: { userId, wordId },
    });
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
    const newStatus = this.deriveStatus(repetition, intervalDays, totalReviews);
    const justMastered =
      newStatus === ProgressStatus.MASTERED &&
      progress.status !== ProgressStatus.MASTERED;

    await this.dataSource.transaction(async (manager) => {
      await manager.update(UserProgress, progress.id, {
        repetition,
        easeFactor,
        intervalDays,
        nextReviewDate,
        lastReviewDate: now,
        status: newStatus,
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

      // XP / streak / stat_* updates — same transaction/manager so a
      // rollback here also rolls back the review+schedule writes above.
      await this.gamificationService.recordReview(
        manager,
        userId,
        dto.quality,
        isCorrect,
        justMastered,
      );
    });

    return this.getOne(userId, wordId);
  }

  async setFlags(
    userId: number,
    wordId: number,
    dto: UpdateProgressFlagsDto,
  ): Promise<UserProgress> {
    const progress = await this.progressRepository.findOne({
      where: { userId, wordId },
    });
    if (!progress) {
      throw new NotFoundException(`Not learning word #${wordId} yet`);
    }
    await this.progressRepository.update(progress.id, dto);
    return this.getOne(userId, wordId);
  }

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
