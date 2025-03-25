import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, setCurrentUser as setCurrentUserInStorage, 
         setAuthToken as setAuthTokenInStorage, 
         clearAuth } from '../utils/auth';
import { User } from '../types';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  token: string | null;
  setCurrentUser: (user: User) => void;
  setAuthToken: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setCurrentUser: () => {},
  setAuthToken: () => {},
  logout: () => {},
  isLoading: true,
});

// Props for the AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from storage on component mount
  useEffect(() => {
    const storedUser = getCurrentUser();
    const storedToken = localStorage.getItem('token');
    
    setUser(storedUser);
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  // Set user and update storage
  const setCurrentUser = (user: User) => {
    setUser(user);
    setCurrentUserInStorage(user);
  };

  // Set token and update storage
  const setAuthToken = (token: string) => {
    setToken(token);
    setAuthTokenInStorage(token);
  };

  // Clear all auth data
  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuth();
  };

  const value = {
    user,
    token,
    setCurrentUser,
    setAuthToken,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => {
  return React.useContext(AuthContext);
};