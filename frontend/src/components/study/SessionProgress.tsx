export function SessionProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm text-ink-700">
        {Math.min(current + 1, total)} / {total}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-300">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${(Math.min(current, total) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
