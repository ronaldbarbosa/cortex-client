import { computed, Injectable, signal } from '@angular/core';
import { Tenant } from './tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private _tenant = signal<Tenant | null>(null);

  readonly tenant = this._tenant.asReadonly();
  readonly tenantId = computed(() => this._tenant()?.id ?? '');
  readonly slug = computed(() => this._tenant()?.slug ?? '');
  readonly name = computed(() => this._tenant()?.name ?? '');

  set(tenant: Tenant): void {
    this._tenant.set(tenant);
  }
}
