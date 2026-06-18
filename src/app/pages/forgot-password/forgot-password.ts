import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { AlertComponent } from '../../shared/ui/alert/alert';
import { IconComponent } from '../../shared/ui/icon/icon';
import { FieldErrorComponent } from '../../shared/ui/overlay/field-error';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, IconComponent, FieldErrorComponent],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  readonly tenantContext = inject(TenantContextService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = signal(false);
  sent = signal(false);
  error = signal<string | null>(null);

  get email() {
    return this.form.controls.email;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.requestPasswordReset(this.form.getRawValue().email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Erro ao enviar o e-mail. Tente novamente.'));
      },
    });
  }
}
