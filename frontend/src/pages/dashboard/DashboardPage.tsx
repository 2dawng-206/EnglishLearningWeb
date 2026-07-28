import { useAuthStore } from "../../features/auth/auth-store";

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
    </div>
  );
}
