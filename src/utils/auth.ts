import { jwtDecode } from 'jwt-decode';
import { User } from '../types';

interface JwtPayload {
  id: number;
  exp: number;
}

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as User;
  } catch (error) {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const hasRole = (role: 'Admin' | 'Consultant' | 'Client'): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (role === 'Admin') {
    return user.role === 'Admin';
  } else if (role === 'Consultant') {
    return user.role === 'Admin' || user.role === 'Consultant';
  } else {
    return true; // All users have at least Client role
  }
}; 