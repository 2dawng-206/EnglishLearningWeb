import { PreferencesForm } from './PreferencesForm';
import { ChangePasswordForm } from './ChangePasswordForm';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-950">Settings</h1>
        <p className="mt-1 font-body text-ink-700">Manage your account and study preferences.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        <PreferencesForm />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
