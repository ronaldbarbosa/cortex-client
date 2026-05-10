import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

interface Tab {
  label: string;
  icon: string;
  path: string;
}

const TAB_DEFS: Tab[] = [
  { label: 'Início', icon: 'home', path: 'inicio' },
  { label: 'Agendar', icon: 'calendar', path: 'agendar' },
  { label: 'Fidelidade', icon: 'star', path: 'fidelidade' },
  { label: 'Histórico', icon: 'clock', path: 'historico' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.html',
})
export class ShellComponent {
  private tenantContext = inject(TenantContextService);

  readonly tenantName = this.tenantContext.name;

  readonly tabs = computed(() => {
    const slug = this.tenantContext.slug();
    return TAB_DEFS.map((t) => ({ ...t, route: ['/s', slug, t.path] }));
  });
}
