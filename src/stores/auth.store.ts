import { create } from 'zustand';
import { authService } from '../lib/services/auth.service';
import type {
  UserProfile,
  RegisterRequest,
  SignupCodeRequest,
  SignupCodeResponse,
} from '../lib/types';

interface AuthState {
  user: UserProfile | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  tempCredentials: { username: string; password: string } | null;

  // Actions
  login: (username: string, password: string, twoFactorCode?: string, captchaToken?: string) => Promise<{ requiresTwoFactor: boolean; success: boolean }>;
  register: (data: RegisterRequest & { captchaToken?: string }) => Promise<void>;
  requestSignupCode: (data: SignupCodeRequest) => Promise<SignupCodeResponse>;
  verifySignupCode: (email: string, code: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  faceLogin: (email: string, descriptor?: number[], imageBase64?: string) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  clearTwoFactor: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  roles: [],
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  requiresTwoFactor: false,
  tempCredentials: null,

  login: async (username, password, twoFactorCode, captchaToken) => {
    set({ isLoading: true });
    try {
      const result = await authService.login({ username, password, twoFactorCode, captchaToken } as any);

      if (result.requiresTwoFactor && !twoFactorCode) {
        set({
          requiresTwoFactor: true,
          tempCredentials: { username, password },
          isLoading: false,
        });
        return { requiresTwoFactor: true, success: false };
      }

      // Successful login
      set({
        isAuthenticated: true,
        requiresTwoFactor: false,
        tempCredentials: null,
        isLoading: false,
      });

      // Load user profile
      await get().loadUser();
      return { requiresTwoFactor: false, success: true };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await authService.register(data);
      set({ isAuthenticated: true, isLoading: false });
      await get().loadUser();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  requestSignupCode: async (data) => {
    try {
      const response = await authService.requestSignupCode(data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  verifySignupCode: async (email, code) => {
    try {
      await authService.verifySignupCode({ email, code });
      set({ isAuthenticated: true });
      await get().loadUser();
    } catch (error) {
      throw error;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      await authService.googleTokenAuth(idToken);
      set({ isAuthenticated: true, isLoading: false });
      await get().loadUser();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  faceLogin: async (email, descriptor, imageBase64) => {
    set({ isLoading: true });
    try {
      const result = await authService.faceLogin(email, descriptor, imageBase64);
      if (result.tokens) {
        set({ isAuthenticated: true, isLoading: false });
        await get().loadUser();
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({
        user: null,
        roles: [],
        isAuthenticated: false,
        requiresTwoFactor: false,
        tempCredentials: null,
      });
    }
  },

  loadUser: async () => {
    try {
      const [user, roles] = await Promise.all([
        authService.getProfile(),
        authService.getRoles(),
      ]);
      set({ user, roles, isAuthenticated: true });
    } catch {
      // Fallback: try to extract user info from the JWT token itself
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const fallbackUser = {
            sub: payload.sub || '',
            email: payload.email || '',
            name: payload.name || payload.preferred_username || '',
            preferred_username: payload.preferred_username || payload.email || '',
            given_name: payload.given_name || '',
            family_name: payload.family_name || '',
            email_verified: payload.email_verified || false,
          };
          const fallbackRoles = [
            ...(payload.realm_access?.roles || []),
            ...(payload.resource_access?.[payload.azp]?.roles || []),
          ];
          set({ user: fallbackUser, roles: fallbackRoles, isAuthenticated: true });
          return;
        } catch { /* token decode failed */ }
      }
      set({ user: null, roles: [], isAuthenticated: false });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  setUser: (user) => set({ user }),
  clearTwoFactor: () => set({ requiresTwoFactor: false, tempCredentials: null }),
}));
