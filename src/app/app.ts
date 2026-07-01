import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/loading/loading.service';
import { LoaderComponent } from './shared/ui/loader/loader.component';
import { ToasterComponent } from './shared/ui/overlay/toaster';
import { ConfirmHostComponent } from './shared/ui/overlay/confirm-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, ToasterComponent, ConfirmHostComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  readonly loading = inject(LoadingService);
}
