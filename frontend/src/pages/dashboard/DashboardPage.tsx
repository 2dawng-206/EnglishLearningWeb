// pages/dashboard/DashboardPage.tsx
import { useEffect, useState } from "react";
import { useAuthStore } from "../../features/auth/auth-store";
import { fetchWeeklyActivity } from "../../features/gamification/gamification-api";
import { LevelProgressBar } from "../../components/dashboard/LevelProgressBar";
import { WeeklyActivityChart } from "../../components/dashboard/WeeklyActivityChart";
import type { DailyActivity } from "../../types/gamification";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <div className="rounded-xl border border-paper-300 bg-white px-5 py-4">
      <p className="font-body text-xs uppercase tracking-wide text-ink-700">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-medium ${accent ? "text-amber-600" : "text-ink-950"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[] | null>(
    null,
  );
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeeklyActivity()
      .then((data) => {
        if (!cancelled) setWeeklyActivity(data);
      })
      .catch(() => {
        if (!cancelled) setActivityError("Couldn't load weekly activity.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null; // ProtectedRoute guarantees this shouldn't happen

  const accuracy =
    user.statTotalAnswers > 0
      ? Math.round((user.statCorrectAnswers / user.statTotalAnswers) * 100)
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-950">
          Welcome back, {user.username}
        </h1>
        <p className="mt-1 font-body text-ink-700">
          Level {user.level} · {user.xp} XP
        </p>
      </div>

      <LevelProgressBar xp={user.xp} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Current streak"
          value={`${user.streakCurrent}d`}
          accent
        />
        <StatCard label="Longest streak" value={`${user.streakLongest}d`} />
        <StatCard label="Words learned" value={user.statWordsLearned} />
        <StatCard
          label="Accuracy"
          value={accuracy === null ? "—" : `${accuracy}%`}
        />
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink-950">
          This week
        </h2>
        {activityError && (
          <p className="mt-2 font-body text-sm text-red-600">{activityError}</p>
        )}
        {!activityError && !weeklyActivity && (
          <p className="mt-2 font-body text-sm text-ink-700">Loading…</p>
        )}
        {weeklyActivity && <WeeklyActivityChart data={weeklyActivity} />}
      </div>
    </div>
  );
}
