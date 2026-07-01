import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';
import { AlertComponent } from '../../shared/ui/alert/alert';
import { IconComponent } from '../../shared/ui/icon/icon';
import { apiErrorMessage } from '../../core/utils/api-error';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { AuthService } from '../../core/auth/auth.service';
import { EstablishmentService } from '../../core/establishment/establishment.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { UnitContextService } from '../../core/unit/unit-context.service';
import {
  AppointmentSummary,
  ProfessionalAvailability,
  PublicProfessional,
  PublicServiceItem,
} from '../../core/establishment/establishment.model';
import {
  LoyaltyClientSummaryDto,
  LoyaltyProgramDto,
  LoyaltyService,
} from '../loyalty/loyalty.service';

interface DateOption {
  value: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
}

@Component({
  selector: 'app-book',
  imports: [AlertComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './book.html',
})
export class BookComponent implements OnInit, OnDestroy {
  private establishmentService = inject(EstablishmentService);
  private loyaltyService = inject(LoyaltyService);
  private auth = inject(AuthService);
  private authModal = inject(AuthModalService);
  private tenantContext = inject(TenantContextService);
  private unitContext = inject(UnitContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly step = signal<1 | 2 | 3 | 4>(1);
  readonly selectedServices = signal<PublicServiceItem[]>([]);
  readonly selectedProfessional = signal<PublicProfessional | null>(null);
  readonly selectedDate = signal<string>(this.toDateString(new Date()));
  readonly selectedSlot = signal<string | null>(null);
  readonly availability = signal<ProfessionalAvailability | null>(null);
  readonly availabilityLoading = signal(false);

  readonly loyaltyProgram = signal<LoyaltyProgramDto | null>(null);
  readonly loyaltySummary = signal<LoyaltyClientSummaryDto | null>(null);
  readonly includeRewardService = signal(false);

  readonly serviceCategories = toSignal(
    this.establishmentService.getServices().pipe(catchError(() => of([]))),
    { initialValue: null },
  );

  readonly professionals = signal<PublicProfessional[] | null>(null);

  readonly dates = computed<DateOption[]>(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        value: this.toDateString(d),
        dayName: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d),
        dayNumber: d.getDate(),
        monthName: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d),
      };
    });
  });

  readonly confirming = signal(false);
  readonly bookingError = signal<string | null>(null);
  readonly confirmedAppointment = signal<AppointmentSummary | null>(null);

  readonly totalPrice = computed(() =>
    this.selectedServices().reduce((sum, s) => sum + s.price, 0),
  );

  readonly totalDuration = computed(() => {
    const base = this.selectedServices().reduce((sum, s) => sum + s.durationMinutes, 0);
    const reward =
      this.includeRewardService() && this.rewardServiceItem()
        ? this.rewardServiceItem()!.durationMinutes
        : 0;
    return base + reward;
  });

  readonly rewardServiceItem = computed<PublicServiceItem | null>(() => {
    const program = this.loyaltyProgram();
    const cats = this.serviceCategories();
    if (!program?.rewardServiceId || !cats) return null;
    for (const cat of cats) {
      const found = cat.services.find((s) => s.id === program.rewardServiceId);
      if (found) return found;
    }
    return null;
  });

  readonly willCompleteCard = computed(() => {
    const program = this.loyaltyProgram();
    const summary = this.loyaltySummary();
    if (
      !program ||
      !summary ||
      !program.isActive ||
      program.type !== 'Visits' ||
      !program.rewardServiceId
    )
      return false;
    return summary.loyaltyPoints + 1 >= program.visitsRequired;
  });

  private availabilitySub?: Subscription;
  private loginSuccessSub?: Subscription;
  private loyaltyLoginSub?: Subscription;

  ngOnInit(): void {
    const preselectedId = this.route.snapshot.queryParamMap.get('professionalId');

    // Deep-link com profissional pré-selecionado: resolve o profissional pela lista completa.
    // No fluxo normal a lista é carregada (filtrada por serviço) ao entrar no passo 2.
    if (preselectedId) {
      this.establishmentService
        .getProfessionals()
        .pipe(catchError(() => of([])))
        .subscribe((list) => {
          this.professionals.set(list);
          const found = list.find((p) => p.id === preselectedId);
          if (found) this.selectedProfessional.set(found);
        });
    }

    this.loyaltyService
      .getProgram()
      .pipe(catchError(() => of(null)))
      .subscribe((p) => {
        this.loyaltyProgram.set(p);
        if (this.auth.isAuthenticated()) this.loadLoyaltySummary();
      });

    this.loyaltyLoginSub = this.authModal.loginSuccess$.subscribe(() => this.loadLoyaltySummary());
  }

  ngOnDestroy(): void {
    this.availabilitySub?.unsubscribe();
    this.loginSuccessSub?.unsubscribe();
    this.loyaltyLoginSub?.unsubscribe();
  }

  confirmBooking(): void {
    if (!this.auth.isAuthenticated()) {
      this.authModal.open();
      this.loginSuccessSub?.unsubscribe();
      this.loginSuccessSub = this.authModal.loginSuccess$.subscribe(() => this.submitAppointment());
      return;
    }
    this.submitAppointment();
  }

  toggleRewardService(): void {
    this.includeRewardService.update((v) => !v);
    this.selectedSlot.set(null);
    this.fetchAvailability(this.selectedDate());
  }

  toggleService(service: PublicServiceItem): void {
    this.selectedServices.update((current) => {
      const idx = current.findIndex((s) => s.id === service.id);
      return idx >= 0 ? current.filter((s) => s.id !== service.id) : [...current, service];
    });
  }

  isServiceSelected(serviceId: string): boolean {
    return this.selectedServices().some((s) => s.id === serviceId);
  }

  proceedToStep2(): void {
    if (this.selectedServices().length === 0) return;
    if (this.selectedProfessional()) {
      this.selectedSlot.set(null);
      this.includeRewardService.set(false);
      this.step.set(3);
      this.fetchAvailability(this.selectedDate());
    } else {
      this.loadProfessionalsForSelectedServices();
      this.step.set(2);
    }
  }

  private loadProfessionalsForSelectedServices(): void {
    const serviceIds = this.selectedServices().map((s) => s.id);
    this.professionals.set(null);
    this.establishmentService
      .getProfessionals(serviceIds)
      .pipe(catchError(() => of([])))
      .subscribe((list) => this.professionals.set(list));
  }

  selectProfessional(professional: PublicProfessional): void {
    this.selectedProfessional.set(professional);
    this.selectedSlot.set(null);
    this.includeRewardService.set(false);
    this.step.set(3);
    this.fetchAvailability(this.selectedDate());
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    this.fetchAvailability(date);
  }

  selectSlot(slot: string): void {
    this.selectedSlot.set(slot);
  }

  goBack(): void {
    const current = this.step();
    if (current > 1 && current < 4) {
      this.step.set((current - 1) as 1 | 2 | 3);
      if (current === 3) {
        this.availability.set(null);
        this.selectedSlot.set(null);
        this.includeRewardService.set(false);
      }
    }
  }

  // Recebe a hora-de-parede do salão (ISO sem fuso) — exibe direto, sem conversão.
  formatAppointmentDate(localIso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(localIso));
  }

  navigateToHome(): void {
    const slug = this.tenantContext.slug();
    const unitSlug = this.unitContext.unitSlug();
    this.router.navigate(['/s', slug, 'u', unitSlug, 'inicio']);
  }

  navigateToHistory(): void {
    const slug = this.tenantContext.slug();
    const unitSlug = this.unitContext.unitSlug();
    this.router.navigate(['/s', slug, 'u', unitSlug, 'historico']);
  }

  private submitAppointment(): void {
    const services = this.selectedServices();
    const professional = this.selectedProfessional();
    const date = this.selectedDate();
    const slot = this.selectedSlot();
    const clientId = this.auth.user()?.clientId;

    if (!services.length || !professional || !slot || !clientId) return;

    const serviceIds = services.map((s) => s.id);
    if (this.includeRewardService() && this.rewardServiceItem()) {
      serviceIds.push(this.rewardServiceItem()!.id);
    }

    this.confirming.set(true);
    this.bookingError.set(null);

    // Hora-de-parede do salão (sem fuso) — o backend converte para UTC.
    const startLocal = `${date}T${slot}:00`;

    this.establishmentService
      .createAppointment({
        clientId,
        professionalId: professional.id,
        startLocal,
        serviceIds,
        unitId: this.unitContext.unitId() ?? undefined,
        rewardServiceId:
          this.includeRewardService() && this.rewardServiceItem()
            ? this.rewardServiceItem()!.id
            : undefined,
      })
      .subscribe({
        next: (appointment) => {
          this.confirming.set(false);
          this.confirmedAppointment.set(appointment);
          this.step.set(4);
        },
        error: (err) => {
          this.confirming.set(false);
          this.bookingError.set(
            apiErrorMessage(err, 'Não foi possível confirmar o agendamento. Tente novamente.'),
          );
        },
      });
  }

  private fetchAvailability(date: string): void {
    const professional = this.selectedProfessional();
    if (!professional || this.selectedServices().length === 0) return;

    const totalDuration = this.totalDuration();

    this.availabilitySub?.unsubscribe();
    this.availabilityLoading.set(true);
    this.availability.set(null);

    this.availabilitySub = this.establishmentService
      .getAvailability(professional.id, date, totalDuration)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        this.availability.set(result);
        this.availabilityLoading.set(false);
      });
  }

  private loadLoyaltySummary(): void {
    const clientId = this.auth.user()?.clientId;
    if (!clientId) return;
    this.loyaltyService
      .getClientSummary(clientId)
      .pipe(catchError(() => of(null)))
      .subscribe((s) => this.loyaltySummary.set(s));
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  private toDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
