// The refresh token is the only thing persisted across a page reload — the
// access token deliberately lives in memory only (Zustand state), so a
// reload always re-derives a fresh one via /auth/refresh rather than trusting
// a possibly-stale value from storage.
//
// Known trade-off: localStorage is readable by any script on the page, so a
// successful XSS attack could steal this token. The backend already returns
// tokens in the JSON response body rather than as cookies (see
// backend/src/modules/auth/auth.service.ts), so this is the only place they
// *can* live client-side without a backend change. Moving to an httpOnly
// cookie for the refresh token is the natural hardening step later — it
// would remove the need for this file entirely.
const REFRESH_TOKEN_KEY = 'vocabmaster.refreshToken';

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearStoredRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
