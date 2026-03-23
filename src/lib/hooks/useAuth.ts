import { useCallback } from 'react';
import { useAuthStore } from '../../stores/auth.store';

/**
 * Custom hook for auth operations
 */
export const useAuth = () => {
  const { user, isAuthenticated, login, logout, setUser } = useAuthStore();

  const isLoggedIn = useCallback(() => {
    return isAuthenticated && !!user;
  }, [isAuthenticated, user]);

  const getUserId = useCallback(() => {
    return user?.sub;
  }, [user]);

  return {
    user,
    isAuthenticated,
    isLoggedIn: isLoggedIn(),
    userId: getUserId(),
    login,
    logout,
    setUser,
  };
};
