import { HttpErrorResponse } from '@angular/common/http';

const SERVER_ERROR_MSG = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;

  if (err.status >= 500) return SERVER_ERROR_MSG;

  if (err.status >= 400 && err.status < 500) {
    // Validation errors: { errors: { field: [messages] } }
    const errors = err.error?.errors as Record<string, string[]> | undefined;
    if (errors) {
      const msgs = Object.values(errors).flat();
      if (msgs.length) return msgs.join(' ');
    }
    // Business rule / not found errors: { detail: string }
    if (err.error?.detail) return err.error.detail;
  }

  return fallback;
}
