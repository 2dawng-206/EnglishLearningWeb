import { isAxiosError } from 'axios';

interface NestErrorBody {
  message?: string | string[];
  error?: string;
}

/**
 * NestJS error responses look like { statusCode, message, error }, where
 * `message` is a plain string for most thrown exceptions but an array of
 * strings when class-validator rejects a DTO. Flatten either shape into one
 * displayable line.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (isAxiosError<NestErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === 'string') return message;
  }
  return fallback;
}
