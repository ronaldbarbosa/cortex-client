import { Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Mensagem de validação padronizada (token `text-danger`, font-mono).
 *
 * Dois modos de uso:
 *  - `<app-field-error [control]="form.controls.name" />` — resolve a mensagem
 *    a partir dos erros do control (mostra só após touched/dirty por padrão).
 *  - `<app-field-error [message]="'Mensagem fixa'" />` — texto explícito.
 *
 * Mensagens por erro podem ser sobrescritas via `[messages]`.
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (text()) {
      <p class="mt-1 font-mono text-[11px] text-danger leading-snug">{{ text() }}</p>
    }
  `,
})
export class FieldErrorComponent {
  control = input<AbstractControl | null>(null);
  message = input<string | null>(null);
  showWhen = input<'touched' | 'always'>('touched');
  messages = input<Record<string, string>>({});

  private readonly defaults: Record<string, string> = {
    required: 'Campo obrigatório.',
    email: 'E-mail inválido.',
    minlength: 'Muito curto.',
    maxlength: 'Excede o limite de caracteres.',
    min: 'Valor muito baixo.',
    max: 'Valor muito alto.',
    pattern: 'Formato inválido.',
  };

  text = computed<string | null>(() => {
    const explicit = this.message();
    if (explicit) return explicit;

    const c = this.control();
    if (!c || !c.errors) return null;
    if (this.showWhen() === 'touched' && !(c.touched || c.dirty)) return null;

    const key = Object.keys(c.errors)[0];
    return this.messages()[key] ?? this.defaults[key] ?? 'Valor inválido.';
  });
}
