import { Component, computed, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ModalComponent } from '../overlay/modal';
import { IconComponent } from '../icon/icon';

export interface DepositProofLike {
  contentType: string;
  url: string;
}

// Abre o comprovante do sinal (docs/sinal.md) num modal dentro da própria página, em vez de
// nova aba. PDF aceita além de imagem (docs/midia.md §2.2) — cada tipo tem seu próprio visual.
@Component({
  selector: 'app-proof-viewer-modal',
  imports: [ModalComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-modal title="Comprovante" size="lg" (closed)="closed.emit()">
      @if (isPdf()) {
        <iframe
          [src]="safeUrl()"
          class="w-full h-[75vh] border-0"
          title="Comprovante (PDF)"
        ></iframe>
      } @else {
        <div class="p-4 flex items-center justify-center bg-bg">
          <img
            [src]="proof().url"
            alt="Comprovante"
            class="max-w-full max-h-[70vh] rounded-lg object-contain"
          />
        </div>
      }
      <div footer class="px-5 sm:px-6 py-3.5 border-t border-border flex justify-end">
        <a
          [href]="proof().url"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-2 hover:text-ink transition-colors"
        >
          <app-icon name="arrowR" [size]="14" />
          Abrir em nova aba
        </a>
      </div>
    </app-modal>
  `,
})
export class ProofViewerModalComponent {
  proof = input.required<DepositProofLike>();
  closed = output<void>();

  private sanitizer = inject(DomSanitizer);

  isPdf = computed(() => this.proof().contentType === 'application/pdf');
  safeUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.proof().url),
  );
}
