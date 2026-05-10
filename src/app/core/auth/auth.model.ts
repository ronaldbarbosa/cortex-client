export interface ClientAuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  tenantId: string;
}

export interface ClientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}
