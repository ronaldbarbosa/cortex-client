import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../tenant/tenant-context.service';
import { UnitContextService } from '../unit/unit-context.service';
import {
  AppointmentSummary,
  CreateAppointmentRequest,
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
    return this.http.get<PublicServiceCategory[]>(`${this.baseUrl()}/services`);
  }

  getProfessionals(): Observable<PublicProfessional[]> {
    const unitId = this.unitContext.unitId();
    const params: Record<string, string> = {};
    if (unitId) params['unitId'] = unitId;
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
}
