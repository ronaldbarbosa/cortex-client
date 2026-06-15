import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon';
import { ModalComponent } from './modal';
import { ButtonComponent, ButtonKind } from './button';
import { ConfirmDialogService } from './confirm-dialog.service';
import { TONE_BADGE, Tone } from './tone';

const CONFIRM_ICON: Record<Tone, string> = {
  danger: 'x',
  success: 'check',
  warning: 'flame',
  info: 'sparkle',
  neutral: 'check',
};

/**
 * Host global do diálogo de confirmação. Renderiza o diálogo ativo do
 * ConfirmDialogService usando o shell de modal padrão. Suporta um campo de
 * texto opcional (promptText) para capturar um motivo.
 */
@Component({
  selector: 'app-confirm-host',
  imports: [ModalComponent, ButtonComponent, IconComponent, FormsModule],
  template: `
    @if (svc.active(); as c) {
      <app-modal size="sm" (closed)="svc.resolve(false)">
        <div class="px-6 pt-6">
          <div class="flex items-start gap-3.5">
            <div
              class="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border"
              [class]="badge(c.tone)"
            >
              <app-icon [name]="c.icon ?? icon(c.tone)" [size]="21" [strokeWidth]="1.9" />
            </div>
            <div class="flex-1 min-w-0 pt-0.5">
              <h2
                class="font-tight font-semibold text-[18px] text-ink tracking-[-0.02em] leading-snug"
              >
                {{ c.title }}
              </h2>
              @if (c.message) {
                <p class="text-[13.5px] text-ink-2 mt-1.5 leading-relaxed">{{ c.message }}</p>
              }
            </div>
          </div>

          @if (c.input; as input) {
            <div class="mt-4">
              @if (input.label) {
                <label class="block text-sm font-medium text-ink mb-1.5">{{ input.label }}</label>
              }
              <input
                type="text"
                [placeholder]="input.placeholder ?? ''"
                [ngModel]="svc.inputValue()"
                (ngModelChange)="svc.inputValue.set($event)"
                class="w-full px-3.5 py-2.5 rounded-lg border border-border bg-bg text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>
          }
        </div>

        <div footer class="flex justify-end gap-2.5 px-6 pt-5 pb-6">
          <button app-btn kind="secondary" (click)="svc.resolve(false)">
            {{ c.cancelLabel ?? 'Cancelar' }}
          </button>
          <button
            app-btn
            [kind]="confirmKind(c.tone)"
            [disabled]="confirmDisabled()"
            (click)="svc.resolve(true)"
          >
            {{ c.confirmLabel ?? 'Confirmar' }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class ConfirmHostComponent {
  readonly svc = inject(ConfirmDialogService);

  confirmDisabled = computed(() => {
    const c = this.svc.active();
    return !!c?.input?.required && this.svc.inputValue().trim().length === 0;
  });

  badge(tone: Tone | undefined): string {
    return TONE_BADGE[tone ?? 'neutral'];
  }

  icon(tone: Tone | undefined): string {
    return CONFIRM_ICON[tone ?? 'neutral'];
  }

  confirmKind(tone: Tone | undefined): ButtonKind {
    return tone === 'danger' ? 'danger' : 'primary';
  }
}
