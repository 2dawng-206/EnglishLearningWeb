import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../features/auth/auth-api";
import { Button } from "../../components/common/Button";
import { TextField } from "../../components/common/TextField";
import { getErrorMessage } from "../../utils/get-error-message";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Da gui request thanh cong (khong dung de suy ra email co ton tai hay
  // khong - luon hien cung 1 thong bao du email that hay khong).
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setIsSent(true);
    } catch (error) {
      setFormError(getErrorMessage(error, "Something went wrong. Try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-950">
          Check your email
        </h1>
        <p className="font-body text-sm text-ink-700">
          If an account exists for{" "}
          <span className="font-medium text-ink-950">{email}</span>, we’ve sent
          a link to reset your password. The link expires in 30 minutes.
        </p>
        <Link
          to="/login"
          className="font-body text-sm font-medium text-amber-600 hover:underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">
          Forgot your password?
        </h1>
        <p className="mt-1 font-body text-sm text-ink-700">
          Enter your email and we’ll send you a link to reset it.
        </p>
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

        {formError && (
          <p role="alert" className="font-body text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Send reset link
        </Button>
      </form>

      <p className="font-body text-sm text-ink-700">
        <Link
          to="/login"
          className="font-medium text-amber-600 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
