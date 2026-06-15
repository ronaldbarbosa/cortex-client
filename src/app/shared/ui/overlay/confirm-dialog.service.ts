import { Injectable, signal } from '@angular/core';
import { Tone } from './tone';

export interface ConfirmInput {
  label?: string;
  placeholder?: string;
  required?: boolean;
  initial?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  tone?: Tone;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Quando presente, o diálogo captura um texto (ex.: motivo). Use `promptText`. */
  input?: ConfirmInput;
}

interface ActiveConfirm extends ConfirmOptions {
  resolveBool?: (value: boolean) => void;
  resolveText?: (value: string | null) => void;
}

/**
 * Diálogo de confirmação imperativo. Renderizado pelo `<app-confirm-host>`,
 * montado uma vez no shell.
 *
 * Confirmação simples (sim/não):
 *   const ok = await this.confirm.confirm({ title: '...', tone: 'danger' });
 *   if (!ok) return;
 *
 * Confirmação com captura de texto (retorna o texto, ou null se cancelado):
 *   const reason = await this.confirm.promptText({ title: '...', input: { ... } });
 *   if (reason === null) return;
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly active = signal<ActiveConfirm | null>(null);
  readonly inputValue = signal('');

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.inputValue.set('');
      this.active.set({ ...options, resolveBool: resolve });
    });
  }

  promptText(options: ConfirmOptions): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      this.inputValue.set(options.input?.initial ?? '');
      this.active.set({ ...options, resolveText: resolve });
    });
  }

  resolve(confirmed: boolean): void {
    const current = this.active();
    if (!current) return;
    current.resolveBool?.(confirmed);
    current.resolveText?.(confirmed ? this.inputValue() : null);
    this.active.set(null);
  }
}
