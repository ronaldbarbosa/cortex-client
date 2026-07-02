import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProfileAvatar {
  id: string;
  url: string;
  thumbUrl: string;
}

// Avatar do usuário logado via me/avatar (UserAvatar — ver cortex-api/docs/midia.md).
// Signal compartilhado entre a hero da tela de Conta e o card "Dados de cadastro".
@Injectable({ providedIn: 'root' })
export class ProfileAvatarService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly avatar = signal<ProfileAvatar | null>(null);
  private loaded = false;

  sync(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.http
      .get<ProfileAvatar | null>(`${this.base}/me/avatar`)
      .subscribe({ next: (a) => this.avatar.set(a ?? null), error: () => this.avatar.set(null) });
  }

  upload(file: File): Observable<ProfileAvatar> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ProfileAvatar>(`${this.base}/me/avatar`, form)
      .pipe(tap((a) => this.avatar.set(a)));
  }

  remove(): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/avatar`).pipe(tap(() => this.avatar.set(null)));
  }
}
