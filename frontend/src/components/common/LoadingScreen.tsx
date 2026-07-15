export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-50">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-amber-400"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
