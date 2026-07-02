import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon';
import { LoginModalComponent } from '../../shared/ui/login-modal/login-modal';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { UnitContextService } from '../../core/unit/unit-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileAvatarService } from '../../core/auth/profile-avatar.service';

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
  { label: 'Conta', icon: 'user', path: 'conta' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, LoginModalComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './shell.html',
})
export class ShellComponent {
  private tenantContext = inject(TenantContextService);
  private unitContext = inject(UnitContextService);
  readonly auth = inject(AuthService);
  readonly profileAvatar = inject(ProfileAvatarService);

  readonly tenantName = this.tenantContext.name;
  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly dropdownOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) this.profileAvatar.sync();
    });
  }

  readonly tabs = computed(() => {
    const slug = this.tenantContext.slug();
    const unitSlug = this.unitContext.unitSlug();
    return TAB_DEFS.map((t) => ({ ...t, route: ['/s', slug, 'u', unitSlug, t.path] }));
  });

  readonly accountRoute = computed(() => [
    '/s',
    this.tenantContext.slug(),
    'u',
    this.unitContext.unitSlug(),
    'conta',
  ]);

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.auth.logout();
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  }
}
