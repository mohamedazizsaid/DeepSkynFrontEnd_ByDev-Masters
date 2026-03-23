// Environment-based API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = 30000;

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: API_TIMEOUT,
  RETRY_ATTEMPTS: 1,
  RETRY_DELAY: 1000,
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    PROFILE_COVER: '/auth/profile/cover',
    PROFILE_AVATAR: '/auth/profile/avatar',
    TWO_FACTOR_GENERATE: '/auth/2fa/generate',
    TWO_FACTOR_VERIFY: '/auth/2fa/verify',
    GOOGLE_LOGIN: '/auth/google',
    FACEBOOK_LOGIN: '/auth/facebook',
  },
  USERS: {
    GET_ALL: '/users',
    GET_ONE: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
  },
  POSTS: {
    GET_FEED: '/posts/feed',
    CREATE: '/posts',
    GET_ONE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like',
    COMMENT: (id: string) => /posts/${id}/comments`,
  },
  ANALYSIS: {
    GET_ALL: '/analyses',
    CREATE: '/analyses',
    GET_ONE: (id: string) => `/analyses/${id}`,
    STATS: '/analyses/stats',
    COMPARE: '/analyses/compare',
  },
  ROUTINES: {
    GET_ALL: '/routines',
    CREATE: '/routines',
    UPDATE: (id: string) => `/routines/${id}`,
    DELETE: (id: string) => `/routines/${id}`,
  },
  SUBSCRIPTIONS: {
    GET_CURRENT: '/subscriptions/current',
    GET_PLANS: '/subscriptions/plans',
  },
};
