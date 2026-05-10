import { Component, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon';

interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  category: string;
}

@Component({
  selector: 'app-book',
  imports: [IconComponent],
  templateUrl: './book.html',
})
export class BookComponent {
  readonly step = signal<1 | 2 | 3>(1);

  readonly selectedServiceId = signal<string | null>(null);
  readonly selectedProfessionalId = signal<string | null>(null);
  readonly selectedSlot = signal<string | null>(null);

  readonly services: Service[] = [
    { id: '1', name: 'Corte feminino', duration: '45 min', price: 80, category: 'Cabelo' },
    { id: '2', name: 'Coloração completa', duration: '2h 30min', price: 220, category: 'Química' },
    { id: '3', name: 'Escova progressiva', duration: '3h', price: 280, category: 'Química' },
    { id: '4', name: 'Manicure', duration: '40 min', price: 50, category: 'Unhas' },
    { id: '5', name: 'Hidratação capilar', duration: '1h', price: 90, category: 'Tratamento' },
  ];

  selectService(id: string): void {
    this.selectedServiceId.set(id);
    this.step.set(2);
  }

  goBack(): void {
    const current = this.step();
    if (current > 1) this.step.set((current - 1) as 1 | 2 | 3);
  }
}
