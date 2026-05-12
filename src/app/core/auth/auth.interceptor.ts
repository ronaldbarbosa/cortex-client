import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const publicPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/public/'];
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
