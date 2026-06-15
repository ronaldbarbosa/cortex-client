import { Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon';

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft';
export type ButtonSize = 'sm' | 'md';

/**
 * Botão padronizado do sistema. Attribute selector para aplicar direto em um
 * `<button>` nativo, preservando `type`, `(click)`, submit de formulário, etc.
 *
 * Uso: `<button app-btn kind="primary" icon="plus">Salvar</button>`
 */
@Component({
  selector: 'button[app-btn]',
  imports: [IconComponent],
  template: `
    @if (loading()) {
      <span
        class="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin"
      ></span>
    } @else if (icon()) {
      <app-icon [name]="icon()!" [size]="size() === 'sm' ? 15 : 16" [strokeWidth]="2" />
    }
    <ng-content />
  `,
  host: {
    '[class]': 'classes()',
    '[disabled]': 'disabled() || loading() ? true : null',
    '[attr.aria-busy]': 'loading() ? true : null',
  },
})
export class ButtonComponent {
  kind = input<ButtonKind>('secondary');
  size = input<ButtonSize>('md');
  icon = input<string>();
  full = input(false);
  loading = input(false);
  disabled = input(false);

  private readonly base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-[-0.01em] leading-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  private readonly kinds: Record<ButtonKind, string> = {
    primary: 'bg-accent text-white border border-accent hover:bg-accent/90',
    secondary: 'bg-surface text-ink border border-border hover:bg-bg',
    ghost: 'bg-transparent text-ink-2 border border-transparent hover:text-ink',
    danger: 'bg-danger text-white border border-danger hover:bg-danger/90',
    'danger-soft': 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15',
  };

  classes = computed(() => {
    const size = this.size() === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
    return [this.base, size, this.kinds[this.kind()], this.full() ? 'w-full' : ''].join(' ');
  });
}
