import { computeStreakUpdate, type StreakState } from './streak';

function state(overrides: Partial<StreakState> = {}): StreakState {
  return {
    streakCurrent: 0,
    streakLongest: 0,
    streakLastStudiedDate: null,
    streakFreezes: 0,
    ...overrides,
  };
}

describe('computeStreakUpdate', () => {
  it('starts a streak at 1 on the very first study day', () => {
    const result = computeStreakUpdate(state(), '2026-01-01');
    expect(result).toEqual({
      streakCurrent: 1,
      streakLongest: 1,
      streakLastStudiedDate: '2026-01-01',
      streakFreezes: 0,
    });
  });

  it('is idempotent for repeated calls on the same day', () => {
    const afterFirstCall = computeStreakUpdate(state(), '2026-01-01');
    const afterSecondCall = computeStreakUpdate(afterFirstCall, '2026-01-01');
    expect(afterSecondCall).toEqual(afterFirstCall);
  });

  it('increments the streak on a consecutive day', () => {
    const day1 = state({ streakCurrent: 1, streakLongest: 1, streakLastStudiedDate: '2026-01-01' });
    const result = computeStreakUpdate(day1, '2026-01-02');
    expect(result.streakCurrent).toBe(2);
    expect(result.streakLongest).toBe(2);
    expect(result.streakLastStudiedDate).toBe('2026-01-02');
  });

  it('keeps streakLongest unchanged once current streak resets below it', () => {
    const brokenStreak = state({
      streakCurrent: 1,
      streakLongest: 10,
      streakLastStudiedDate: '2026-01-01',
      streakFreezes: 0,
    });
    // Gap of 3 days, no freezes to cover it -> resets
    const result = computeStreakUpdate(brokenStreak, '2026-01-04');
    expect(result.streakCurrent).toBe(1);
    expect(result.streakLongest).toBe(10);
  });

  it('resets the streak when a day is missed with no freezes available', () => {
    const current = state({
      streakCurrent: 5,
      streakLongest: 5,
      streakLastStudiedDate: '2026-01-01',
      streakFreezes: 0,
    });
    const result = computeStreakUpdate(current, '2026-01-03'); // 1 day missed
    expect(result.streakCurrent).toBe(1);
    expect(result.streakFreezes).toBe(0);
  });

  it('spends exactly one freeze to bridge a single missed day', () => {
    const current = state({
      streakCurrent: 5,
      streakLongest: 5,
      streakLastStudiedDate: '2026-01-01',
      streakFreezes: 2,
    });
    const result = computeStreakUpdate(current, '2026-01-03'); // 1 day missed
    expect(result.streakCurrent).toBe(6);
    expect(result.streakLongest).toBe(6);
    expect(result.streakFreezes).toBe(1);
  });

  it('spends multiple freezes to bridge multiple missed days', () => {
    const current = state({
      streakCurrent: 5,
      streakLongest: 5,
      streakLastStudiedDate: '2026-01-01',
      streakFreezes: 2,
    });
    const result = computeStreakUpdate(current, '2026-01-04'); // 2 days missed
    expect(result.streakCurrent).toBe(6);
    expect(result.streakFreezes).toBe(0);
  });

  it('does not spend any freezes when there are not enough to cover the gap', () => {
    const current = state({
      streakCurrent: 5,
      streakLongest: 5,
      streakLastStudiedDate: '2026-01-01',
      streakFreezes: 1,
    });
    const result = computeStreakUpdate(current, '2026-01-04'); // 2 days missed, only 1 freeze
    expect(result.streakCurrent).toBe(1);
    expect(result.streakFreezes).toBe(1); // untouched — didn't save the streak, so not spent
  });
});
