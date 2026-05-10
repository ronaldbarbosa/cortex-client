import { Component } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon';

interface Tier {
  name: string;
  minPoints: number;
}

interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

@Component({
  selector: 'app-loyalty',
  imports: [IconComponent],
  templateUrl: './loyalty.html',
})
export class LoyaltyComponent {
  readonly points = 8;
  readonly currentTier = 'Ouro';

  readonly tiers: Tier[] = [
    { name: 'Prata', minPoints: 0 },
    { name: 'Ouro', minPoints: 5 },
    { name: 'Diamante', minPoints: 15 },
  ];

  readonly rewards: Reward[] = [
    { id: '1', name: 'Hidratação grátis', cost: 10, icon: 'sparkle' },
    { id: '2', name: '15% de desconto', cost: 8, icon: 'tag' },
    { id: '3', name: 'Brinde surpresa', cost: 12, icon: 'gift' },
  ];

  readonly nextTier = this.tiers.find((t) => t.minPoints > this.points) ?? null;
  readonly pointsToNext = this.nextTier ? this.nextTier.minPoints - this.points : 0;
}
