/**
 * Mapas de classes Tailwind por tom semântico — compartilhados por modal,
 * toaster, confirm e alert. Usam os tokens de cor do app (status colors).
 *
 * Diferença do admin: o client não tem o token `nav-active`; o tom neutro
 * usa `accent-soft` (tint âmbar suave) como superfície.
 */
export type Tone = 'neutral' | 'danger' | 'success' | 'warning' | 'info';

/** Badge de ícone: fundo tonal + borda + cor (herdada pelo ícone via currentColor). */
export const TONE_BADGE: Record<Tone, string> = {
  neutral: 'bg-accent-soft text-ink border-border',
  danger: 'bg-danger/10 text-danger border-danger/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-info/10 text-info border-info/30',
};

/** Caixa de alerta/banner inline. */
export const TONE_BOX: Record<Tone, string> = {
  neutral: 'bg-accent-soft border-border',
  danger: 'bg-danger/10 border-danger/30',
  success: 'bg-success/10 border-success/30',
  warning: 'bg-warning/10 border-warning/30',
  info: 'bg-info/10 border-info/30',
};

/** Cor de texto/ícone do tom. */
export const TONE_FG: Record<Tone, string> = {
  neutral: 'text-ink',
  danger: 'text-danger',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
};

/** Barra de progresso (preenchimento) do toast. */
export const TONE_BAR: Record<Tone, string> = {
  neutral: 'bg-ink-3',
  danger: 'bg-danger',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
};

/** Trilho da barra de progresso do toast. */
export const TONE_TRACK: Record<Tone, string> = {
  neutral: 'bg-border',
  danger: 'bg-danger/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  info: 'bg-info/15',
};
