import api from './api';
import { User } from '../types';

// Get all users (admin only)
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

// Get user by ID (admin only)
export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

// Create user (admin only)
export const createUser = async (userData: {
  username: string;
  email: string;
  password: string;
  role: 'Admin' | 'Consultant' | 'Client';
}): Promise<User> => {
  const response = await api.post<User>('/users', userData);
  return response.data;
};

// Update user (admin only)
export const updateUser = async (
  id: number,
  userData: Partial<{
    username: string;
    email: string;
    role: 'Admin' | 'Consultant' | 'Client';
  }>
): Promise<User> => {
  const response = await api.put<User>(`/users/${id}`, userData);
  return response.data;
};

// Update user password (admin only)
export const updateUserPassword = async (id: number, password: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/users/${id}/password`, { password });
  return response.data;
};

// Delete user (admin only)
export const deleteUser = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/users/${id}`);
  return response.data;
};

// Update profile (for current user)
export const updateProfile = async (profileData: {
  username?: string;
  email?: string;
}): Promise<User> => {
  const response = await api.put<User>('/auth/profile', profileData);
  return response.data;
};

// Change password (for current user)
export const changePassword = async (passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>('/auth/change-password', passwordData);
  return response.data;
};