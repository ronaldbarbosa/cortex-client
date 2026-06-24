export interface PublicServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  hasPause: boolean;
}

export interface PublicServiceCategory {
  categoryId: string;
  categoryName: string;
  services: PublicServiceItem[];
}

export interface PublicProfessional {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface ProfessionalAvailability {
  date: string;
  isAvailable: boolean;
  slots: string[];
}

export interface CreateAppointmentRequest {
  clientId: string;
  professionalId: string;
  /** Hora-de-parede do salão (sem fuso): "YYYY-MM-DDTHH:mm:ss". */
  startLocal: string;
  serviceIds: string[];
  rewardServiceId?: string;
  /** Unidade escolhida na rota (/u/:unitSlug) — define a filial do atendimento. */
  unitId?: string;
}

export interface RescheduleAppointmentRequest {
  clientId: string;
  professionalId: string;
  /** Hora-de-parede do salão (sem fuso): "YYYY-MM-DDTHH:mm:ss". */
  startLocal: string;
  serviceIds: string[];
  rewardServiceId?: string;
}

export interface AppointmentServiceSummary {
  id: string;
  serviceId: string;
  serviceName: string;
  priceSnapshot: number;
  durationMinutesSnapshot: number;
  isReward: boolean;
}

export interface AppointmentSummary {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  /** Instante UTC (ISO com Z). Use para comparação de instante. */
  startAt: string;
  endAt: string;
  /** Hora-de-parede do salão (ISO sem fuso). Use para exibir. */
  startLocal: string;
  endLocal: string;
  status: string;
  notes: string | null;
  cancelReason: string | null;
  services: AppointmentServiceSummary[];
}
