import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../features/auth/auth-store';
import { updateProfile, type UpdateProfilePayload } from '../../features/settings/settings-api';
import { Button } from '../../components/common/Button';
import { TextField } from '../../components/common/TextField';
import { Select } from '../../components/common/Select';
import { Toggle } from '../../components/common/Toggle';
import { getErrorMessage } from '../../utils/get-error-message';
import type { PreferredDifficulty, UserTheme } from '../../types/user';

export function PreferencesForm() {
  const user = useAuthStore((state) => state.user);

  const [dailyGoal, setDailyGoal] = useState(user?.settingDailyGoal ?? 10);
  const [newWordsPerDay, setNewWordsPerDay] = useState(user?.settingNewWordsPerDay ?? 5);
  const [reviewsPerDay, setReviewsPerDay] = useState(user?.settingReviewsPerDay ?? 20);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.settingNotificationsEnabled ?? true,
  );
  const [soundEnabled, setSoundEnabled] = useState(user?.settingSoundEnabled ?? true);
  const [theme, setTheme] = useState<UserTheme>(user?.settingTheme ?? 'system');
  const [difficulty, setDifficulty] = useState<PreferredDifficulty>(
    user?.settingPreferredDifficulty ?? 'mixed',
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null; // ProtectedRoute guarantees this shouldn't happen

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const payload: UpdateProfilePayload = {
      settingDailyGoal: dailyGoal,
      settingNewWordsPerDay: newWordsPerDay,
      settingReviewsPerDay: reviewsPerDay,
      settingNotificationsEnabled: notificationsEnabled,
      settingSoundEnabled: soundEnabled,
      settingTheme: theme,
      settingPreferredDifficulty: difficulty,
    };

    setIsSubmitting(true);
    try {
      await updateProfile(payload);
      setSuccessMessage('Preferences saved.');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Couldn’t save your preferences. Try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-paper-300 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-ink-950">Learning preferences</h2>
      <p className="mt-1 font-body text-sm text-ink-700">
        Signed in as <span className="font-medium text-ink-950">{user.username}</span> ({user.email})
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Daily goal (XP)"
            type="number"
            min={1}
            max={100}
            required
            value={dailyGoal}
            onChange={(event) => setDailyGoal(Number(event.target.value))}
          />
          <TextField
            label="New words / day"
            type="number"
            min={1}
            max={100}
            required
            value={newWordsPerDay}
            onChange={(event) => setNewWordsPerDay(Number(event.target.value))}
          />
          <TextField
            label="Reviews / day"
            type="number"
            min={1}
            max={200}
            required
            value={reviewsPerDay}
            onChange={(event) => setReviewsPerDay(Number(event.target.value))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Theme" value={theme} onChange={(event) => setTheme(event.target.value as UserTheme)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
          <Select
            label="Preferred difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as PreferredDifficulty)}
          >
            <option value="mixed">Mixed</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>

        <div className="flex flex-col gap-3 border-t border-paper-300 pt-4">
          <Toggle
            label="Notifications"
            description="Reminders to keep your streak going."
            checked={notificationsEnabled}
            onChange={setNotificationsEnabled}
          />
          <Toggle
            label="Sound effects"
            description="Play sounds during study sessions."
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
        </div>

        {formError && (
          <p role="alert" className="font-body text-sm text-red-600">
            {formError}
          </p>
        )}
        {successMessage && (
          <p role="status" className="font-body text-sm text-emerald-600">
            {successMessage}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-fit">
          Save preferences
        </Button>
      </form>
    </section>
  );
}
