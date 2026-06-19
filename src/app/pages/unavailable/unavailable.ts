import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-unavailable',
  templateUrl: './unavailable.html',
})
export class UnavailableComponent {
  private route = inject(ActivatedRoute);
  // Nome do salão vem do tenantGuard via query param (mensagem mais amigável que um erro genérico).
  protected readonly salonName = this.route.snapshot.queryParamMap.get('salao');
}
