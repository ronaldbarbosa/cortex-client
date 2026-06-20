export interface PublicUnit {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  isDefault: boolean;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  // false quando a licença do salão está inativa → agendamento online bloqueado (tenantGuard).
  onlineBookingEnabled: boolean;
  units: PublicUnit[];
}
