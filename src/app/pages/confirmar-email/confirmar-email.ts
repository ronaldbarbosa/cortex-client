import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-confirmar-email',
  imports: [IconComponent],
  templateUrl: './confirmar-email.html',
})
export class ConfirmarEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  status = signal<'loading' | 'success' | 'error' | 'invalid'>('loading');

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const userId = params.get('userId');
    const newEmail = params.get('newEmail');
    const token = params.get('token');

    if (!userId || !newEmail || !token) {
      this.status.set('invalid');
      return;
    }

    this.http
      .post<void>(`${environment.apiUrl}/auth/confirm-email-change`, { userId, newEmail, token })
      .subscribe({
        next: () => this.status.set('success'),
        error: () => this.status.set('error'),
      });
  }
}
