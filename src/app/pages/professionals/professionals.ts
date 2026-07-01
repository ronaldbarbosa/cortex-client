import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { UnitContextService } from '../../core/unit/unit-context.service';
import { EstablishmentService } from '../../core/establishment/establishment.service';
import { PublicProfessional } from '../../core/establishment/establishment.model';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

@Component({
  selector: 'app-professionals',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './professionals.html',
})
export class ProfessionalsComponent implements OnInit {
  private tenantContext = inject(TenantContextService);
  private unitContext = inject(UnitContextService);
  private establishmentService = inject(EstablishmentService);

  readonly slug = this.tenantContext.slug;
  readonly unitSlug = this.unitContext.unitSlug;
  readonly tenantName = this.tenantContext.name;

  // null = loading
  readonly professionals = signal<PublicProfessional[] | null>(null);
  readonly skeletonItems = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.establishmentService
      .getProfessionals()
      .pipe(catchError(() => of([])))
      .subscribe((list) => this.professionals.set(list));
  }

  getInitials(name: string): string {
    return getInitials(name);
  }
}
