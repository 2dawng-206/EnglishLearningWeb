import { Outlet } from 'react-router-dom';
import { ForgettingCurveIllustration } from '../illustrations/ForgettingCurveIllustration';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-center gap-8 bg-ink-950 px-12 py-16 lg:flex">
        <span className="font-display text-2xl font-semibold text-paper-100">VocabMaster</span>
        <div>
          <p className="font-display text-3xl leading-snug text-paper-100">
            Words fade on their own schedule.
            <br />
            Review on that schedule, and they don't.
          </p>
          <p className="mt-4 max-w-sm font-body text-sm text-paper-300">
            Every card you answer reshapes the curve below — a correct
            answer pushes the next review further out; a missed one pulls
            it back in.
          </p>
        </div>
        <ForgettingCurveIllustration />
      </div>

      <div className="flex items-center justify-center bg-paper-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
