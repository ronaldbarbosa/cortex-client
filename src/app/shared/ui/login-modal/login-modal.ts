import { Component, ElementRef, effect, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../icon/icon';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login-modal',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login-modal.html',
})
export class LoginModalComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);

  @ViewChild('googleBtn') googleBtnRef?: ElementRef<HTMLDivElement>;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  constructor() {
    effect(() => {
      if (this.authModal.isOpen()) {
        // aguarda o DOM renderizar o @if antes de acessar o ViewChild
        setTimeout(() => this.initGoogleButton());
      }
    });
  }

  ngOnDestroy(): void {
    window.google?.accounts?.id?.cancel();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.authModal.notifySuccess();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('E-mail ou senha incorretos.');
      },
    });
  }

  close(): void {
    this.authModal.close();
  }

  private initGoogleButton(): void {
    if (!window.google?.accounts?.id || !this.googleBtnRef) return;

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.handleGoogleResponse(response),
    });

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
    this.error.set(null);

    this.auth.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.loading.set(false);
        this.authModal.notifySuccess();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível autenticar com o Google.');
      },
    });
  }
}
