import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserProgress } from '../../progress/entities/user-progress.entity';

export enum UserTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum PreferredDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  MIXED = 'mixed',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
@Index('idx_role', ['role'])
@Index('idx_active', ['isActive'])
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // Hashed password — select:false so it's never returned by a plain find().
  // Fetch explicitly in the auth flow (Phase 2), e.g.:
  //   userRepo.createQueryBuilder('user').addSelect('user.password')...
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  // ── Gamification ────────────────────────────────────────
  @Column({ type: 'int', unsigned: true, default: 0 })
  xp: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  level: number;

  // ── Streak ───────────────────────────────────────────────
  @Column({ name: 'streak_current', type: 'smallint', unsigned: true, default: 0 })
  streakCurrent: number;

  @Column({ name: 'streak_longest', type: 'smallint', unsigned: true, default: 0 })
  streakLongest: number;

  // DATE (not DATETIME) — mysql2 returns this as 'YYYY-MM-DD' string by
  // default. Keep it a string end-to-end for streak-diff logic to avoid
  // local-timezone off-by-one bugs that creep in once it's parsed as a JS Date.
  @Column({ name: 'streak_last_studied_date', type: 'date', nullable: true })
  streakLastStudiedDate: string | null;

  @Column({ name: 'streak_freezes', type: 'tinyint', unsigned: true, default: 0 })
  streakFreezes: number;

  // ── Aggregated stats (pre-computed for fast dashboard reads) ─
  @Column({ name: 'stat_words_learned', type: 'int', unsigned: true, default: 0 })
  statWordsLearned: number;

  @Column({ name: 'stat_review_sessions', type: 'int', unsigned: true, default: 0 })
  statReviewSessions: number;

  @Column({ name: 'stat_study_time_minutes', type: 'int', unsigned: true, default: 0 })
  statStudyTimeMinutes: number;

  @Column({ name: 'stat_correct_answers', type: 'int', unsigned: true, default: 0 })
  statCorrectAnswers: number;

  @Column({ name: 'stat_total_answers', type: 'int', unsigned: true, default: 0 })
  statTotalAnswers: number;

  // ── Settings ─────────────────────────────────────────────
  @Column({ name: 'setting_daily_goal', type: 'smallint', unsigned: true, default: 10 })
  settingDailyGoal: number;

  @Column({ name: 'setting_new_words_per_day', type: 'smallint', unsigned: true, default: 5 })
  settingNewWordsPerDay: number;

  @Column({ name: 'setting_reviews_per_day', type: 'smallint', unsigned: true, default: 20 })
  settingReviewsPerDay: number;

  @Column({ name: 'setting_notifications_enabled', type: 'boolean', default: true })
  settingNotificationsEnabled: boolean;

  @Column({ name: 'setting_sound_enabled', type: 'boolean', default: true })
  settingSoundEnabled: boolean;

  @Column({ name: 'setting_theme', type: 'enum', enum: UserTheme, default: UserTheme.SYSTEM })
  settingTheme: UserTheme;

  @Column({
    name: 'setting_preferred_difficulty',
    type: 'enum',
    enum: PreferredDifficulty,
    default: PreferredDifficulty.MIXED,
  })
  settingPreferredDifficulty: PreferredDifficulty;

  // ── Auth secrets — select:false, only fetched explicitly when needed ──
  @Column({ name: 'refresh_token', type: 'varchar', length: 512, nullable: true, select: false })
  refreshToken: string | null;

  // Not a secret (just a status flag) — deliberately NOT select:false,
  // unlike refresh_token/password_reset_* below.
  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordResetToken: string | null;

  @Column({ name: 'password_reset_expires', type: 'datetime', nullable: true, select: false })
  passwordResetExpires: Date | null;

  // ── Account meta ─────────────────────────────────────────
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  // ─── Relations ──────────────────────────────────────────
  @OneToMany(() => UserProgress, (progress) => progress.user)
  progress: UserProgress[];
}
