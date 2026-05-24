import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alert',
  template: `
    @if (message()) {
      <div
        class="px-4 py-3 rounded-xl font-mono text-[11px] border"
        [class]="
          variant() === 'success'
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-danger/10 border-danger/30 text-danger'
        "
      >
        {{ message() }}
      </div>
    }
  `,
})
export class AlertComponent {
  message = input<string | null>(null);
  variant = input<'error' | 'success'>('error');
}
