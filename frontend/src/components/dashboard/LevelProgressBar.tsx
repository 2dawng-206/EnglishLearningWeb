import { getLevelProgress } from '../../utils/xp-level';

export function LevelProgressBar({ xp }: { xp: number }) {
  const progress = getLevelProgress(xp);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-lg font-semibold text-ink-950">
          Level {progress.level}
        </span>
        <span className="font-mono text-xs text-ink-700">
          {progress.xpIntoLevel} / {progress.xpNeededForLevel} XP
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-300">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${Math.min(progress.progressFraction * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
