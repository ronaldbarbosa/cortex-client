import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../tenant/tenant-context.service';
import {
  ClientAuthResponse,
  ClientProfile,
  ClientUser,
  SetupTotpResponse,
  TwoFactorChallengeResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  UpdateProfileRequest,
} from './auth.model';

export interface RegisterClientRequest {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

const REFRESH_TOKEN_KEY = 'cortex.client.refresh_token';
const TENANT_ID_KEY = 'cortex.client.tenant_id';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tenantContext = inject(TenantContextService);

  private readonly base = `${environment.apiUrl}/auth`;

  private _accessToken = signal<string | null>(null);
  private _user = signal<ClientUser | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  register(req: RegisterClientRequest): Observable<void> {
    return this.http.post<ClientAuthResponse>(`${this.base}/register/client`, req).pipe(
      tap((res) => this.applySession(res)),
      map(() => void 0),
    );
  }

  login(email: string, password: string): Observable<TwoFactorChallengeResponse | null> {
    const tenantId = this.tenantContext.tenantId();
    return this.http
      .post<ClientAuthResponse | TwoFactorChallengeResponse>(`${this.base}/login`, {
        email,
        password,
        tenantId,
        // Login-convidado: se ainda não for cliente deste salão, entra sem ficha (criada no 1º agendamento).
        clientContext: true,
      })
      .pipe(
        map((res) => {
          if ('challengeToken' in res) return res as TwoFactorChallengeResponse;
          this.applySession(res as ClientAuthResponse);
          return null;
        }),
      );
  }

  verifyTwoFactor(challengeToken: string, code?: string, recoveryCode?: string): Observable<void> {
    return this.http
      .post<ClientAuthResponse>(`${this.base}/2fa/verify`, { challengeToken, code, recoveryCode })
      .pipe(
        tap((res) => this.applySession(res)),
        map(() => void 0),
      );
  }

  getTwoFactorStatus(): Observable<TwoFactorStatusResponse> {
    return this.http.get<TwoFactorStatusResponse>(`${this.base}/2fa/status`);
  }

  setupTotp(): Observable<SetupTotpResponse> {
    return this.http.post<SetupTotpResponse>(`${this.base}/2fa/setup/totp`, {});
  }

  confirmTotpSetup(code: string): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.base}/2fa/setup/totp/confirm`, { code });
  }

  enableEmail2Fa(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.base}/2fa/setup/email`, {});
  }

  disable2Fa(code?: string, recoveryCode?: string): Observable<void> {
    return this.http.post<void>(`${this.base}/2fa/disable`, { code, recoveryCode });
  }

  regenerateRecoveryCodes(code: string): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.base}/2fa/recovery-codes/regenerate`, {
      code,
    });
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.base}/request-password-reset`, { email, source: 'client' });
  }

  resetPassword(userId: string, token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/reset-password`, { userId, token, newPassword });
  }

  requestEmailChange(newEmail: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/me/request-email-change`, {
      newEmail,
      source: 'client',
    });
  }

  loginWithGoogle(idToken: string): Observable<void> {
    const tenantId = this.tenantContext.tenantId();
    return this.http
      .post<ClientAuthResponse>(`${this.base}/login/google`, { idToken, tenantId })
      .pipe(
        tap((res) => this.applySession(res)),
        map(() => void 0),
      );
  }

  refresh(): Observable<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    // Mira o tenant da SESSÃO ativa (persistido), não a slug que está sendo visualizada. Um cliente
    // logado no salão A pode navegar na página do salão B (onde ainda não tem vínculo); refrescar
    // contra B deslogaria. A troca de salão ativo acontece via enroll (primeiro agendamento).
    const tenantId = localStorage.getItem(TENANT_ID_KEY) || this.tenantContext.tenantId();

    if (!refreshToken || !tenantId) {
      return throwError(() => new Error('No session to refresh'));
    }

    return this.http
      .post<ClientAuthResponse>(`${this.base}/refresh`, {
        refreshToken,
        tenantId,
        clientContext: true,
      })
      .pipe(
        tap((res) => this.applySession(res)),
        map(() => void 0),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
        }),
      );
  }

  // Troca a sessão ativa para o salão informado (usado quando a slug muda, para a tela seguir o link).
  // Cliente do salão → sessão completa; não-cliente → sessão "convidada" (sem clientId), que ainda
  // permite agendar (o agendamento cria a ficha via enroll). Ver docs/multitenancy.md.
  switchToSalon(tenantId: string): Observable<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No session to switch'));
    }
    return this.http
      .post<ClientAuthResponse>(`${this.base}/refresh`, {
        refreshToken,
        tenantId,
        clientContext: true,
      })
      .pipe(
        tap((res) => this.applySession(res)),
        map(() => void 0),
      );
  }

  // Provisiona a ficha do cliente no salão em contexto (slug atual) e troca a sessão ativa para ele.
  // Usado no primeiro agendamento num salão onde o cliente ainda não tem vínculo (login global +
  // Client por salão). O backend cria/vincula o Client a partir do refresh token. Ver multitenancy.md.
  enroll(): Observable<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const tenantId = this.tenantContext.tenantId();

    if (!refreshToken || !tenantId) {
      return throwError(() => new Error('No session or salon to enroll'));
    }

    return this.http
      .post<ClientAuthResponse>(`${this.base}/enroll`, { refreshToken, tenantId })
      .pipe(
        tap((res) => this.applySession(res)),
        map(() => void 0),
      );
  }

  getProfile(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(`${this.base}/me`);
  }

  updateProfile(req: UpdateProfileRequest): Observable<ClientProfile> {
    return this.http.patch<ClientProfile>(`${this.base}/me`, req).pipe(
      tap((profile) => {
        this._user.update((u) =>
          u ? { ...u, firstName: profile.firstName, lastName: profile.lastName } : u,
        );
      }),
    );
  }

  logout(): void {
    const slug = this.tenantContext.slug();
    this.clearSession();
    this.router.navigate(['/s', slug, 'login']);
  }

  restoreSession(): Observable<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return of(void 0);
    return this.refresh().pipe(catchError(() => of(void 0)));
  }

  private applySession(res: ClientAuthResponse): void {
    this._accessToken.set(res.accessToken);
    this._user.set(this.decodeUser(res.accessToken));
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(TENANT_ID_KEY, res.tenantId);
  }

  private clearSession(): void {
    this._accessToken.set(null);
    this._user.set(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TENANT_ID_KEY);
  }

  private decodeUser(token: string): ClientUser | null {
    try {
      const payload = token.split('.')[1];
      const bytes = Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0),
      );
      const claims = JSON.parse(new TextDecoder().decode(bytes));
      const fullName: string = claims['name'] ?? claims['email'] ?? '';
      const [firstName = '', ...rest] = fullName.split(' ');
      return {
        id: claims['sub'],
        email: claims['email'],
        firstName,
        lastName: rest.join(' '),
        clientId: claims['client_id'] ?? null,
        tenantId: claims['tenant_id'] ?? null,
      };
    } catch {
      return null;
    }
  }
}
