import { computed, Injectable, signal } from '@angular/core';
import { PublicUnit, Tenant } from './tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private _tenant = signal<Tenant | null>(null);

  readonly tenant = this._tenant.asReadonly();
  readonly tenantId = computed(() => this._tenant()?.id ?? '');
  readonly slug = computed(() => this._tenant()?.slug ?? '');
  readonly name = computed(() => this._tenant()?.name ?? '');
  readonly units = computed(() => this._tenant()?.units ?? []);
  readonly isMultiUnit = computed(() => this.units().length > 1);
  readonly defaultUnit = computed<PublicUnit | null>(
    () => this.units().find((u) => u.isDefault) ?? this.units()[0] ?? null,
  );

  set(tenant: Tenant): void {
    this._tenant.set(tenant);
  }
}
