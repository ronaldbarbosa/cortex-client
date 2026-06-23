import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PlanSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  includedSeats: number;
  priceMonthly: number;
  priceAnnual: number;
  trialDays: number;
  entitlements: {
    onlineBooking: boolean;
    loyaltyProgram: boolean;
    stockManagement: boolean;
    multiUnit: boolean;
    advancedReports: boolean;
    whatsappNotifications: boolean;
  };
  isDefault: boolean;
  sortOrder: number;
}

export interface RegisterTenantRequest {
  tenantName: string;
  tenantSlug: string;
  tenantPhone?: string;
  tenantEmail?: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword: string;
  planId?: string;
}

export interface RegistrationPendingResponse {
  email: string;
  tenantSlug: string;
}

@Injectable({ providedIn: 'root' })
export class TrialService {
  private http = inject(HttpClient);

  getPlans(): Observable<PlanSummary[]> {
    return this.http.get<PlanSummary[]>(`${environment.apiUrl}/plans`);
  }

  register(req: RegisterTenantRequest): Observable<RegistrationPendingResponse> {
    return this.http.post<RegistrationPendingResponse>(`${environment.apiUrl}/auth/register`, req);
  }
}
