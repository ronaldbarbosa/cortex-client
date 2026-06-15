import { Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { ToastData, ToastService } from './toast.service';
import { TONE_BADGE, TONE_BAR, TONE_FG, TONE_TRACK, Tone } from './tone';

/**
 * Host global dos toasts. Stack no canto superior-direito (desktop) e faixa
 * inferior (mobile). Montado uma vez no shell da aplicação.
 */
@Component({
  selector: 'app-toaster',
  imports: [IconComponent],
  template: `
    <div
      class="fixed z-[60] flex flex-col gap-2.5 pointer-events-none bottom-4 left-4 right-4 items-stretch sm:top-4 sm:bottom-auto sm:left-auto sm:right-4 sm:items-end"
    >
      @for (t of toast.toasts(); track t.id) {
        <div
          class="pointer-events-auto w-full sm:w-[360px] max-w-full bg-surface border border-border rounded-xl shadow-lg relative overflow-hidden flex items-start gap-3 px-3.5 py-3"
          (mouseenter)="toast.pause(t.id)"
          (mouseleave)="toast.resume(t.id)"
        >
          <div
            class="w-[34px] h-[34px] rounded-lg shrink-0 flex items-center justify-center border"
            [class]="badge(t.tone)"
          >
            @if (t.spinner) {
              <span
                class="w-[18px] h-[18px] rounded-full border-2 border-current border-r-transparent animate-spin"
              ></span>
            } @else {
              <app-icon [name]="t.icon!" [size]="18" [strokeWidth]="2" />
            }
          </div>

          <div class="flex-1 min-w-0 pt-0.5">
            <div
              class="font-tight font-semibold text-[14px] text-ink tracking-[-0.01em] leading-tight"
            >
              {{ t.title }}
            </div>
            @if (t.msg) {
              <div class="text-[12.5px] text-ink-2 mt-0.5 leading-snug">{{ t.msg }}</div>
            }
            @if (t.action; as a) {
              <button
                type="button"
                (click)="runAction(t)"
                class="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold cursor-pointer tracking-[-0.01em]"
                [class]="fg(t.tone)"
              >
                @if (a.icon) {
                  <app-icon [name]="a.icon" [size]="14" [strokeWidth]="2.2" />
                }
                {{ a.label }}
              </button>
            }
          </div>

          @if (t.dismiss) {
            <button
              type="button"
              (click)="toast.dismiss(t.id)"
              aria-label="Fechar"
              class="w-6 h-6 rounded-md shrink-0 -mt-0.5 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
            >
              <app-icon name="x" [size]="15" [strokeWidth]="2" />
            </button>
          }

          @if (t.progress != null) {
            <div class="absolute left-0 bottom-0 h-[3px] w-full" [class]="track(t.tone)">
              <div
                class="h-full rounded-r"
                [class]="bar(t.tone)"
                [style.width.%]="t.progress"
              ></div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ToasterComponent {
  readonly toast = inject(ToastService);

  badge(tone: Tone): string {
    return TONE_BADGE[tone];
  }
  fg(tone: Tone): string {
    return TONE_FG[tone];
  }
  bar(tone: Tone): string {
    return TONE_BAR[tone];
  }
  track(tone: Tone): string {
    return TONE_TRACK[tone];
  }

  runAction(t: ToastData): void {
    t.action?.handler();
    this.toast.dismiss(t.id);
  }
}
