import { Component, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { FieldErrorComponent } from '../../shared/ui/overlay/field-error';
import { ToastService } from '../../shared/ui/overlay/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import {
  ClientProfile,
  SetupTotpResponse,
  TwoFactorStatusResponse,
} from '../../core/auth/auth.model';
import { apiErrorMessage } from '../../core/utils/api-error';

type TwoFactorPanel = 'idle' | 'setup-totp' | 'setup-email' | 'done' | 'disable' | 'regen';

@Component({
  selector: 'app-account',
  imports: [IconComponent, ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './account.html',
})
export class AccountComponent {
  private auth = inject(AuthService);
  private authModal = inject(AuthModalService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly profile = signal<ClientProfile | null>(null);
  readonly profileLoading = signal(false);
  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly twoFactorStatus = signal<TwoFactorStatusResponse | null>(null);
  readonly twoFactorPanel = signal<TwoFactorPanel>('idle');
  readonly twoFactorLoading = signal(false);
  readonly setupTotpData = signal<SetupTotpResponse | null>(null);
  readonly totpQrDataUrl = signal<string | null>(null);
  readonly recoveryCodes = signal<string[]>([]);
  readonly useRecoveryForDisable = signal(false);
  readonly twoFactorCodeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]],
  });

  readonly emailForm = this.fb.nonNullable.group({
    newEmail: ['', [Validators.required, Validators.email]],
  });
  readonly emailSaving = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    birthDate: ['' as string],
    acceptsMarketing: [false],
    cpf: [''],
    gender: [''],
    secondaryPhone: [''],
    address: this.fb.nonNullable.group({
      street: [''],
      number: [''],
      complement: [''],
      neighborhood: [''],
      city: [''],
      state: [''],
      postalCode: [''],
    }),
  });

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadProfile();
        this.loadTwoFactorStatus();
      } else {
        this.profile.set(null);
        this.editing.set(false);
        this.twoFactorStatus.set(null);
        this.twoFactorPanel.set('idle');
      }
    });
  }

  openLogin(): void {
    this.authModal.open();
  }

  startEditing(): void {
    this.editing.set(true);
  }

  cancelEditing(): void {
    const p = this.profile();
    if (p) this.fillForm(p);
    this.editing.set(false);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();

    this.auth
      .updateProfile({
        firstName: raw.firstName,
        lastName: raw.lastName,
        phone: raw.phone,
        birthDate: raw.birthDate ? this.parsePtBrDate(raw.birthDate) : null,
        acceptsMarketing: raw.acceptsMarketing,
        cpf: raw.cpf.replace(/\D/g, '') || null,
        gender: raw.gender || null,
        secondaryPhone: raw.secondaryPhone || null,
        address: this.buildAddress(raw.address),
      })
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.saving.set(false);
          this.editing.set(false);
          this.toast.success('Dados atualizados.');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Não foi possível salvar.', 'Tente novamente.');
        },
      });
  }

  formatBirthDate(date: string): string {
    return this.isoToPtBr(date);
  }

  genderLabel(g: string): string {
    return (
      (
        {
          Female: 'Feminino',
          Male: 'Masculino',
          Other: 'Outro',
          Undisclosed: 'Prefiro não informar',
        } as Record<string, string>
      )[g] ?? g
    );
  }

  formatAddressLine(p: ClientProfile): string | null {
    const a = p.address;
    if (!a) return null;
    const parts = [a.street, a.number, a.complement, a.neighborhood, a.city, a.state]
      .filter(Boolean)
      .join(', ');
    return parts || null;
  }

  maskPhone(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = this.applyPhoneMask(el.value);
    el.value = v;
    this.form.controls.phone.setValue(v, { emitEvent: false });
  }

  maskSecondaryPhone(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = this.applyPhoneMask(el.value);
    el.value = v;
    this.form.controls.secondaryPhone.setValue(v, { emitEvent: false });
  }

  maskDate(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = this.applyDateMask(el.value);
    el.value = v;
    this.form.controls.birthDate.setValue(v, { emitEvent: false });
  }

  requestEmailChange(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    const { newEmail } = this.emailForm.getRawValue();
    this.emailSaving.set(true);

    this.auth.requestEmailChange(newEmail).subscribe({
      next: () => {
        this.emailSaving.set(false);
        this.emailForm.reset();
        this.toast.success(
          'Link enviado.',
          'Verifique a caixa de entrada do novo e-mail para confirmar.',
        );
      },
      error: (err) => {
        this.emailSaving.set(false);
        this.toast.error(
          'Erro ao solicitar alteração de e-mail.',
          apiErrorMessage(err, 'Tente novamente.'),
        );
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  loadTwoFactorStatus(): void {
    this.auth
      .getTwoFactorStatus()
      .pipe(catchError(() => of(null)))
      .subscribe((s) => this.twoFactorStatus.set(s));
  }

  startSetupTotp(): void {
    this.twoFactorLoading.set(true);
    this.auth.setupTotp().subscribe({
      next: (data) => {
        this.setupTotpData.set(data);
        this.twoFactorCodeForm.reset();
        this.twoFactorPanel.set('setup-totp');
        this.twoFactorLoading.set(false);
        import('qrcode').then((QRCode) => {
          QRCode.toDataURL(data.authenticatorUri, { width: 200, margin: 2 }).then((url) =>
            this.totpQrDataUrl.set(url),
          );
        });
      },
      error: () => {
        this.twoFactorLoading.set(false);
        this.toast.error('Erro', 'Não foi possível iniciar a configuração.');
      },
    });
  }

  confirmTotpSetup(): void {
    if (this.twoFactorCodeForm.invalid) {
      this.twoFactorCodeForm.markAllAsTouched();
      return;
    }
    const { code } = this.twoFactorCodeForm.getRawValue();
    this.twoFactorLoading.set(true);
    this.auth.confirmTotpSetup(code).subscribe({
      next: (res) => {
        this.recoveryCodes.set(res.recoveryCodes);
        this.twoFactorStatus.update((s) => (s ? { ...s, enabled: true, method: 'totp' } : s));
        this.twoFactorPanel.set('done');
        this.twoFactorLoading.set(false);
      },
      error: () => {
        this.twoFactorLoading.set(false);
        this.toast.error('Código inválido', 'Verifique o código e tente novamente.');
      },
    });
  }

  startSetupEmail(): void {
    this.twoFactorLoading.set(true);
    this.auth.enableEmail2Fa().subscribe({
      next: (res) => {
        this.recoveryCodes.set(res.recoveryCodes);
        this.twoFactorStatus.update((s) => (s ? { ...s, enabled: true, method: 'email' } : s));
        this.twoFactorPanel.set('done');
        this.twoFactorLoading.set(false);
      },
      error: () => {
        this.twoFactorLoading.set(false);
        this.toast.error('Erro', 'Não foi possível ativar a verificação por e-mail.');
      },
    });
  }

  startDisable2Fa(): void {
    this.twoFactorCodeForm.reset();
    this.useRecoveryForDisable.set(false);
    this.twoFactorPanel.set('disable');
  }

  confirm2FaDisable(): void {
    const method = this.twoFactorStatus()?.method;
    if (method === 'totp' && this.twoFactorCodeForm.invalid) {
      this.twoFactorCodeForm.markAllAsTouched();
      return;
    }
    const { code } = this.twoFactorCodeForm.getRawValue();
    const isRecovery = this.useRecoveryForDisable();
    this.twoFactorLoading.set(true);
    this.auth
      .disable2Fa(
        method === 'totp' && !isRecovery ? code : undefined,
        method === 'totp' && isRecovery ? code : undefined,
      )
      .subscribe({
        next: () => {
          this.twoFactorStatus.update((s) => (s ? { ...s, enabled: false, method: 'none' } : s));
          this.twoFactorPanel.set('idle');
          this.twoFactorLoading.set(false);
          this.toast.success('Verificação em 2 etapas desativada.');
        },
        error: () => {
          this.twoFactorLoading.set(false);
          this.toast.error('Erro', 'Código inválido ou expirado.');
        },
      });
  }

  startRegen(): void {
    this.twoFactorCodeForm.reset();
    this.twoFactorPanel.set('regen');
  }

  confirmRegen(): void {
    if (this.twoFactorCodeForm.invalid) {
      this.twoFactorCodeForm.markAllAsTouched();
      return;
    }
    const { code } = this.twoFactorCodeForm.getRawValue();
    this.twoFactorLoading.set(true);
    this.auth.regenerateRecoveryCodes(code).subscribe({
      next: (res) => {
        this.recoveryCodes.set(res.recoveryCodes);
        this.twoFactorPanel.set('done');
        this.twoFactorLoading.set(false);
      },
      error: () => {
        this.twoFactorLoading.set(false);
        this.toast.error('Código inválido', 'Verifique o código e tente novamente.');
      },
    });
  }

  cancelTwoFactorPanel(): void {
    this.twoFactorPanel.set('idle');
    this.twoFactorCodeForm.reset();
    this.setupTotpData.set(null);
    this.totpQrDataUrl.set(null);
    this.useRecoveryForDisable.set(false);
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  }

  private fillForm(p: ClientProfile): void {
    this.form.patchValue({
      firstName: p.firstName,
      lastName: p.lastName,
      phone: this.formatPhone(p.phone),
      birthDate: p.birthDate ? this.isoToPtBr(p.birthDate) : '',
      acceptsMarketing: p.acceptsMarketing,
      cpf: p.cpf ?? '',
      gender: p.gender ?? '',
      secondaryPhone: p.secondaryPhone ? this.formatPhone(p.secondaryPhone) : '',
      address: {
        street: p.address?.street ?? '',
        number: p.address?.number ?? '',
        complement: p.address?.complement ?? '',
        neighborhood: p.address?.neighborhood ?? '',
        city: p.address?.city ?? '',
        state: p.address?.state ?? '',
        postalCode: p.address?.postalCode ?? '',
      },
    });
  }

  private loadProfile(): void {
    this.profileLoading.set(true);
    this.auth
      .getProfile()
      .pipe(catchError(() => of(null)))
      .subscribe((p) => {
        this.profile.set(p);
        this.profileLoading.set(false);
        if (p) this.fillForm(p);
      });
  }

  private buildAddress(a: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  }): {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  } | null {
    const n = (s: string): string | null => s.trim() || null;
    const addr = {
      street: n(a.street),
      number: n(a.number),
      complement: n(a.complement),
      neighborhood: n(a.neighborhood),
      city: n(a.city),
      state: n(a.state),
      postalCode: n(a.postalCode),
    };
    return Object.values(addr).some((v) => v !== null) ? addr : null;
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

  private formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, '').substring(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.substring(0, 2)}) ${d.substring(2)}`;
    if (d.length <= 10) return `(${d.substring(0, 2)}) ${d.substring(2, 6)}-${d.substring(6)}`;
    return `(${d.substring(0, 2)}) ${d.substring(2, 7)}-${d.substring(7)}`;
  }

  private applyPhoneMask(raw: string): string {
    return this.formatPhone(raw);
  }

  private applyDateMask(raw: string): string {
    let v = raw.replace(/\D/g, '').substring(0, 8);
    if (v.length > 4) v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    else if (v.length > 2) v = `${v.substring(0, 2)}/${v.substring(2)}`;
    return v;
  }
}
