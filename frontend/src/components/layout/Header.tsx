import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/auth-store";
import { logout } from "../../features/auth/auth-api";
import { Button } from "../common/Button";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex items-center justify-between border-b border-paper-300 bg-paper-50 px-6 py-4 dark:border-ink-700 dark:bg-ink-900">
      <span className="font-display text-xl font-semibold text-ink-950 dark:text-paper-100">
        VocabMaster
      </span>

      {user && (
        <div className="flex items-center gap-5">
          <div className="hidden font-mono text-sm text-ink-700 sm:flex sm:items-center sm:gap-3 dark:text-paper-300">
            <span title="Current streak">🔥 {user.streakCurrent}d</span>
            <span title="Total XP" className="text-amber-600">
              {user.xp} XP
            </span>
          </div>
          <span className="font-body text-sm text-ink-800 dark:text-paper-100">
            {user.username}
          </span>
          <Button
            variant="secondary"
            onClick={handleLogout}
            className="!px-3 !py-1.5 !text-sm"
          >
            Log out
          </Button>
        </div>
      )}
    </header>
  );
}
