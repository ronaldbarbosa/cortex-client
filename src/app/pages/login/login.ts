import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { IconComponent } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private tenantContext = inject(TenantContextService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
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
        const slug = this.tenantContext.slug();
        this.router.navigate(['/s', slug, 'inicio']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('E-mail ou senha incorretos.');
      },
    });
  }
}
