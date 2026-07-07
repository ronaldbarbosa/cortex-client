import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../tenant/tenant-context.service';
import { UnitContextService } from '../unit/unit-context.service';
import {
  AppointmentDepositPreview,
  AppointmentDepositSummary,
  AppointmentSummary,
  CreateAppointmentRequest,
  DepositProofDto,
  ProfessionalAvailability,
  PublicProfessional,
  PublicServiceCategory,
  RescheduleAppointmentRequest,
} from './establishment.model';

@Injectable({ providedIn: 'root' })
export class EstablishmentService {
  private http = inject(HttpClient);
  private tenantContext = inject(TenantContextService);
  private unitContext = inject(UnitContextService);

  private baseUrl = computed(
    () => `${environment.apiUrl}/public/establishments/${this.tenantContext.slug()}`,
  );

  getServices(): Observable<PublicServiceCategory[]> {
    // Filtra pelos serviços oferecidos na filial escolhida (quando há unidade no contexto).
    const unitId = this.unitContext.unitId();
    const params: Record<string, string> = {};
    if (unitId) params['unitId'] = unitId;
    return this.http.get<PublicServiceCategory[]>(`${this.baseUrl()}/services`, { params });
  }

  getProfessionals(serviceIds?: string[]): Observable<PublicProfessional[]> {
    const unitId = this.unitContext.unitId();
    const params: Record<string, string | string[]> = {};
    if (unitId) params['unitId'] = unitId;
    // Filtra por quem executa TODOS os serviços escolhidos (some quem não faz, ex.: admin).
    if (serviceIds && serviceIds.length > 0) params['serviceIds'] = serviceIds;
    return this.http.get<PublicProfessional[]>(`${this.baseUrl()}/professionals`, { params });
  }

  getAvailability(
    professionalId: string,
    date: string,
    durationMinutes: number,
  ): Observable<ProfessionalAvailability> {
    const unitId = this.unitContext.unitId();
    const params: Record<string, string | number> = { date, durationMinutes };
    if (unitId) params['unitId'] = unitId;
    return this.http.get<ProfessionalAvailability>(
      `${this.baseUrl()}/professionals/${professionalId}/availability`,
      { params },
    );
  }

  createAppointment(req: CreateAppointmentRequest): Observable<AppointmentSummary> {
    return this.http.post<AppointmentSummary>(`${environment.apiUrl}/appointments`, req);
  }

  // Prévia do sinal (docs/sinal.md) — chamado antes de criar o agendamento, para informar o
  // cliente do valor/prazo ANTES de concluir a solicitação.
  previewDeposit(
    clientId: string,
    serviceIds: string[],
    startLocal: string,
  ): Observable<AppointmentDepositPreview> {
    const unitId = this.unitContext.unitId();
    const params: Record<string, string | string[]> = { clientId, startLocal, serviceIds };
    if (unitId) params['unitId'] = unitId;
    return this.http.get<AppointmentDepositPreview>(
      `${environment.apiUrl}/appointments/deposit-preview`,
      { params },
    );
  }

  getAppointment(id: string): Observable<AppointmentSummary> {
    return this.http.get<AppointmentSummary>(`${environment.apiUrl}/appointments/${id}`);
  }

  getMyAppointments(clientId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${environment.apiUrl}/appointments`, {
      params: { clientId },
    });
  }

  cancelAppointment(id: string, reason?: string): Observable<AppointmentSummary> {
    return this.http.post<AppointmentSummary>(`${environment.apiUrl}/appointments/${id}/cancel`, {
      reason: reason ?? null,
    });
  }

  rescheduleAppointment(
    id: string,
    req: RescheduleAppointmentRequest,
  ): Observable<AppointmentSummary> {
    return this.http.put<AppointmentSummary>(`${environment.apiUrl}/appointments/${id}`, req);
  }

  // Comprovante do sinal (docs/sinal.md) — o cliente anexa o próprio; a conferência continua
  // exclusiva do salão (ConfirmDepositCommand, no cortex-admin).
  getDepositProof(appointmentId: string): Observable<DepositProofDto | null> {
    return this.http.get<DepositProofDto | null>(
      `${environment.apiUrl}/appointments/${appointmentId}/deposit/proof`,
    );
  }

  uploadDepositProof(appointmentId: string, file: File): Observable<DepositProofDto> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<DepositProofDto>(
      `${environment.apiUrl}/appointments/${appointmentId}/deposit/proof`,
      form,
    );
  }

  getDeposit(appointmentId: string): Observable<AppointmentDepositSummary | null> {
    return this.http.get<AppointmentDepositSummary | null>(
      `${environment.apiUrl}/appointments/${appointmentId}/deposit`,
    );
  }

  // Comprovante de devolução (docs/sinal.md §8) — anexado pelo salão; o cliente só consulta.
  getDepositRefundProof(appointmentId: string): Observable<DepositProofDto | null> {
    return this.http.get<DepositProofDto | null>(
      `${environment.apiUrl}/appointments/${appointmentId}/deposit/refund-proof`,
    );
  }
}
