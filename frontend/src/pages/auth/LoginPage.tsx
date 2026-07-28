import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/auth-api';
import { Button } from '../../components/common/Button';
import { TextField } from '../../components/common/TextField';
import { getErrorMessage } from '../../utils/get-error-message';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Couldn’t log in with that email and password.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Welcome back</h1>
        <p className="mt-1 font-body text-sm text-ink-700">Log in to pick up your reviews.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Link
          to="/forgot-password"
          className="-mt-2 self-end font-body text-sm text-amber-600 hover:underline"
        >
          Forgot password?
        </Link>

        {formError && (
          <p role="alert" className="font-body text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Log in
        </Button>
      </form>

      <p className="font-body text-sm text-ink-700">
        New here?{' '}
        <Link to="/register" className="font-medium text-amber-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
