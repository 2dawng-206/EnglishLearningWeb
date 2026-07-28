import { apiClient } from '../../services/api-client';
import { useAuthStore } from '../auth/auth-store';
import type { PreferredDifficulty, UserProfile, UserTheme } from '../../types/user';

// Khop voi UpdateUserDto o backend (modules/users/dto/update-user.dto.ts) -
// deliberately KHONG bao gom username/email/password, nhung field do can
// luong rieng (kiem tra trung, xac thuc lai...).
export interface UpdateProfilePayload {
  avatar?: string;
  settingDailyGoal?: number;
  settingNewWordsPerDay?: number;
  settingReviewsPerDay?: number;
  settingNotificationsEnabled?: boolean;
  settingSoundEnabled?: boolean;
  settingTheme?: UserTheme;
  settingPreferredDifficulty?: PreferredDifficulty;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  const { data } = await apiClient.patch<UserProfile>('/users/me', payload);
  // Cap nhat lai user trong store de UI (Sidebar, Header, cac trang khac)
  // phan anh thay doi ngay ma khong can reload trang.
  useAuthStore.getState().setUser(data);
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  // Backend tra ve 204 No Content, khong co body.
  await apiClient.patch('/users/me/password', payload);
}
