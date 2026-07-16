/**
 * XP awarded per SM-2 quality (0–5). Even a lapse earns a small amount —
 * keeps a failed review from feeling like pure punishment — but a clean,
 * fast recall earns meaningfully more.
 */
export const XP_BY_QUALITY: Record<number, number> = {
  0: 1,
  1: 2,
  2: 3,
  3: 8,
  4: 12,
  5: 16,
};

export function xpForQuality(quality: number): number {
  return XP_BY_QUALITY[quality] ?? 0;
}

/**
 * Classic quadratic leveling curve: level n starts at (n-1)^2 * 100 XP.
 * Level 1: 0 XP, level 2: 100 XP, level 3: 400 XP, level 4: 900 XP, ...
 * Chosen so each level takes progressively (but not punishingly) longer.
 */
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
  progressFraction: number; // 0–1, how far through the current level
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
