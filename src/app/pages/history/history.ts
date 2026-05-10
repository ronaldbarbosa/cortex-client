import { Component } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon';

interface Visit {
  id: string;
  service: string;
  professional: string;
  date: string;
  price: number;
  hasPhoto: boolean;
}

@Component({
  selector: 'app-history',
  imports: [IconComponent],
  templateUrl: './history.html',
})
export class HistoryComponent {
  readonly stats = {
    totalVisits: 12,
    totalSpent: 1430,
    favoritePro: 'Camila',
  };

  readonly visits: Visit[] = [
    {
      id: '1',
      service: 'Coloração completa',
      professional: 'Camila',
      date: '2 mai 2026',
      price: 220,
      hasPhoto: true,
    },
    {
      id: '2',
      service: 'Escova progressiva',
      professional: 'Camila',
      date: '14 abr 2026',
      price: 280,
      hasPhoto: false,
    },
    {
      id: '3',
      service: 'Corte feminino',
      professional: 'Juliana',
      date: '1 abr 2026',
      price: 80,
      hasPhoto: false,
    },
  ];
}
