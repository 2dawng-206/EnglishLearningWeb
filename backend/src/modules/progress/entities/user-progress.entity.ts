import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Word } from '../../words/entities/word.entity';
import { ReviewHistory } from './review-history.entity';
import { DecimalColumnTransformer } from '../../../common/transformers/decimal.transformer';

export enum ProgressStatus {
  NEW = 'new',
  LEARNING = 'learning',
  REVIEWING = 'reviewing',
  MASTERED = 'mastered',
}

@Entity('user_progress')
@Unique('uq_user_word', ['userId', 'wordId'])
// ★ Most critical index — powers every "fetch due cards" study-session query
@Index('idx_due_cards', ['userId', 'nextReviewDate', 'status', 'isIgnored'])
@Index('idx_user_status', ['userId', 'status'])
export class UserProgress {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ name: 'word_id', type: 'int', unsigned: true })
  wordId: number;

  // ── SM-2 state ──────────────────────────────────────────
  @Column({ name: 'interval_days', type: 'int', unsigned: true, default: 1 })
  intervalDays: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  repetition: number;

  @Column({
    name: 'ease_factor',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 2.5,
    transformer: DecimalColumnTransformer, // DECIMAL -> string from mysql2; cast back to number
  })
  easeFactor: number; // documented range [1.3, ∞) — see note in chat re: DECIMAL(5,4) ceiling

  // No ON UPDATE clause in the schema — this is intentionally NOT an
  // @UpdateDateColumn(). The SM-2 service (Phase 3) recalculates this
  // explicitly; if it were an UpdateDateColumn, ANY unrelated update to this
  // row (e.g. toggling is_favorited) would silently reset the review schedule.
  @Column({ name: 'next_review_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  nextReviewDate: Date;

  @Column({ name: 'last_review_date', type: 'datetime', nullable: true })
  lastReviewDate: Date | null;

  @Column({ type: 'enum', enum: ProgressStatus, default: ProgressStatus.NEW })
  status: ProgressStatus;

  // ── Pre-computed aggregates ──────────────────────────────
  @Column({ name: 'total_reviews', type: 'int', unsigned: true, default: 0 })
  totalReviews: number;

  @Column({ name: 'correct_reviews', type: 'int', unsigned: true, default: 0 })
  correctReviews: number;

  // ── User flags ────────────────────────────────────────────
  @Column({ name: 'is_favorited', type: 'boolean', default: false })
  isFavorited: boolean;

  @Column({ name: 'is_ignored', type: 'boolean', default: false })
  isIgnored: boolean;

  // Same DEFAULT CURRENT_TIMESTAMP semantics as created_at, but a distinct
  // domain concept ("when this word was added to the user's list") — kept
  // as a plain column rather than reusing @CreateDateColumn.
  @Column({ name: 'added_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  // ─── Relations ──────────────────────────────────────────
  @ManyToOne(() => User, (user) => user.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // RESTRICT, not CASCADE — preserves learning history if a word is later
  // unpublished/removed. Must be set explicitly; TypeORM won't infer this
  // from the referenced column.
  @ManyToOne(() => Word, (word) => word.userProgress, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'word_id' })
  word: Word;

  @OneToMany(() => ReviewHistory, (history) => history.userProgress)
  reviewHistory: ReviewHistory[];
}
