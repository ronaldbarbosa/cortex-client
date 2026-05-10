import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { IconComponent } from '../../shared/ui/icon/icon';

interface Appointment {
  service: string;
  professional: string;
  date: string;
  time: string;
}

interface Professional {
  name: string;
  role: string;
  initials: string;
  rating: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent],
  templateUrl: './home.html',
})
export class HomeComponent {
  private auth = inject(AuthService);

  readonly user = this.auth.user;

  readonly nextAppointment: Appointment | null = null;

  readonly favoriteProfessionals: Professional[] = [
    { name: 'Camila', role: 'Colorista', initials: 'CA', rating: 4.9 },
    { name: 'Rafael', role: 'Barbeiro', initials: 'RA', rating: 4.8 },
    { name: 'Juliana', role: 'Esteticista', initials: 'JU', rating: 5.0 },
  ];

  get firstName(): string {
    return this.user()?.firstName ?? 'Cliente';
  }
}
