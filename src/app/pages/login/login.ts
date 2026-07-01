import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TwoFactorChallengeResponse } from '../../core/auth/auth.model';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { IconComponent } from '../../shared/ui/icon/icon';
import { AlertComponent } from '../../shared/ui/alert/alert';
import { FieldErrorComponent } from '../../shared/ui/overlay/field-error';
import { apiErrorMessage } from '../../core/utils/api-error';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/ui/overlay/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, AlertComponent, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './login.html',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly tenantContext = inject(TenantContextService);

  @ViewChild('googleBtn') googleBtnRef?: ElementRef<HTMLDivElement>;

  mode = signal<'login' | 'register' | 'two-factor'>('login');

  private googleInitialized = false;

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

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  challenge = signal<TwoFactorChallengeResponse | null>(null);
  useRecovery = signal(false);

  codeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]],
  });

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

  ngAfterViewInit(): void {
    this.initGoogleButton();
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
    this.error.set(null);
    this.showPassword.set(false);
    if (m === 'login') {
      setTimeout(() => this.initGoogleButton());
    }
  }

  backToLogin(): void {
    this.challenge.set(null);
    this.useRecovery.set(false);
    this.codeForm.reset();
    this.error.set(null);
    this.mode.set('login');
    setTimeout(() => this.initGoogleButton());
  }

  toggleRecovery(): void {
    this.useRecovery.update((v) => !v);
    this.codeForm.reset();
    this.error.set(null);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.auth.login(email, password).subscribe({
      next: (result) => {
        this.loading.set(false);
        if (result) {
          this.challenge.set(result);
          this.mode.set('two-factor');
        } else {
          this.router.navigate(['/s', this.tenantContext.slug()]);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('E-mail ou senha incorretos.');
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
    this.error.set(null);

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
          this.router.navigate(['/s', this.tenantContext.slug()]);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Código inválido ou expirado.');
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
    this.error.set(null);

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
          const slug = this.tenantContext.slug();
          this.router.navigate(['/s', slug]);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = apiErrorMessage(
            err,
            'Não foi possível criar a conta. Verifique os dados e tente novamente.',
          );
          this.error.set(msg);
          this.toast.error('Erro ao criar conta', msg);
        },
      });
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

    window.google.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'continue_with',
      width: 320,
    });
  }

  private handleGoogleResponse(response: google.accounts.id.CredentialResponse): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.loading.set(false);
        const slug = this.tenantContext.slug();
        this.router.navigate(['/s', slug]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível autenticar com o Google.');
        this.toast.error('Erro de autenticação', 'Não foi possível autenticar com o Google.');
      },
    });
  }
}
