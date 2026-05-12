import { Component, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { ClientProfile } from '../../core/auth/auth.model';

@Component({
  selector: 'app-account',
  imports: [IconComponent, ReactiveFormsModule],
  templateUrl: './account.html',
})
export class AccountComponent {
  private auth = inject(AuthService);
  private authModal = inject(AuthModalService);
  private fb = inject(FormBuilder);

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly profile = signal<ClientProfile | null>(null);
  readonly profileLoading = signal(false);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
  });

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadProfile();
      } else {
        this.profile.set(null);
        this.editing.set(false);
      }
    });
  }

  openLogin(): void {
    this.authModal.open();
  }

  startEditing(): void {
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.editing.set(true);
  }

  cancelEditing(): void {
    const p = this.profile();
    if (p) {
      this.form.setValue({ firstName: p.firstName, lastName: p.lastName, phone: p.phone });
    }
    this.editing.set(false);
    this.saveError.set(null);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { firstName, lastName, phone } = this.form.getRawValue();
    this.auth.updateProfile({ firstName, lastName, phone }).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.saving.set(false);
        this.editing.set(false);
        this.saveSuccess.set(true);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Não foi possível salvar. Tente novamente.');
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  }

  private loadProfile(): void {
    this.profileLoading.set(true);
    this.auth
      .getProfile()
      .pipe(catchError(() => of(null)))
      .subscribe((p) => {
        this.profile.set(p);
        this.profileLoading.set(false);
        if (p) {
          this.form.setValue({ firstName: p.firstName, lastName: p.lastName, phone: p.phone });
        }
      });
  }
}
