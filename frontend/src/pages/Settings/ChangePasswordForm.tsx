import { useState, type FormEvent } from 'react';
import { changePassword } from '../../features/settings/settings-api';
import { Button } from '../../components/common/Button';
import { TextField } from '../../components/common/TextField';
import { getErrorMessage } from '../../utils/get-error-message';

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetMessages() {
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
  }

  // Validate ngay tren client truoc, de nguoi dung khong phai doi round-trip
  // len server moi biet mat khau moi qua ngan hay go nham xac nhan.
  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (newPassword && newPassword === currentPassword) {
      errors.newPassword = 'New password must be different from the current password.';
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    resetMessages();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccessMessage('Password updated. You’ll need to log in again on other devices.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Couldn’t change your password. Try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-paper-300 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-ink-950">Change password</h2>
      <p className="mt-1 font-body text-sm text-ink-700">
        Choose a strong password you don’t use anywhere else.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex max-w-sm flex-col gap-4" noValidate>
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={fieldErrors.newPassword}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors.confirmPassword}
        />

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

        <Button type="submit" isLoading={isSubmitting} className="mt-1 w-fit">
          Update password
        </Button>
      </form>
    </section>
  );
}
