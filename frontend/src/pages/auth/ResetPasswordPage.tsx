import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../features/auth/auth-api';
import { Button } from '../../components/common/Button';
import { TextField } from '../../components/common/TextField';
import { getErrorMessage } from '../../utils/get-error-message';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vao trang nay ma khong co token trong URL (vd nguoi dung tu go
  // /reset-password) thi khong the goi API duoc - bao ngay thay vi de ho
  // dien form roi moi bao loi.
  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Invalid reset link</h1>
        <p className="font-body text-sm text-ink-700">
          This password reset link is missing or malformed. Request a new one below.
        </p>
        <Link
          to="/forgot-password"
          className="font-body text-sm font-medium text-amber-600 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setFormError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFieldError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset. Log in with your new password.' },
      });
    } catch (error) {
      // Token sai/het han se roi vao day (backend tra 400).
      setFormError(getErrorMessage(error, 'This reset link is invalid or has expired.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Choose a new password</h1>
        <p className="mt-1 font-body text-sm text-ink-700">
          Make it something you don’t use anywhere else.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldError ?? undefined}
        />

        {formError && (
          <p role="alert" className="font-body text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Reset password
        </Button>
      </form>
    </div>
  );
}
