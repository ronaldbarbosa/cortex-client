import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { IconComponent } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-unit-select',
  imports: [IconComponent],
  templateUrl: './unit-select.html',
})
export class UnitSelectComponent implements OnInit {
  private tenantContext = inject(TenantContextService);
  private router = inject(Router);

  readonly units = this.tenantContext.units;
  readonly tenantName = this.tenantContext.name;
  readonly logoUrl = this.tenantContext.logoUrl;

  ngOnInit(): void {
    const units = this.units();
    if (units.length === 1) {
      this.router.navigate(['/s', this.tenantContext.slug(), 'u', units[0].slug, 'inicio'], {
        replaceUrl: true,
      });
    }
  }

  select(slug: string): void {
    this.router.navigate(['/s', this.tenantContext.slug(), 'u', slug, 'inicio']);
  }
}
