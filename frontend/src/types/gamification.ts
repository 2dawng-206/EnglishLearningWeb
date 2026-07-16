// Mirrors backend/src/modules/gamification/daily-activity.type.ts

export interface DailyActivity {
  date: string; // 'YYYY-MM-DD'
  totalReviews: number;
  correctReviews: number;
}
