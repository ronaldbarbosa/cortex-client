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

export interface AppointmentDepositPreview {
  required: boolean;
  amount: number | null;
  amountType: 'Percentage' | 'Fixed' | null;
  percentage: number | null;
  holdMinutes: number | null;
}

export interface DepositProofDto {
  id: string;
  contentType: string;
  url: string;
  // Nulo para PDF (sem miniatura gerada) — ver docs/midia.md §2.2.
  thumbUrl: string | null;
}

// Só o subconjunto que o cortex-client precisa — o backend devolve mais campos
// (AppointmentDepositDto), ignorados aqui.
export interface AppointmentDepositSummary {
  status: string;
  refundNote: string | null;
  // Só relevante quando status === 'Confirmed' — se cancelado agora (pelo cliente), o sinal
  // cairia dentro da janela de devolução? Calculado no backend (fuso do salão), nunca no
  // front — ver docs/sinal.md §8.
  isWithinRefundWindow: boolean;
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
