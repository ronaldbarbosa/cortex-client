import { computed, Injectable, signal } from '@angular/core';
import { PublicUnit } from '../tenant/tenant.model';

@Injectable({ providedIn: 'root' })
export class UnitContextService {
  private _unit = signal<PublicUnit | null>(null);

  readonly unit = this._unit.asReadonly();
  readonly unitId = computed(() => this._unit()?.id ?? null);
  readonly unitSlug = computed(() => this._unit()?.slug ?? '');
  readonly unitName = computed(() => this._unit()?.name ?? '');

  set(unit: PublicUnit): void {
    this._unit.set(unit);
  }
}
