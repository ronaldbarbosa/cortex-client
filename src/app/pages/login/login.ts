import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { IconComponent } from '../../shared/ui/icon/icon';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.html',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private tenantContext = inject(TenantContextService);

  @ViewChild('googleBtn') googleBtnRef?: ElementRef<HTMLDivElement>;

  mode = signal<'login' | 'register'>('login');

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

  switchMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.error.set(null);
    this.showPassword.set(false);
    if (m === 'login') {
      setTimeout(() => this.initGoogleButton());
    }
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
      next: () => {
        this.loading.set(false);
        const slug = this.tenantContext.slug();
        this.router.navigate(['/s', slug, 'inicio']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('E-mail ou senha incorretos.');
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
          this.router.navigate(['/s', slug, 'inicio']);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Não foi possível criar a conta. Verifique os dados e tente novamente.');
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
        this.router.navigate(['/s', slug, 'inicio']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível autenticar com o Google.');
      },
    });
  }
}
