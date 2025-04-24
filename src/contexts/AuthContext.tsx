
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'oidc-client-ts';
import { oktaAuth } from '@/services/oktaAuth';

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    oktaAuth.getUser().then(user => setUser(user));
  }, []);

  const login = async () => {
    await oktaAuth.login();
  };

  const logout = async () => {
    await oktaAuth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
