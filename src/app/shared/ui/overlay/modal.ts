import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { IconComponent } from '../icon/icon';
import { TONE_BADGE, Tone } from './tone';

export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * Shell de modal padronizado: backdrop com blur, card centralizado no desktop e
 * bottom-sheet no mobile. Fecha exclusivamente pelo botão de fechar do cabeçalho
 * ou por ações explícitas do conteúdo — clique fora e tecla Esc não fecham.
 *
 * Cabeçalho opcional: se `title` for informado, renderiza badge + título +
 * subtítulo + botão fechar. Caso contrário, o conteúdo projetado controla tudo.
 *
 * Slots:
 *  - conteúdo padrão → corpo rolável
 *  - `[footer]` → rodapé fixo (fora da área de rolagem)
 */
@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
    >
      <div
        class="w-full bg-surface border border-border shadow-xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        [class]="widthClass()"
      >
        @if (title()) {
          <div
            class="flex items-start gap-3.5 px-5 sm:px-6 pt-5 pb-4 border-b border-border shrink-0"
          >
            @if (badgeIcon()) {
              <div
                class="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border"
                [class]="badgeClass()"
              >
                <app-icon [name]="badgeIcon()!" [size]="21" [strokeWidth]="1.9" />
              </div>
            }
            <div class="flex-1 min-w-0 pt-0.5">
              <h2
                class="font-tight font-semibold text-[17px] text-ink tracking-[-0.02em] leading-snug"
              >
                {{ title() }}
              </h2>
              @if (subtitle()) {
                <p class="text-[13px] text-ink-2 mt-0.5 leading-snug">{{ subtitle() }}</p>
              }
            </div>
            <button
              type="button"
              (click)="closed.emit()"
              aria-label="Fechar"
              class="w-8 h-8 rounded-lg shrink-0 -mt-0.5 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-border/50 transition-colors cursor-pointer"
            >
              <app-icon name="x" [size]="18" [strokeWidth]="2" />
            </button>
          </div>
        }

        <div class="overflow-y-auto">
          <ng-content />
        </div>

        <ng-content select="[footer]" />
      </div>
    </div>
  `,
})
export class ModalComponent implements OnInit, OnDestroy {
  size = input<ModalSize>('md');
  title = input<string>();
  subtitle = input<string>();
  badgeIcon = input<string>();
  badgeTone = input<Tone>('neutral');

  closed = output<void>();

  private doc = inject(DOCUMENT);

  private readonly widths: Record<ModalSize, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
  };

  widthClass = computed(() => this.widths[this.size()]);
  badgeClass = computed(() => TONE_BADGE[this.badgeTone()]);

  ngOnInit(): void {
    this.doc.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }
}
