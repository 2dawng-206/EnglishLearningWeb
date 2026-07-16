import { apiClient } from '../../services/api-client';
import type { DailyActivity } from '../../types/gamification';

export async function fetchWeeklyActivity(): Promise<DailyActivity[]> {
  const { data } = await apiClient.get<DailyActivity[]>('/gamification/weekly-activity');
  return data;
}

export async function completeSession(durationMs: number): Promise<void> {
  await apiClient.post('/gamification/session-complete', { durationMs });
}
