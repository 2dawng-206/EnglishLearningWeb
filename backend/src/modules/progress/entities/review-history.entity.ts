import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { UserProgress } from './user-progress.entity';

export enum SessionType {
  FLASHCARD = 'flashcard',
  MULTIPLE_CHOICE = 'multiple_choice',
  TYPING = 'typing',
  PRONUNCIATION = 'pronunciation',
}

@Entity('review_history')
@Check('chk_quality', 'quality BETWEEN 0 AND 5')
@Index('idx_rh_progress', ['userProgressId'])
// The raw SQL sorts idx_rh_reviewed_at with `reviewed_at DESC`. TypeORM's
// @Index() decorator has no per-column sort-direction option, so DESC isn't
// re-declared here — it's already physically in the DB from the SQL script.
// If you ever regenerate the schema via `synchronize`, re-add DESC via a
// manual migration.
@Index('idx_rh_reviewed_at', ['userProgressId', 'reviewedAt'])
export class ReviewHistory {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_progress_id', type: 'int', unsigned: true })
  userProgressId: number;

  @Column({ type: 'tinyint', unsigned: true })
  quality: number; // SM-2 quality 0–5, enforced by chk_quality CHECK constraint

  @Column({ name: 'reviewed_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  reviewedAt: Date;

  @Column({ name: 'time_taken_ms', type: 'int', unsigned: true, nullable: true })
  timeTakenMs: number | null; // response latency (ms)

  @Column({
    name: 'session_type',
    type: 'enum',
    enum: SessionType,
    default: SessionType.FLASHCARD,
  })
  sessionType: SessionType;

  // ─── Relations ──────────────────────────────────────────
  @ManyToOne(() => UserProgress, (progress) => progress.reviewHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_progress_id' })
  userProgress: UserProgress;
}
