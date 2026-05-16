import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { catchError, of, Subscription } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { AuthService } from '../../core/auth/auth.service';
import { EstablishmentService } from '../../core/establishment/establishment.service';
import {
  AppointmentSummary,
  ProfessionalAvailability,
} from '../../core/establishment/establishment.model';

type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';

interface DateOption {
  value: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  Scheduled: 'Agendado',
  Confirmed: 'Confirmado',
  InProgress: 'Em andamento',
  Completed: 'Concluído',
  Cancelled: 'Cancelado',
  NoShow: 'Não compareceu',
};

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  Scheduled: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
  Confirmed: 'bg-accent/15 text-accent border-accent/30',
  InProgress: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
  Completed: 'bg-green-900/40 text-green-400 border-green-800/50',
  Cancelled: 'bg-red-900/40 text-red-400 border-red-800/50',
  NoShow: 'bg-orange-900/40 text-orange-400 border-orange-800/50',
};

@Component({
  selector: 'app-history',
  imports: [IconComponent, NgClass],
  templateUrl: './history.html',
})
export class HistoryComponent implements OnInit {
  private auth = inject(AuthService);
  private establishmentService = inject(EstablishmentService);

  private clientId = this.auth.user()?.clientId ?? '';

  // null = loading; [] = empty/error; [...] = loaded
  readonly appointments = signal<AppointmentSummary[] | null>(null);
  readonly cancelling = signal<string | null>(null);

  // Reschedule modal state
  readonly reschedulingAppt = signal<AppointmentSummary | null>(null);
  readonly rescheduleDate = signal<string>(this.toDateString(new Date()));
  readonly rescheduleSlot = signal<string | null>(null);
  readonly rescheduleAvailability = signal<ProfessionalAvailability | null>(null);
  readonly rescheduleAvailabilityLoading = signal(false);
  readonly rescheduleSubmitting = signal(false);
  readonly rescheduleError = signal<string | null>(null);

  private rescheduleSub?: Subscription;

  readonly rescheduleDates = computed<DateOption[]>(() => {
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

  ngOnInit(): void {
    if (!this.clientId) {
      this.appointments.set([]);
      return;
    }

    this.establishmentService
      .getMyAppointments(this.clientId)
      .pipe(catchError(() => of([] as AppointmentSummary[])))
      .subscribe((list) => this.appointments.set(list));
  }

  get totalVisits(): number {
    return this.appointments()?.filter((a) => a.status === 'Completed').length ?? 0;
  }

  get totalSpent(): number {
    return (
      this.appointments()
        ?.filter((a) => a.status === 'Completed')
        .reduce((sum, a) => sum + this.appointmentPrice(a), 0) ?? 0
    );
  }

  get favoriteProfessional(): string {
    const completed = this.appointments()?.filter((a) => a.status === 'Completed');
    if (!completed?.length) return '—';
    const counts: Record<string, number> = {};
    for (const a of completed) {
      counts[a.professionalName] = (counts[a.professionalName] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  isUpcoming(appt: AppointmentSummary): boolean {
    return (
      (appt.status === 'Scheduled' || appt.status === 'Confirmed') &&
      new Date(appt.startAt) > new Date()
    );
  }

  cancel(appt: AppointmentSummary): void {
    this.cancelling.set(appt.id);
    this.establishmentService.cancelAppointment(appt.id, 'Cancelado pelo cliente').subscribe({
      next: (updated) => {
        this.cancelling.set(null);
        this.appointments.update((list) =>
          list ? list.map((a) => (a.id === appt.id ? updated : a)) : list,
        );
      },
      error: () => this.cancelling.set(null),
    });
  }

  openReschedule(appt: AppointmentSummary): void {
    const today = this.toDateString(new Date());
    this.reschedulingAppt.set(appt);
    this.rescheduleDate.set(today);
    this.rescheduleSlot.set(null);
    this.rescheduleError.set(null);
    this.fetchRescheduleAvailability(appt, today);
  }

  closeReschedule(): void {
    this.rescheduleSub?.unsubscribe();
    this.reschedulingAppt.set(null);
    this.rescheduleAvailability.set(null);
  }

  selectRescheduleDate(date: string): void {
    this.rescheduleDate.set(date);
    this.rescheduleSlot.set(null);
    const appt = this.reschedulingAppt();
    if (appt) this.fetchRescheduleAvailability(appt, date);
  }

  selectRescheduleSlot(slot: string): void {
    this.rescheduleSlot.set(slot);
  }

  submitReschedule(): void {
    const appt = this.reschedulingAppt();
    const slot = this.rescheduleSlot();
    const date = this.rescheduleDate();
    if (!appt || !slot) return;

    this.rescheduleSubmitting.set(true);
    this.rescheduleError.set(null);

    this.establishmentService
      .rescheduleAppointment(appt.id, {
        clientId: appt.clientId,
        professionalId: appt.professionalId,
        startAt: new Date(`${date}T${slot}:00`).toISOString(),
        serviceIds: appt.services.map((s) => s.serviceId),
      })
      .subscribe({
        next: (updated) => {
          this.rescheduleSubmitting.set(false);
          this.appointments.update((list) =>
            list ? list.map((a) => (a.id === appt.id ? updated : a)) : list,
          );
          this.closeReschedule();
        },
        error: () => {
          this.rescheduleSubmitting.set(false);
          this.rescheduleError.set('Não foi possível reagendar. Tente novamente.');
        },
      });
  }

  private fetchRescheduleAvailability(appt: AppointmentSummary, date: string): void {
    const totalMinutes = appt.services.reduce((sum, s) => sum + s.durationMinutesSnapshot, 0);

    this.rescheduleSub?.unsubscribe();
    this.rescheduleAvailabilityLoading.set(true);
    this.rescheduleAvailability.set(null);

    this.rescheduleSub = this.establishmentService
      .getAvailability(appt.professionalId, date, totalMinutes)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        this.rescheduleAvailability.set(result);
        this.rescheduleAvailabilityLoading.set(false);
      });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status as AppointmentStatus] ?? status;
  }

  statusClass(status: string): string {
    return STATUS_CLASSES[status as AppointmentStatus] ?? '';
  }

  formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(isoDate));
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  serviceLabel(a: AppointmentSummary): string {
    return a.services.map((s) => s.serviceName).join(', ');
  }

  appointmentPrice(a: AppointmentSummary): number {
    return a.services.reduce((sum, s) => sum + s.priceSnapshot, 0);
  }

  private toDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
