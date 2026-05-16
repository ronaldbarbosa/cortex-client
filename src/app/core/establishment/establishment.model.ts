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
}

export interface ProfessionalAvailability {
  date: string;
  isAvailable: boolean;
  slots: string[];
}

export interface CreateAppointmentRequest {
  clientId: string;
  professionalId: string;
  startAt: string;
  serviceIds: string[];
  rewardServiceId?: string;
}

export interface RescheduleAppointmentRequest {
  clientId: string;
  professionalId: string;
  startAt: string;
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
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  cancelReason: string | null;
  services: AppointmentServiceSummary[];
}
