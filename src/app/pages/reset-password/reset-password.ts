import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AlertComponent } from '../../shared/ui/alert/alert';
import { IconComponent } from '../../shared/ui/icon/icon';
import { FieldErrorComponent } from '../../shared/ui/overlay/field-error';
import { apiErrorMessage } from '../../core/utils/api-error';
import { ToastService } from '../../shared/ui/overlay/toast.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, IconComponent, FieldErrorComponent],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  private userId = '';
  private token = '';
  slug = '';

  form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  loading = signal(false);
  done = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  invalidLink = signal(false);

  get c() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.userId = params.get('userId') ?? '';
    this.token = params.get('token') ?? '';
    this.slug = params.get('slug') ?? '';

    if (!this.userId || !this.token) {
      this.invalidLink.set(true);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { password } = this.form.getRawValue();

    this.auth.resetPassword(this.userId, this.token, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = apiErrorMessage(
          err,
          'Link inválido ou expirado. Solicite um novo link de recuperação.',
        );
        this.error.set(msg);
        this.toast.error('Erro ao redefinir senha', msg);
      },
    });
  }
}
