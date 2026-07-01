import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { TONE_BOX, TONE_FG, Tone } from '../overlay/tone';

/**
 * Alerta/banner inline (não-overlay), para dentro de páginas e formulários.
 *
 * Retrocompatível: `<app-alert [message]="error()" />` segue mostrando uma caixa
 * compacta de erro. Para banners ricos, use `tone` + `title` + `icon`.
 */
@Component({
  selector: 'app-alert',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (message() || title()) {
      <div class="flex items-start gap-3 rounded-xl border px-4 py-3" [class]="boxClass()">
        @if (icon()) {
          <span class="shrink-0 mt-0.5" [class]="fgClass()">
            <app-icon [name]="icon()!" [size]="18" [strokeWidth]="2" />
          </span>
        }
        <div class="flex-1 min-w-0">
          @if (title()) {
            <div class="font-tight font-semibold text-[14px] text-ink tracking-[-0.01em]">
              {{ title() }}
            </div>
          }
          @if (message()) {
            <div
              class="font-mono text-[11px] leading-snug"
              [class]="title() ? 'text-ink-2 mt-0.5' : fgClass()"
            >
              {{ message() }}
            </div>
          }
        </div>
        @if (dismissible()) {
          <button
            type="button"
            (click)="dismissed.emit()"
            aria-label="Fechar"
            class="shrink-0 text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <app-icon name="x" [size]="15" [strokeWidth]="2" />
          </button>
        }
      </div>
    }
  `,
})
export class AlertComponent {
  message = input<string | null>(null);
  title = input<string | null>(null);
  tone = input<Tone | null>(null);
  /** Retrocompatibilidade com o uso antigo. */
  variant = input<'error' | 'success'>('error');
  icon = input<string | null>(null);
  dismissible = input(false);

  dismissed = output<void>();

  private resolvedTone = computed<Tone>(
    () => this.tone() ?? (this.variant() === 'success' ? 'success' : 'danger'),
  );

  boxClass = computed(() => TONE_BOX[this.resolvedTone()]);
  fgClass = computed(() => TONE_FG[this.resolvedTone()]);
}
