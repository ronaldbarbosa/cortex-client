import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { catchError, of, Subscription } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import {
  LoyaltyClientSummaryDto,
  LoyaltyProgramDto,
  LoyaltyService,
  LoyaltyTransactionDto,
} from './loyalty.service';

@Component({
  selector: 'app-loyalty',
  imports: [IconComponent],
  templateUrl: './loyalty.html',
})
export class LoyaltyComponent implements OnInit, OnDestroy {
  private loyaltyService = inject(LoyaltyService);
  private auth = inject(AuthService);
  private authModal = inject(AuthModalService);

  readonly program = signal<LoyaltyProgramDto | null>(null);
  readonly summary = signal<LoyaltyClientSummaryDto | null>(null);
  readonly transactions = signal<LoyaltyTransactionDto[] | null>(null);
  readonly programLoading = signal(true);
  readonly dataLoading = signal(false);
  readonly redeeming = signal(false);
  readonly redeemError = signal<string | null>(null);
  readonly redeemSuccess = signal(false);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly clientId = computed(() => this.auth.user()?.clientId ?? null);

  readonly stamps = computed<boolean[]>(() => {
    const p = this.program();
    const s = this.summary();
    if (!p || p.type !== 'Visits') return [];
    const visits = s?.loyaltyPoints ?? 0;
    return Array.from({ length: p.visitsRequired }, (_, i) => i < visits);
  });

  readonly canRedeem = computed(() => {
    const p = this.program();
    const s = this.summary();
    if (!p || !s) return false;
    if (p.type === 'Points') return s.loyaltyPoints > 0;
    if (p.type === 'Visits') return s.loyaltyPoints >= p.visitsRequired;
    return false;
  });

  readonly pointsCredit = computed(() => {
    const p = this.program();
    const s = this.summary();
    if (!p || !s || p.type !== 'Points' || p.redemptionRate === 0) return 0;
    return s.loyaltyPoints / p.redemptionRate;
  });

  private loginSub?: Subscription;

  ngOnInit(): void {
    this.loadProgram();
    this.loginSub = this.authModal.loginSuccess$.subscribe(() => this.loadClientData());
  }

  ngOnDestroy(): void {
    this.loginSub?.unsubscribe();
  }

  openLoginModal(): void {
    this.authModal.open();
  }

  redeem(): void {
    const clientId = this.clientId();
    const p = this.program();
    const s = this.summary();
    if (!clientId || !p || !s || this.redeeming()) return;

    const amount = p.type === 'Points' ? s.loyaltyPoints : 0;
    this.redeeming.set(true);
    this.redeemError.set(null);
    this.redeemSuccess.set(false);

    this.loyaltyService.redeem(clientId, amount).subscribe({
      next: () => {
        this.redeeming.set(false);
        this.redeemSuccess.set(true);
        this.loadClientData();
      },
      error: () => {
        this.redeeming.set(false);
        this.redeemError.set('Não foi possível resgatar. Tente novamente.');
      },
    });
  }

  stampClass(filled: boolean): string {
    return filled
      ? 'w-7 h-7 rounded-full border border-accent bg-accent/20 flex items-center justify-center'
      : 'w-7 h-7 rounded-full border border-hero-border flex items-center justify-center';
  }

  transactionTypeLabel(type: string): string {
    if (type === 'Earn') return 'Acúmulo';
    if (type === 'Redeem') return 'Resgate';
    return 'Expirado';
  }

  transactionSign(type: string): string {
    return type === 'Earn' ? '+' : '-';
  }

  transactionAmountClass(type: string): string {
    if (type === 'Earn') return 'text-green-400';
    if (type === 'Redeem') return 'text-accent';
    return 'text-ink-3 line-through';
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(isoDate));
  }

  private loadProgram(): void {
    this.programLoading.set(true);
    this.loyaltyService
      .getProgram()
      .pipe(catchError(() => of(null)))
      .subscribe((p) => {
        this.program.set(p);
        this.programLoading.set(false);
        if (this.isAuthenticated()) this.loadClientData();
      });
  }

  private loadClientData(): void {
    const clientId = this.clientId();
    if (!clientId) return;

    this.dataLoading.set(true);
    this.loyaltyService
      .getClientSummary(clientId)
      .pipe(catchError(() => of(null)))
      .subscribe((s) => {
        this.summary.set(s);
        this.loyaltyService
          .getTransactions(clientId)
          .pipe(catchError(() => of([])))
          .subscribe((txs) => {
            this.transactions.set(txs);
            this.dataLoading.set(false);
          });
      });
  }
}
