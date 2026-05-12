import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../tenant/tenant-context.service';
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

  private baseUrl = computed(
    () => `${environment.apiUrl}/public/establishments/${this.tenantContext.slug()}`,
  );

  getServices(): Observable<PublicServiceCategory[]> {
    return this.http.get<PublicServiceCategory[]>(`${this.baseUrl()}/services`);
  }

  getProfessionals(): Observable<PublicProfessional[]> {
    return this.http.get<PublicProfessional[]>(`${this.baseUrl()}/professionals`);
  }

  getAvailability(
    professionalId: string,
    date: string,
    durationMinutes: number,
  ): Observable<ProfessionalAvailability> {
    return this.http.get<ProfessionalAvailability>(
      `${this.baseUrl()}/professionals/${professionalId}/availability`,
      { params: { date, durationMinutes } },
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
