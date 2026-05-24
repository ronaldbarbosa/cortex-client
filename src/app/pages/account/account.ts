import { Component, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { AlertComponent } from '../../shared/ui/alert/alert';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { ClientProfile } from '../../core/auth/auth.model';

@Component({
  selector: 'app-account',
  imports: [IconComponent, ReactiveFormsModule, AlertComponent],
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
    birthDate: ['' as string],
    acceptsMarketing: [false],
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
      this.form.setValue({
        firstName: p.firstName,
        lastName: p.lastName,
        phone: this.formatPhone(p.phone),
        birthDate: p.birthDate ? this.isoToPtBr(p.birthDate) : '',
        acceptsMarketing: p.acceptsMarketing,
      });
    }
    this.editing.set(false);
    this.saveError.set(null);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { firstName, lastName, phone, birthDate, acceptsMarketing } = this.form.getRawValue();
    this.auth
      .updateProfile({
        firstName,
        lastName,
        phone,
        birthDate: birthDate ? this.parsePtBrDate(birthDate) : null,
        acceptsMarketing,
      })
      .subscribe({
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

  formatBirthDate(date: string): string {
    return this.isoToPtBr(date);
  }

  private isoToPtBr(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private parsePtBrDate(value: string): string | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;
    const [, day, month, year] = match;
    const d = new Date(+year, +month - 1, +day);
    if (d.getFullYear() !== +year || d.getMonth() !== +month - 1 || d.getDate() !== +day)
      return null;
    return `${year}-${month}-${day}`;
  }

  maskDate(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = this.applyDateMask(el.value);
    el.value = v;
    this.form.controls.birthDate.setValue(v, { emitEvent: false });
  }

  maskPhone(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = this.formatPhone(el.value);
    el.value = v;
    this.form.controls.phone.setValue(v, { emitEvent: false });
  }

  private formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, '').substring(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.substring(0, 2)}) ${d.substring(2)}`;
    if (d.length <= 10) return `(${d.substring(0, 2)}) ${d.substring(2, 6)}-${d.substring(6)}`;
    return `(${d.substring(0, 2)}) ${d.substring(2, 7)}-${d.substring(7)}`;
  }

  private applyDateMask(raw: string): string {
    let v = raw.replace(/\D/g, '').substring(0, 8);
    if (v.length > 4) v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    else if (v.length > 2) v = `${v.substring(0, 2)}/${v.substring(2)}`;
    return v;
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
          this.form.setValue({
            firstName: p.firstName,
            lastName: p.lastName,
            phone: this.formatPhone(p.phone),
            birthDate: p.birthDate ? this.isoToPtBr(p.birthDate) : '',
            acceptsMarketing: p.acceptsMarketing,
          });
        }
      });
  }
}
