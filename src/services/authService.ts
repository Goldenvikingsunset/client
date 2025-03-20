import api from './api';
import { LoginForm, RegisterForm, PasswordResetRequestForm, PasswordResetForm, User } from '../types';

// Interface for auth response
interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// Login user
export const login = async (credentials: LoginForm): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

// Register user
export const register = async (userData: RegisterForm): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

// Get current user info
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data.user;
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

// Request password reset
export const requestPasswordReset = async (data: PasswordResetRequestForm): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/request-password-reset', data);
  return response.data;
};

// Reset password with token
export const resetPassword = async (data: PasswordResetForm): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/reset-password', {
    token: data.token,
    newPassword: data.newPassword
  });
  return response.data;
};

// Logout user (client-side only)
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}; 