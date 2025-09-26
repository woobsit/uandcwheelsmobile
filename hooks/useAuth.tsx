// src/hooks/useAuth.ts

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getAuthToken, clearTokens } from '../utils/apiHelpers';

// Define the shape of the user object
interface User {
  id: string;
  name: string;
  email: string;
  // Add other user properties here as needed
}

// Define the shape of the AuthContext value
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// AuthProvider component to wrap the application
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          // In a real app, you would decode the token or fetch user info here
          setUser({ id: 'dummy_id', name: 'Dummy User', email: 'dummy@example.com' });
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (userData: User) => {
    // This function will be called by your login screen
    // after a successful login API call.
    setUser(userData);
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
  };

  const value = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}