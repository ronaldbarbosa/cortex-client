import { Injectable, signal } from '@angular/core';
import { Tone } from './tone';

export interface ToastAction {
  label: string;
  icon?: string;
  handler: () => void;
}

export interface ToastData {
  id: number;
  tone: Tone;
  icon?: string;
  title: string;
  msg?: string;
  action?: ToastAction;
  dismiss: boolean;
  /** 0 = persistente (não some sozinho). */
  durationMs: number;
  /** Barra de progresso 0–100. */
  progress?: number;
  /** Substitui o ícone por um spinner (operação em andamento). */
  spinner?: boolean;
}

export interface ToastOptions {
  tone?: Tone;
  icon?: string;
  title: string;
  msg?: string;
  action?: ToastAction;
  dismiss?: boolean;
  durationMs?: number;
  progress?: number;
  spinner?: boolean;
}

const DEFAULT_ICON: Record<Tone, string> = {
  success: 'check',
  danger: 'x',
  warning: 'flame',
  info: 'sparkle',
  neutral: 'sparkle',
};

/**
 * Notificações temporárias (toasts) globais. Renderizadas pelo `<app-toaster>`,
 * montado uma única vez no shell da aplicação.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = signal<ToastData[]>([]);

  show(o: ToastOptions): number {
    const id = ++this.seq;
    const tone = o.tone ?? 'neutral';
    const toast: ToastData = {
      id,
      tone,
      icon: o.icon ?? DEFAULT_ICON[tone],
      title: o.title,
      msg: o.msg,
      action: o.action,
      dismiss: o.dismiss ?? true,
      durationMs: o.durationMs ?? (tone === 'danger' ? 7000 : 4500),
      progress: o.progress,
      spinner: o.spinner,
    };
    this.toasts.update((list) => [...list, toast]);
    if (toast.durationMs > 0) this.arm(id, toast.durationMs);
    return id;
  }

  success(title: string, msg?: string): number {
    return this.show({ tone: 'success', title, msg });
  }

  error(title: string, msg?: string): number {
    return this.show({ tone: 'danger', title, msg });
  }

  warning(title: string, msg?: string): number {
    return this.show({ tone: 'warning', title, msg });
  }

  info(title: string, msg?: string): number {
    return this.show({ tone: 'info', title, msg });
  }

  neutral(title: string, msg?: string): number {
    return this.show({ tone: 'neutral', title, msg });
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  /** Pausa o auto-dismiss (ex.: enquanto o cursor está sobre o toast). */
  pause(id: number): void {
    this.clearTimer(id);
  }

  /** Retoma o auto-dismiss com a duração original do toast. */
  resume(id: number): void {
    const toast = this.toasts().find((t) => t.id === id);
    if (toast && toast.durationMs > 0) this.arm(id, toast.durationMs);
  }

  private arm(id: number, ms: number): void {
    this.clearTimer(id);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), ms),
    );
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
