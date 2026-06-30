import { Component, ElementRef, effect, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TwoFactorChallengeResponse } from '../../../core/auth/auth.model';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import { IconComponent } from '../icon/icon';
import { FieldErrorComponent } from '../overlay/field-error';
import { ToastService } from '../overlay/toast.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login-modal',
  imports: [ReactiveFormsModule, IconComponent, FieldErrorComponent],
  templateUrl: './login-modal.html',
})
export class LoginModalComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private tenantContext = inject(TenantContextService);
  private toast = inject(ToastService);
  readonly authModal = inject(AuthModalService);

  @ViewChild('googleBtn') googleBtnRef?: ElementRef<HTMLDivElement>;

  mode = signal<'login' | 'register' | 'two-factor'>('login');

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  registerForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  codeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]],
  });

  loading = signal(false);
  showPassword = signal(false);
  challenge = signal<TwoFactorChallengeResponse | null>(null);
  useRecovery = signal(false);

  private googleInitialized = false;

  get loginEmail() {
    return this.loginForm.controls.email;
  }
  get loginPassword() {
    return this.loginForm.controls.password;
  }
  get regFirstName() {
    return this.registerForm.controls.firstName;
  }
  get regLastName() {
    return this.registerForm.controls.lastName;
  }
  get regEmail() {
    return this.registerForm.controls.email;
  }
  get regPhone() {
    return this.registerForm.controls.phone;
  }
  get regPassword() {
    return this.registerForm.controls.password;
  }

  constructor() {
    effect(() => {
      if (this.authModal.isOpen()) {
        this.mode.set('login');
        this.challenge.set(null);
        this.useRecovery.set(false);
        setTimeout(() => this.initGoogleButton());
      }
    });
  }

  ngOnDestroy(): void {
    window.google?.accounts?.id?.cancel();
  }

  maskPhone(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = this.formatPhone(el.value);
    el.value = v;
    this.registerForm.controls.phone.setValue(v, { emitEvent: false });
  }

  private formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, '').substring(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.substring(0, 2)}) ${d.substring(2)}`;
    if (d.length <= 10) return `(${d.substring(0, 2)}) ${d.substring(2, 6)}-${d.substring(6)}`;
    return `(${d.substring(0, 2)}) ${d.substring(2, 7)}-${d.substring(7)}`;
  }

  switchMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.showPassword.set(false);
    if (m === 'login') {
      setTimeout(() => this.initGoogleButton());
    }
  }

  backToLogin(): void {
    this.challenge.set(null);
    this.useRecovery.set(false);
    this.codeForm.reset();
    this.mode.set('login');
    setTimeout(() => this.initGoogleButton());
  }

  toggleRecovery(): void {
    this.useRecovery.update((v) => !v);
    this.codeForm.reset();
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { email, password } = this.loginForm.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (result) => {
        this.loading.set(false);
        if (result) {
          this.challenge.set(result);
          this.mode.set('two-factor');
        } else {
          this.authModal.notifySuccess();
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Credenciais inválidas', 'E-mail ou senha incorretos.');
      },
    });
  }

  submitCode(): void {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }
    const ch = this.challenge();
    if (!ch) return;

    this.loading.set(true);
    const { code } = this.codeForm.getRawValue();
    const isRecovery = this.useRecovery();

    this.auth
      .verifyTwoFactor(
        ch.challengeToken,
        isRecovery ? undefined : code,
        isRecovery ? code : undefined,
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.authModal.notifySuccess();
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Código inválido', 'Verifique o código e tente novamente.');
        },
      });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const v = this.registerForm.getRawValue();

    this.auth
      .register({
        tenantId: this.tenantContext.tenantId(),
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        password: v.password,
        phone: v.phone,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.authModal.notifySuccess();
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(
            'Erro ao criar conta',
            apiErrorMessage(
              err,
              'Não foi possível criar a conta. Verifique os dados e tente novamente.',
            ),
          );
        },
      });
  }

  close(): void {
    this.authModal.close();
  }

  private initGoogleButton(): void {
    if (!window.google?.accounts?.id || !this.googleBtnRef) return;

    if (!this.googleInitialized) {
      window.google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response) => this.handleGoogleResponse(response),
      });
      this.googleInitialized = true;
    }

    window.google.accounts.id.renderButton(this.googleBtnRef!.nativeElement, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'continue_with',
      width: 320,
    });
  }

  private handleGoogleResponse(response: google.accounts.id.CredentialResponse): void {
    this.loading.set(true);

    this.auth.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.loading.set(false);
        this.authModal.notifySuccess();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Erro de autenticação', 'Não foi possível autenticar com o Google.');
      },
    });
  }
}
