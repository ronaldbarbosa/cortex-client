import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon';

interface Tab {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.html',
})
export class ShellComponent {
  readonly tabs: Tab[] = [
    { label: 'Início', icon: 'home', route: '/inicio' },
    { label: 'Agendar', icon: 'calendar', route: '/agendar' },
    { label: 'Fidelidade', icon: 'star', route: '/fidelidade' },
    { label: 'Histórico', icon: 'clock', route: '/historico' },
  ];
}
