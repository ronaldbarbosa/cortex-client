import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Nunca anexar o Bearer a chamadas fora da nossa API (ex.: ViaCEP) — evita vazar o token para terceiros.
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/enroll',
    '/public/',
  ];
  if (publicPaths.some((p) => req.url.includes(p))) {
    return next(req);
  }

  const token = auth.accessToken();
  const outgoing = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return auth.refresh().pipe(
          switchMap(() => {
            const fresh = auth.accessToken();
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${fresh}` } }));
          }),
          catchError((refreshError) => {
            auth.logout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
