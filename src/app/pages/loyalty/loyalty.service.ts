import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type LoyaltyType = 0 | 1 | 2; // 0=Points, 1=Visits, 2=Cashback

export interface LoyaltyProgramDto {
  type: LoyaltyType;
  isActive: boolean;
  pointsPerReal: number;
  redemptionRate: number;
  pointsExpireDays: number | null;
  visitsRequired: number;
  rewardDescription: string;
  cashbackPercentage: number;
  hasBirthdayBonus: boolean;
  birthdayMultiplier: number;
}

export interface LoyaltyClientSummaryDto {
  loyaltyPoints: number;
  loyaltyBalance: number;
}

export interface LoyaltyTransactionDto {
  id: string;
  type: 'Earn' | 'Redeem' | 'Expire';
  amount: number;
  description: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/loyalty`;

  getProgram(): Observable<LoyaltyProgramDto> {
    return this.http.get<LoyaltyProgramDto>(`${this.base}/program`);
  }

  getClientSummary(clientId: string): Observable<LoyaltyClientSummaryDto> {
    return this.http.get<LoyaltyClientSummaryDto>(`${this.base}/clients/${clientId}/summary`);
  }

  getTransactions(clientId: string): Observable<LoyaltyTransactionDto[]> {
    return this.http.get<LoyaltyTransactionDto[]>(`${this.base}/clients/${clientId}/transactions`);
  }

  redeem(clientId: string, amount: number): Observable<void> {
    return this.http.post<void>(`${this.base}/clients/${clientId}/redeem`, { amount });
  }
}
