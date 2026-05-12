import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { AuthService } from '../../core/auth/auth.service';
import { EstablishmentService } from '../../core/establishment/establishment.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import {
  AppointmentSummary,
  ProfessionalAvailability,
  PublicProfessional,
  PublicServiceItem,
} from '../../core/establishment/establishment.model';

interface DateOption {
  value: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
}

@Component({
  selector: 'app-book',
  imports: [IconComponent],
  templateUrl: './book.html',
})
export class BookComponent {
  private establishmentService = inject(EstablishmentService);
  private auth = inject(AuthService);
  private authModal = inject(AuthModalService);
  private tenantContext = inject(TenantContextService);
  private router = inject(Router);

  readonly step = signal<1 | 2 | 3 | 4>(1);
  readonly selectedService = signal<PublicServiceItem | null>(null);
  readonly selectedProfessional = signal<PublicProfessional | null>(null);
  readonly selectedDate = signal<string>(this.toDateString(new Date()));
  readonly selectedSlot = signal<string | null>(null);
  readonly availability = signal<ProfessionalAvailability | null>(null);
  readonly availabilityLoading = signal(false);

  // null = loading; [] = empty/error; [...] = loaded
  readonly serviceCategories = toSignal(
    this.establishmentService.getServices().pipe(catchError(() => of([]))),
    { initialValue: null },
  );

  readonly professionals = toSignal(
    this.establishmentService.getProfessionals().pipe(catchError(() => of([]))),
    { initialValue: null },
  );

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

  private availabilitySub?: Subscription;
  private loginSuccessSub?: Subscription;

  confirmBooking(): void {
    if (!this.auth.isAuthenticated()) {
      this.authModal.open();
      this.loginSuccessSub?.unsubscribe();
      this.loginSuccessSub = this.authModal.loginSuccess$.subscribe(() => this.submitAppointment());
      return;
    }
    this.submitAppointment();
  }

  private submitAppointment(): void {
    const service = this.selectedService();
    const professional = this.selectedProfessional();
    const date = this.selectedDate();
    const slot = this.selectedSlot();
    const clientId = this.auth.user()?.clientId;

    if (!service || !professional || !slot || !clientId) return;

    this.confirming.set(true);
    this.bookingError.set(null);

    const startAt = `${date}T${slot}:00+00:00`;

    this.establishmentService
      .createAppointment({
        clientId,
        professionalId: professional.id,
        startAt,
        serviceIds: [service.id],
      })
      .subscribe({
        next: (appointment) => {
          this.confirming.set(false);
          this.confirmedAppointment.set(appointment);
          this.step.set(4);
        },
        error: () => {
          this.confirming.set(false);
          this.bookingError.set('Não foi possível confirmar o agendamento. Tente novamente.');
        },
      });
  }

  selectService(service: PublicServiceItem): void {
    this.selectedService.set(service);
    this.step.set(2);
  }

  selectProfessional(professional: PublicProfessional): void {
    this.selectedProfessional.set(professional);
    this.selectedSlot.set(null);
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
      }
    }
  }

  formatAppointmentDate(isoDate: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(isoDate));
  }

  navigateToHome(): void {
    const slug = this.tenantContext.slug();
    this.router.navigate(['/s', slug, 'inicio']);
  }

  navigateToHistory(): void {
    const slug = this.tenantContext.slug();
    this.router.navigate(['/s', slug, 'historico']);
  }

  private fetchAvailability(date: string): void {
    const professional = this.selectedProfessional();
    const service = this.selectedService();
    if (!professional || !service) return;

    this.availabilitySub?.unsubscribe();
    this.availabilityLoading.set(true);
    this.availability.set(null);

    this.availabilitySub = this.establishmentService
      .getAvailability(professional.id, date, service.durationMinutes)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        this.availability.set(result);
        this.availabilityLoading.set(false);
      });
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
