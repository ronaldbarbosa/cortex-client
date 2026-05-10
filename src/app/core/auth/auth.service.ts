import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../tenant/tenant-context.service';
import { ClientAuthResponse, ClientUser } from './auth.model';

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

  login(email: string, password: string): Observable<void> {
    const tenantId = this.tenantContext.tenantId();
    return this.http
      .post<ClientAuthResponse>(`${this.base}/login`, { email, password, tenantId })
      .pipe(
        tap((res) => this.applySession(res)),
        map(() => void 0),
      );
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
    const tenantId = this.tenantContext.tenantId() || localStorage.getItem(TENANT_ID_KEY);

    if (!refreshToken || !tenantId) {
      return throwError(() => new Error('No session to refresh'));
    }

    return this.http
      .post<ClientAuthResponse>(`${this.base}/refresh`, { refreshToken, tenantId })
      .pipe(
        tap((res) => this.applySession(res)),
        map(() => void 0),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
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
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const fullName: string = claims['name'] ?? claims['email'] ?? '';
      const [firstName = '', ...rest] = fullName.split(' ');
      return {
        id: claims['sub'],
        email: claims['email'],
        firstName,
        lastName: rest.join(' '),
      };
    } catch {
      return null;
    }
  }
}
