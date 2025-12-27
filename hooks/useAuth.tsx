import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, saveTokens, clearTokens } from '../utils/apiHelpers';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Auth initialization failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 NEW: Function to be called by LoginScreen
  const loginUser = async (token: string, rememberMe: boolean, email: string) => {
    await saveTokens(token, rememberMe, email); // Save to disk
    setIsLoggedIn(true); // Update state to trigger UI switch
  };

  const logoutUser = async () => {
    await clearTokens();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);