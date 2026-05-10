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
