export interface StreakState {
  streakCurrent: number;
  streakLongest: number;
  streakLastStudiedDate: string | null; // 'YYYY-MM-DD', matches the DATE column
  streakFreezes: number;
}

/**
 * "Today" is always the server's UTC calendar date — there's no per-user
 * timezone column in the schema, so a study session right around local
 * midnight could theoretically land on the "wrong" side of the boundary
 * for someone far from UTC. A known, documented simplification rather than
 * an attempt at full timezone-aware streaks.
 */
export function todayDateString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function daysBetween(earlier: string, later: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const earlierMs = Date.parse(`${earlier}T00:00:00Z`);
  const laterMs = Date.parse(`${later}T00:00:00Z`);
  return Math.round((laterMs - earlierMs) / msPerDay);
}

/**
 * Call once per completed review. Idempotent for repeat calls on the same
 * calendar day — studying 20 times today doesn't increment the streak 20
 * times, only the first call each day changes anything.
 */
export function computeStreakUpdate(current: StreakState, today: string): StreakState {
  if (!current.streakLastStudiedDate) {
    return {
      streakCurrent: 1,
      streakLongest: Math.max(current.streakLongest, 1),
      streakLastStudiedDate: today,
      streakFreezes: current.streakFreezes,
    };
  }

  const gap = daysBetween(current.streakLastStudiedDate, today);

  if (gap <= 0) {
    // Already studied today (or a clock oddity puts "today" before the
    // stored date) — leave the streak untouched either way.
    return current;
  }

  if (gap === 1) {
    const streakCurrent = current.streakCurrent + 1;
    return {
      streakCurrent,
      streakLongest: Math.max(current.streakLongest, streakCurrent),
      streakLastStudiedDate: today,
      streakFreezes: current.streakFreezes,
    };
  }

  // gap >= 2: missed (gap - 1) full calendar days. Spend one freeze per
  // missed day to keep the streak alive, Duolingo-style.
  const missedDays = gap - 1;
  if (current.streakFreezes >= missedDays) {
    const streakCurrent = current.streakCurrent + 1;
    return {
      streakCurrent,
      streakLongest: Math.max(current.streakLongest, streakCurrent),
      streakLastStudiedDate: today,
      streakFreezes: current.streakFreezes - missedDays,
    };
  }

  // Not enough freezes — the streak resets, but freezes aren't spent since
  // they didn't save it.
  return {
    streakCurrent: 1,
    streakLongest: current.streakLongest,
    streakLastStudiedDate: today,
    streakFreezes: current.streakFreezes,
  };
}
