import { HttpErrorResponse } from '@angular/common/http';

const SERVER_ERROR_MSG = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
// 402 = licença do salão inativa (LicenseEnforcementFilter). O `detail` do backend é escrito
// para o dono regularizar a assinatura — não faz sentido para o cliente final, que não tem
// como agir sobre isso. Mostra genérico independente da tela; licenseInterceptor cuida do
// redirecionamento para /indisponivel.
const LICENSE_INACTIVE_MSG =
  'Este salão está temporariamente indisponível. Entre em contato diretamente com o salão.';

// Código de rastreio devolvido pelo backend (ErrorResponse.traceId / ValidationErrorResponse.traceId).
// É a mesma chave registrada nos logs — o usuário informa ao suporte para localizar a requisição.
export function apiErrorTraceId(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const traceId = err.error?.traceId;
  return typeof traceId === 'string' && traceId.length > 0 ? traceId : null;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;

  // Erro inesperado do servidor: anexa o código de rastreio para o suporte localizar o log.
  if (err.status >= 500) return withCode(SERVER_ERROR_MSG, apiErrorTraceId(err));

  if (err.status === 402) return LICENSE_INACTIVE_MSG;

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

  // Erro de rede / desconhecido: orientação genérica, com código quando houver.
  return withCode(fallback, apiErrorTraceId(err));
}

function withCode(message: string, traceId: string | null): string {
  return traceId ? `${message} (Código: ${traceId})` : message;
}
