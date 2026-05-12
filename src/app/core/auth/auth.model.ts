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

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}
