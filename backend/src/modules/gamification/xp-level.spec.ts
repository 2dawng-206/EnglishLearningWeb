import { calculateLevel, getLevelProgress, xpForQuality, xpThresholdForLevel } from './xp-level';

describe('xpForQuality', () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 8],
    [4, 12],
    [5, 16],
  ])('quality=%i awards %i XP', (quality, expected) => {
    expect(xpForQuality(quality)).toBe(expected);
  });

  it('returns 0 for an out-of-range quality rather than throwing', () => {
    expect(xpForQuality(9)).toBe(0);
  });
});

describe('xpThresholdForLevel', () => {
  it.each([
    [1, 0],
    [2, 100],
    [3, 400],
    [4, 900],
  ])('level %i starts at %i XP', (level, expected) => {
    expect(xpThresholdForLevel(level)).toBe(expected);
  });
});

describe('calculateLevel', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [399, 2],
    [400, 3],
    [899, 3],
    [900, 4],
  ])('%i XP is level %i', (xp, expectedLevel) => {
    expect(calculateLevel(xp)).toBe(expectedLevel);
  });
});

describe('getLevelProgress', () => {
  it('reports progress partway through a level', () => {
    const progress = getLevelProgress(150);
    expect(progress.level).toBe(2);
    expect(progress.currentLevelFloorXp).toBe(100);
    expect(progress.nextLevelFloorXp).toBe(400);
    expect(progress.xpIntoLevel).toBe(50);
    expect(progress.xpNeededForLevel).toBe(300);
    expect(progress.progressFraction).toBeCloseTo(1 / 6, 5);
  });

  it('reports 0 progress right at a level boundary', () => {
    const progress = getLevelProgress(400);
    expect(progress.level).toBe(3);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.progressFraction).toBe(0);
  });
});
