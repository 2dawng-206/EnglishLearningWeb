// Mirrors backend/src/modules/gamification/xp-level.ts — keep the formula
// identical on both sides, or the level shown here could disagree with
// what's actually stored (and returned by /users/me) on the backend.

export function xpThresholdForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function calculateLevel(xp: number): number {
  return Math.floor(1 + Math.sqrt(xp / 100));
}

export interface LevelProgress {
  level: number;
  currentLevelFloorXp: number;
  nextLevelFloorXp: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  progressFraction: number;
}

export function getLevelProgress(xp: number): LevelProgress {
  const level = calculateLevel(xp);
  const currentLevelFloorXp = xpThresholdForLevel(level);
  const nextLevelFloorXp = xpThresholdForLevel(level + 1);
  const xpNeededForLevel = nextLevelFloorXp - currentLevelFloorXp;
  const xpIntoLevel = xp - currentLevelFloorXp;

  return {
    level,
    currentLevelFloorXp,
    nextLevelFloorXp,
    xpIntoLevel,
    xpNeededForLevel,
    progressFraction: xpNeededForLevel > 0 ? xpIntoLevel / xpNeededForLevel : 0,
  };
}
