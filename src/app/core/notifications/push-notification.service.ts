import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

const OPT_IN_KEY = 'cortex.client.push_opted_in';

interface PushSubscriptionRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private swPush = inject(SwPush);

  private readonly base = `${environment.apiUrl}/notifications/push-subscriptions`;

  readonly supported = this.swPush.isEnabled;
  readonly optedIn = signal(localStorage.getItem(OPT_IN_KEY) === '1');

  constructor() {
    if (this.swPush.isEnabled) {
      this.swPush.notificationClicks.subscribe(({ notification }) => {
        const url = (notification.data as { url?: string } | undefined)?.url;
        if (url) this.router.navigateByUrl(url);
      });
    }

    // Re-registra silenciosamente após login/restauração de sessão — o endpoint da
    // assinatura pode mudar (troca de device/browser) e o backend precisa do mais recente.
    effect(() => {
      if (this.auth.isAuthenticated() && this.optedIn() && this.swPush.isEnabled) {
        this.registerSubscription();
      }
    });
  }

  async enable(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      console.error(
        '[push] SwPush.isEnabled é false — Service Worker não está ativo nesta sessão ' +
          '(precisa de build otimizado servido fora do "ng serve", ver notas de PWA).',
      );
      return false;
    }
    const ok = await this.registerSubscription();
    if (ok) {
      this.optedIn.set(true);
      localStorage.setItem(OPT_IN_KEY, '1');
    }
    return ok;
  }

  async disable(): Promise<void> {
    this.optedIn.set(false);
    localStorage.removeItem(OPT_IN_KEY);
    if (!this.swPush.isEnabled) return;

    try {
      // API nativa direta — evita o canal de mensagens interno do Angular
      // (SwPush.subscription/unsubscribe), que pode travar se o SW estiver instável.
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await this.deleteSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
    } catch (err) {
      console.error('[push] Falha ao desativar (melhor esforço).', err);
    }
  }

  private async registerSubscription(): Promise<boolean> {
    try {
      // PushManager.subscribe() (por trás do requestSubscription) já é idempotente: com a
      // mesma chave, retorna a assinatura existente sem pedir permissão de novo — não precisa
      // checar SwPush.subscription antes (canal de mensagens à parte, pode travar se o SW
      // estiver instável).
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });
      await this.postSubscription(sub);
      return true;
    } catch (err) {
      console.error('[push] Falha ao registrar a assinatura de push.', err);
      return false;
    }
  }

  private postSubscription(sub: PushSubscription): Promise<void> {
    const json = sub.toJSON();
    const body: PushSubscriptionRequest = {
      endpoint: json.endpoint!,
      p256dh: json.keys!['p256dh'],
      auth: json.keys!['auth'],
    };
    return firstValueFrom(this.http.post<void>(this.base, body)).then(() => void 0);
  }

  private deleteSubscription(endpoint: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.base, { params: { endpoint } })).then(
      () => void 0,
    );
  }
}
