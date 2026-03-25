import apiClient from '../api-client';
import type {
  LoginRequest,
  LoginResponse,
  TokenResponse,
  GoogleTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RegisterRequest,
  UserProfile,
  TwoFactorGenerateResponse,
  TwoFactorStatusResponse,
} from '../types';

export const authService = {
  // ─── Login / Logout ───
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/login', data);
    if (res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
    }
    return res.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/register', data);
    if (res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
    }
    return res.data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    const res = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    return res.data;
  },

  // ─── Google Auth ───
  async googleTokenAuth(idToken: string): Promise<LoginResponse> {
    const res = await apiClient.post<any>('/auth/google/token', { idToken });
    if (res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
    }
    return res.data;
  },

  getGoogleAuthUrl(): string {
    const baseUrl = 'http://localhost:3000';
    return `${baseUrl}/auth/google`;
  },

  getFacebookAuthUrl(): string {
    const baseUrl = 'http://localhost:3000';
    return `${baseUrl}/auth/facebook`;
  },

  // ─── Profile & Validation ───
  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get<UserProfile>('/auth/profile');
    return res.data;
  },

  async updateProfile(data: { 
    name?: string; 
    avatar?: string; 
    coverPhoto?: string;
    gender?: string; 
    dateOfBirth?: string; 
    preferredLanguage?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isPublic?: boolean;
    receiveRecommendations?: boolean;
  }): Promise<UserProfile> {
    const res = await apiClient.patch<UserProfile>('/auth/profile', data);
    return res.data;
  },

  async validateToken(): Promise<{ valid: boolean; user: any }> {
    const res = await apiClient.get<{ valid: boolean; user: any }>('/auth/validate');
    return res.data;
  },

  async getRoles(): Promise<string[]> {
    const res = await apiClient.get<{ roles: string[] }>('/auth/roles');
    return res.data.roles;
  },

  // ─── Password Reset ───
  async forgotPassword(email: string): Promise<any> {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<any> {
    const res = await apiClient.post('/auth/reset-password', { token, newPassword });
    return res.data;
  },

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const res = await apiClient.get(`/auth/reset-password/validate?token=${token}`);
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const res = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },

  // ─── 2FA ───
  async generate2FA(): Promise<TwoFactorGenerateResponse> {
    const res = await apiClient.post<TwoFactorGenerateResponse>('/auth/2fa/generate');
    return res.data;
  },

  async enable2FA(code: string): Promise<any> {
    const res = await apiClient.post('/auth/2fa/enable', { code });
    return res.data;
  },

  async disable2FA(code: string): Promise<any> {
    const res = await apiClient.post('/auth/2fa/disable', { code });
    return res.data;
  },

  async verify2FA(code: string): Promise<{ valid: boolean }> {
    const res = await apiClient.post<{ valid: boolean }>('/auth/2fa/verify', { code });
    return res.data;
  },

  async get2FAStatus(): Promise<TwoFactorStatusResponse> {
    const res = await apiClient.get<TwoFactorStatusResponse>('/auth/2fa/status');
    return res.data;
  },

  async verifySocial2fa(email: string, code: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/social/2fa-verify', {
      email,
      code,
    });
    return res.data;
  },

  async getUserAvatar(email: string): Promise<{ avatar: string | null }> {
    const res = await apiClient.get<{ avatar: string | null }>(`/auth/avatar/${email}`);
    return res.data;
  },

  async faceLogin(email: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/face-login', { email });
    if (res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
    }
    return res.data;
  },

  // ─── Helpers ───
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },
};
