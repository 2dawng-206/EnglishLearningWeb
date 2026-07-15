import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../features/auth/auth-api';
import { Button } from '../../components/common/Button';
import { TextField } from '../../components/common/TextField';
import { getErrorMessage } from '../../utils/get-error-message';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    // Mirrors RegisterDto in backend/src/modules/auth/dto/register.dto.ts —
    // catching these client-side avoids a round trip for the common cases.
    if (username.trim().length < 3) {
      setFormError('Username needs to be at least 3 characters.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password needs to be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords don’t match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ username: username.trim(), email, password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Couldn’t create that account.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Create your account</h1>
        <p className="mt-1 font-body text-sm text-ink-700">
          Start a spaced-repetition list of your own.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Username"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {formError && (
          <p role="alert" className="font-body text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="font-body text-sm text-ink-700">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-amber-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
