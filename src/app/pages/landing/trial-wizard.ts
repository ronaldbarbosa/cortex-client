import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon';
import { FieldErrorComponent } from '../../shared/ui/overlay/field-error';
import { ToastService } from '../../shared/ui/overlay/toast.service';
import { TrialService, PlanSummary, RegistrationPendingResponse } from './trial.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { environment } from '../../../environments/environment';

type Step = 'plan' | 'establishment' | 'account' | 'success';

@Component({
  selector: 'app-trial-wizard',
  imports: [ReactiveFormsModule, IconComponent, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './trial-wizard.html',
})
export class TrialWizardComponent implements OnInit {
  closed = output<void>();
  initialPlanId = input<string | null>(null);

  private fb = inject(FormBuilder);
  private svc = inject(TrialService);
  private toast = inject(ToastService);

  step = signal<Step>('plan');
  plans = signal<PlanSummary[]>([]);
  selectedPlan = signal<PlanSummary | null>(null);
  loading = signal(false);
  plansLoading = signal(true);
  result = signal<RegistrationPendingResponse | null>(null);

  estForm = this.fb.nonNullable.group({
    salonName: ['', [Validators.required, Validators.maxLength(200)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    phone: [''],
    email: ['', Validators.email],
  });

  accountForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  showPassword = signal(false);
  readonly slugBaseUrl = `${window.location.origin}/s/`;
  readonly adminUrl = environment.adminUrl;

  ngOnInit(): void {
    this.svc.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        if (plans.length > 0) {
          const preselected = this.initialPlanId()
            ? plans.find((p) => p.id === this.initialPlanId())
            : null;
          this.selectedPlan.set(preselected ?? plans.find((p) => p.isDefault) ?? plans[0]);
        }
        this.plansLoading.set(false);
      },
      error: () => {
        this.plansLoading.set(false);
        this.toast.error('Erro ao carregar planos', 'Tente novamente em instantes.');
      },
    });

    this.estForm.controls.salonName.valueChanges.subscribe((name) => {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      this.estForm.controls.slug.setValue(slug, { emitEvent: false });
    });
  }

  selectPlan(plan: PlanSummary): void {
    this.selectedPlan.set(plan);
  }

  goToEstablishment(): void {
    this.step.set('establishment');
  }

  goToAccount(): void {
    if (this.estForm.invalid) {
      this.estForm.markAllAsTouched();
      return;
    }
    this.step.set('account');
  }

  goBack(): void {
    if (this.step() === 'establishment') this.step.set('plan');
    else if (this.step() === 'account') this.step.set('establishment');
  }

  maskPhone(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 10) v = `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
    else if (v.length > 6) v = `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
    else if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    else if (v.length > 0) v = `(${v}`;
    el.value = v;
    this.estForm.controls.phone.setValue(v, { emitEvent: false });
  }

  submit(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const est = this.estForm.getRawValue();
    const acc = this.accountForm.getRawValue();

    this.svc
      .register({
        tenantName: est.salonName,
        tenantSlug: est.slug,
        tenantPhone: est.phone || undefined,
        tenantEmail: est.email || undefined,
        ownerFirstName: acc.firstName,
        ownerLastName: acc.lastName,
        ownerEmail: acc.email,
        ownerPassword: acc.password,
        planId: this.selectedPlan()?.id,
      })
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.step.set('success');
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(
            'Erro ao criar conta',
            apiErrorMessage(err, 'Verifique os dados e tente novamente.'),
          );
        },
      });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  featureList(plan: PlanSummary): string[] {
    const features: string[] = [
      `${plan.includedSeats} profissional${plan.includedSeats !== 1 ? 'is' : ''}`,
    ];
    if (plan.entitlements.onlineBooking) features.push('Agendamento online');
    if (plan.entitlements.loyaltyProgram) features.push('Programa de fidelidade');
    if (plan.entitlements.stockManagement) features.push('Controle de estoque');
    if (plan.entitlements.whatsappNotifications) features.push('Notificações WhatsApp');
    if (plan.entitlements.advancedReports) features.push('Relatórios avançados');
    if (plan.entitlements.multiUnit) features.push('Múltiplas unidades');
    return features;
  }
}
