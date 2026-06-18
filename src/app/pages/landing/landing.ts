import { Component } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-landing',
  imports: [IconComponent],
  templateUrl: './landing.html',
})
export class LandingComponent {
  readonly year = new Date().getFullYear();

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
}
