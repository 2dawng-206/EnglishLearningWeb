import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

interface SessionSummaryProps {
  correct: number;
  total: number;
}

export function SessionSummary({ correct, total }: SessionSummaryProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-paper-300 bg-white px-8 py-12 text-center">
      <div>
        <p className="font-display text-3xl font-semibold text-ink-950">Session complete</p>
        <p className="mt-2 font-mono text-lg text-amber-600">
          {correct}/{total} correct ({accuracy}%)
        </p>
      </div>
      <div className="flex gap-3">
        <Link to="/study">
          <Button variant="secondary">Back to Study</Button>
        </Link>
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
