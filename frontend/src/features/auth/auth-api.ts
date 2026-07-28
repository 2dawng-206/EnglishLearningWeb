import { apiClient } from "../../services/api-client";
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from "../../services/token-storage";
import { useAuthStore } from "./auth-store";
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
} from "../../types/auth";
import type { UserProfile } from "../../types/user";


async function establishSession(tokens: AuthTokens): Promise<void> {
  setStoredRefreshToken(tokens.refreshToken);
  useAuthStore.getState().setAccessToken(tokens.accessToken);
  const { data: user } = await apiClient.get<UserProfile>("/users/me");
  useAuthStore.getState().setSession(user, tokens.accessToken);
}

export async function login(payload: LoginPayload): Promise<void> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login", payload);
  await establishSession(data);
}

export async function register(payload: RegisterPayload): Promise<void> {
  const { data } = await apiClient.post<AuthTokens>("/auth/register", payload);
  await establishSession(data);
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    // Clear client-side state regardless of whether the server call
    // succeeded — a network failure here shouldn't leave the user stuck
    // "logged in" on their own machine.
    clearStoredRefreshToken();
    useAuthStore.getState().logout();
  }
}

export interface ForgotPasswordPayload {
  email: string;
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error("Failed to send reset link");
  }
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!res.ok) {
    // Backend tra 400 khi token sai/het han -> getErrorMessage o page se bat duoc
    throw new Error("Invalid or expired reset link");
  }
}

/**
 * Runs once when the app boots. If a refresh token survived from a previous
 * visit, silently re-authenticates; otherwise just marks init as done so
 * ProtectedRoute can redirect to /login.
 */
export async function bootstrapSession(): Promise<void> {
  const storedRefreshToken = getStoredRefreshToken();
  if (!storedRefreshToken) {
    useAuthStore.getState().finishInitializing();
    return;
  }

  try {
    const { data } = await apiClient.post<AuthTokens>("/auth/refresh", null, {
      headers: { Authorization: `Bearer ${storedRefreshToken}` },
    });
    await establishSession(data);
  } catch {
    clearStoredRefreshToken();
  } finally {
    useAuthStore.getState().finishInitializing();
  }
}
