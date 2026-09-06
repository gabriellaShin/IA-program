import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getCurrentUser, logout as logoutService, hasToken } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on init
  useEffect(() => {
    async function loadUser() {
      if (hasToken()) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          logoutService();
        }
      }
      setLoading(false);
    }

    loadUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
