import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon';
import { TrialWizardComponent } from './trial-wizard';
import { TrialService, PlanSummary } from './trial.service';

@Component({
  selector: 'app-landing',
  imports: [IconComponent, TrialWizardComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './landing.html',
})
export class LandingComponent implements OnInit {
  private svc = inject(TrialService);

  readonly year = new Date().getFullYear();

  showWizard = signal(false);
  selectedPlanId = signal<string | null>(null);
  plans = signal<PlanSummary[]>([]);
  plansLoading = signal(true);
  billingPeriod = signal<'monthly' | 'annual'>('monthly');

  readonly maxAnnualDiscount = computed(() => {
    const ps = this.plans();
    if (!ps.length) return 0;
    return Math.max(
      0,
      ...ps.map((p) =>
        p.priceMonthly > 0 ? Math.round((1 - p.priceAnnual / (p.priceMonthly * 12)) * 100) : 0,
      ),
    );
  });

  readonly features = [
    {
      icon: 'calendar',
      title: 'Agendamento inteligente',
      description:
        'Encaixe atendimentos nos intervalos de química e coloração. Sem conflitos, sem tempo ocioso.',
    },
    {
      icon: 'scissors',
      title: 'Histórico técnico',
      description:
        'Fórmulas, fotos antes/depois e observações por atendimento. A memória que o salão nunca teve.',
    },
    {
      icon: 'sparkle',
      title: 'Marketing automático',
      description:
        'Reative clientes inativos, celebre aniversários e divulgue horários ociosos — sem esforço.',
    },
    {
      icon: 'star',
      title: 'Programa de fidelidade',
      description: 'Pontos, visitas ou cashback. Escolha o modelo que mais engaja a sua clientela.',
    },
    {
      icon: 'tag',
      title: 'Comissões e comandas',
      description:
        'Fechamento de caixa, comissões por profissional e histórico financeiro em tempo real.',
    },
    {
      icon: 'repeat',
      title: 'Multi-profissional',
      description:
        'Gerencie toda a equipe, metas e agendas em um único painel. Escala do salão individual à rede.',
    },
  ] as const;

  ngOnInit(): void {
    this.svc.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.plansLoading.set(false);
      },
      error: () => this.plansLoading.set(false),
    });
  }

  openWizard(planId?: string): void {
    this.selectedPlanId.set(planId ?? null);
    this.showWizard.set(true);
  }

  closeWizard(): void {
    this.showWizard.set(false);
    this.selectedPlanId.set(null);
  }

  annualDiscount(plan: PlanSummary): number {
    if (plan.priceMonthly === 0) return 0;
    return Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100);
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

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
}
