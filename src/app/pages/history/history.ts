import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { catchError, firstValueFrom, of, Subscription } from 'rxjs';
import { AlertComponent } from '../../shared/ui/alert/alert';
import { IconComponent } from '../../shared/ui/icon/icon';
import { apiErrorMessage } from '../../core/utils/api-error';
import { ConfirmDialogService } from '../../shared/ui/overlay/confirm-dialog.service';
import { ToastService } from '../../shared/ui/overlay/toast.service';
import { ProofViewerModalComponent } from '../../shared/ui/proof-viewer-modal/proof-viewer-modal';
import { AuthService } from '../../core/auth/auth.service';
import { EstablishmentService } from '../../core/establishment/establishment.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { UnitContextService } from '../../core/unit/unit-context.service';
import {
  AppointmentDepositSummary,
  AppointmentSummary,
  DepositProofDto,
  ProfessionalAvailability,
} from '../../core/establishment/establishment.model';

type AppointmentStatus =
  | 'Scheduled'
  | 'AwaitingProof'
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
  // Sinal pendente de confirmação pelo salão — ver docs/sinal.md (mecânica completa é PR 4).
  AwaitingProof: 'Aguardando confirmação do sinal',
  Confirmed: 'Confirmado',
  InProgress: 'Em andamento',
  Completed: 'Concluído',
  Cancelled: 'Cancelado',
  NoShow: 'Não compareceu',
};

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  Scheduled: 'bg-warning/15 text-warning border-warning/30',
  AwaitingProof: 'bg-warning/15 text-warning border-warning/30',
  Confirmed: 'bg-accent/15 text-accent border-accent/30',
  InProgress: 'bg-info/15 text-info border-info/30',
  Completed: 'bg-success/15 text-success border-success/30',
  Cancelled: 'bg-danger/15 text-danger border-danger/30',
  NoShow: 'bg-danger/10 text-danger/60 border-danger/20',
};

@Component({
  selector: 'app-history',
  imports: [AlertComponent, IconComponent, NgClass, ProofViewerModalComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './history.html',
})
export class HistoryComponent implements OnInit {
  private auth = inject(AuthService);
  private establishmentService = inject(EstablishmentService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private tenantContext = inject(TenantContextService);
  private unitContext = inject(UnitContextService);

  private clientId = this.auth.user()?.clientId ?? '';

  // null = loading; [] = empty/error; [...] = loaded
  readonly appointments = signal<AppointmentSummary[] | null>(null);
  readonly cancelling = signal<string | null>(null);

  // Comprovante do sinal (docs/sinal.md) — por agendamento (AwaitingProof pode ocorrer em mais
  // de um ao mesmo tempo). Chave = appointment id; ausente = ainda não verificado/sem comprovante.
  readonly depositProofs = signal<Record<string, DepositProofDto | null>>({});
  readonly uploadingProofFor = signal<string | null>(null);
  readonly viewingProof = signal<DepositProofDto | null>(null);

  // Devolução do sinal (docs/sinal.md §8) — nota + comprovante, só quando o sinal foi
  // efetivamente devolvido (Refunded). Anexado pelo salão; o cliente só consulta.
  readonly refundInfo = signal<Record<string, AppointmentDepositSummary | null>>({});
  readonly refundProofs = signal<Record<string, DepositProofDto | null>>({});

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
      .subscribe((list) => {
        this.appointments.set(list);
        this.loadDepositProofs(list);
      });
  }

  private loadDepositProofs(list: AppointmentSummary[]): void {
    for (const appt of list) {
      if (appt.status === 'AwaitingProof') {
        this.establishmentService
          .getDepositProof(appt.id)
          .pipe(catchError(() => of(null)))
          .subscribe((proof) => {
            this.depositProofs.update((m) => ({ ...m, [appt.id]: proof }));
          });
      } else if (appt.status === 'Cancelled') {
        this.establishmentService
          .getDeposit(appt.id)
          .pipe(catchError(() => of(null)))
          .subscribe((info) => {
            this.refundInfo.update((m) => ({ ...m, [appt.id]: info }));
            if (info?.status !== 'Refunded') return;
            this.establishmentService
              .getDepositRefundProof(appt.id)
              .pipe(catchError(() => of(null)))
              .subscribe((proof) => {
                this.refundProofs.update((m) => ({ ...m, [appt.id]: proof }));
              });
          });
      }
    }
  }

  // Canal de contato direto do sinal (docs/sinal.md §7) — mesmo padrão de book.ts.
  whatsappDepositLink(): string | null {
    const digits = this.unitContext.unit()?.phone?.replace(/\D/g, '');
    if (!digits) return null;
    const message = encodeURIComponent(
      'Olá! Preciso negociar o sinal do meu agendamento na ' + this.tenantContext.name() + '.',
    );
    return `https://wa.me/55${digits}?text=${message}`;
  }

  // Comprovante do sinal — o cliente anexa o próprio; a conferência continua exclusiva do
  // salão. Aceita PDF além de imagem (docs/midia.md §2.2).
  onProofSelected(event: Event, appt: AppointmentSummary): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      this.toast.error('Formato não suportado.', 'Use JPEG, PNG, WebP ou PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toast.error('Arquivo muito grande.', 'O tamanho máximo é 10 MB.');
      return;
    }

    this.uploadingProofFor.set(appt.id);
    this.establishmentService.uploadDepositProof(appt.id, file).subscribe({
      next: (proof) => {
        this.uploadingProofFor.set(null);
        this.depositProofs.update((m) => ({ ...m, [appt.id]: proof }));
        this.toast.success('Comprovante enviado.', 'O salão vai conferir e confirmar seu horário.');
      },
      error: (err) => {
        this.uploadingProofFor.set(null);
        this.toast.error('Erro ao enviar comprovante.', apiErrorMessage(err, 'Tente novamente.'));
      },
    });
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
      (appt.status === 'Scheduled' ||
        appt.status === 'AwaitingProof' ||
        appt.status === 'Confirmed') &&
      new Date(appt.startAt) > new Date()
    );
  }

  async cancel(appt: AppointmentSummary): Promise<void> {
    // Sinal pago (Confirmed) — avisa ANTES de confirmar se o cancelamento agora devolve ou não
    // (docs/sinal.md §8). isWithinRefundWindow vem pronto do backend (fuso do salão).
    const deposit = await firstValueFrom(
      this.establishmentService.getDeposit(appt.id).pipe(catchError(() => of(null))),
    );

    let message = 'Tem certeza de que deseja cancelar este horário?';
    if (deposit?.status === 'Confirmed') {
      message = deposit.isWithinRefundWindow
        ? 'Tem certeza? Você pagou um sinal para este horário — ele será devolvido, conforme a política do salão.'
        : 'Tem certeza? Você pagou um sinal para este horário — esse cancelamento está fora do prazo de devolução e o valor não será devolvido.';
    }

    const ok = await this.confirmDialog.confirm({
      title: 'Cancelar agendamento?',
      message,
      tone: 'danger',
      icon: 'x',
      confirmLabel: 'Cancelar agendamento',
      cancelLabel: 'Manter',
    });
    if (!ok) return;

    this.cancelling.set(appt.id);
    this.establishmentService.cancelAppointment(appt.id, 'Cancelado pelo cliente').subscribe({
      next: (updated) => {
        this.cancelling.set(null);
        this.appointments.update((list) =>
          list ? list.map((a) => (a.id === appt.id ? updated : a)) : list,
        );
        this.toast.success('Agendamento cancelado.');
      },
      error: () => {
        this.cancelling.set(null);
        this.toast.error('Erro ao cancelar.', 'Tente novamente.');
      },
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

    const rewardService = appt.services.find((s) => s.isReward);
    this.establishmentService
      .rescheduleAppointment(appt.id, {
        clientId: appt.clientId,
        professionalId: appt.professionalId,
        // Hora-de-parede do salão (sem fuso) — o backend converte para UTC.
        startLocal: `${date}T${slot}:00`,
        serviceIds: appt.services.map((s) => s.serviceId),
        rewardServiceId: rewardService?.serviceId,
      })
      .subscribe({
        next: (updated) => {
          this.rescheduleSubmitting.set(false);
          this.appointments.update((list) =>
            list ? list.map((a) => (a.id === appt.id ? updated : a)) : list,
          );
          this.closeReschedule();
          this.toast.success('Agendamento reagendado.');
        },
        error: (err) => {
          this.rescheduleSubmitting.set(false);
          this.rescheduleError.set(
            apiErrorMessage(err, 'Não foi possível reagendar. Tente novamente.'),
          );
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

  // Recebe a hora-de-parede do salão (ISO sem fuso) — exibe direto, sem conversão.
  formatDate(localIso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(localIso));
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
