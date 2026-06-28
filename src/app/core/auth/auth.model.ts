export interface ClientAuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  tenantId: string;
  clientId: string | null;
}

export interface ClientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  clientId: string | null;
}

export interface ClientAddressDto {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  acceptsMarketing: boolean;
  cpf: string | null;
  gender: string | null;
  secondaryPhone: string | null;
  address: ClientAddressDto | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string | null;
  acceptsMarketing: boolean;
  cpf?: string | null;
  gender?: string | null;
  secondaryPhone?: string | null;
  address?: ClientAddressDto | null;
}
