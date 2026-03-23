// ─── Auth Types ───
export interface LoginRequest {
  username: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
  tokens?: TokenResponse;
  message?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleTokenRequest {
  idToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

export interface UserProfile {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  avatar?: string;
  avatar3D?: string;
  coverPhoto?: string;
  gender?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
  createdAt?: string;
}

export interface TwoFactorGenerateResponse {
  secret: string;
  qrCode: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
}
