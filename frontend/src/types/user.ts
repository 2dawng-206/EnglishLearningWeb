// Mirrors backend/src/modules/users/entities/user.entity.ts — public-safe
// fields only (password/refreshToken/passwordReset* are select:false on the
// API side and never come back in a response body).

// String-literal unions instead of `enum`: the frontend tsconfig has
// `erasableSyntaxOnly: true` (real TS enums compile to a runtime object,
// which isn't "erasable" syntax), so this is the required pattern here —
// not just a style preference.
export type UserRole = 'user' | 'admin';
export type UserTheme = 'light' | 'dark' | 'system';
export type PreferredDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  xp: number;
  level: number;
  streakCurrent: number;
  streakLongest: number;
  streakFreezes: number;
  statWordsLearned: number;
  statReviewSessions: number;
  statStudyTimeMinutes: number;
  statCorrectAnswers: number;
  statTotalAnswers: number;
  settingDailyGoal: number;
  settingNewWordsPerDay: number;
  settingReviewsPerDay: number;
  settingNotificationsEnabled: boolean;
  settingSoundEnabled: boolean;
  settingTheme: UserTheme;
  settingPreferredDifficulty: PreferredDifficulty;
  isEmailVerified: boolean;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
