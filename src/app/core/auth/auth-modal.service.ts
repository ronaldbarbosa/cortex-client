import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  private loginSuccessSubject = new Subject<void>();
  readonly loginSuccess$ = this.loginSuccessSubject.asObservable();

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  notifySuccess(): void {
    this.loginSuccessSubject.next();
    this._isOpen.set(false);
  }
}
