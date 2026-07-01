import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { IconComponent } from '../../shared/ui/icon/icon';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { UnitContextService } from '../../core/unit/unit-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { EstablishmentService } from '../../core/establishment/establishment.service';

interface NextAppointment {
  service: string;
  professional: string;
  date: string;
  time: string;
}

interface FavoriteProfessional {
  id: string;
  name: string;
  initials: string;
  visitCount: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {
  private tenantContext = inject(TenantContextService);
  private unitContext = inject(UnitContextService);
  private auth = inject(AuthService);
  private establishmentService = inject(EstablishmentService);

  readonly slug = this.tenantContext.slug;
  readonly unitSlug = this.unitContext.unitSlug;
  readonly tenantName = this.tenantContext.name;
  readonly logoUrl = this.tenantContext.logoUrl;
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly nextAppointment: NextAppointment | null = null;

  // null = loading; [] = no data
  readonly favoriteProfessionals = signal<FavoriteProfessional[] | null>(null);
  readonly skeletonItems = [1, 2, 3];

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user?.clientId) {
      this.favoriteProfessionals.set([]);
      return;
    }

    this.establishmentService
      .getMyAppointments(user.clientId)
      .pipe(catchError(() => of([])))
      .subscribe((appointments) => {
        const completed = appointments.filter((a) => a.status === 'Completed');
        const counts = new Map<string, { id: string; name: string; count: number }>();
        for (const a of completed) {
          const entry = counts.get(a.professionalId);
          if (entry) {
            entry.count++;
          } else {
            counts.set(a.professionalId, {
              id: a.professionalId,
              name: a.professionalName,
              count: 1,
            });
          }
        }
        const sorted = [...counts.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
          .map((p) => ({
            id: p.id,
            name: p.name,
            initials: getInitials(p.name),
            visitCount: p.count,
          }));
        this.favoriteProfessionals.set(sorted);
      });
  }
}
