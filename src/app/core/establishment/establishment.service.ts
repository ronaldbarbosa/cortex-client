import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../tenant/tenant-context.service';
import {
  ProfessionalAvailability,
  PublicProfessional,
  PublicServiceCategory,
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
}
