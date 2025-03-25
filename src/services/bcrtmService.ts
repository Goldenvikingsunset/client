import api from './api';
import { BCFunctionalDepartment, FunctionalArea } from '../types';

export const getDepartments = async (): Promise<{ departments: BCFunctionalDepartment[] }> => {
  try {
    const response = await api.get<{ departments: BCFunctionalDepartment[] }>('/bc-data/departments');
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const getFunctionalAreas = async (params?: { department_id?: number }): Promise<{ areas: FunctionalArea[] }> => {
  try {
    const response = await api.get<{ areas: FunctionalArea[] }>('/bc-data/functional-areas', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching functional areas:', error);
    throw error;
  }
};

export const getFunctionalAreasByDepartment = async (departmentId: number): Promise<{ areas: FunctionalArea[] }> => {
  try {
    const response = await api.get<{ areas: FunctionalArea[] }>(`/bc-data/functional-areas/by-department/${departmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching functional areas for department ${departmentId}:`, error);
    throw error;
  }
};

export const createDepartment = async (data: { name: string, description: string }): Promise<BCFunctionalDepartment> => {
  try {
    const response = await api.post<BCFunctionalDepartment>('/bc-data/departments', data);
    return response.data;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const updateDepartment = async (id: number, data: { name: string, description: string }): Promise<BCFunctionalDepartment> => {
  try {
    const response = await api.put<BCFunctionalDepartment>(`/bc-data/departments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating department ${id}:`, error);
    throw error;
  }
};

export const deleteDepartment = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(`/bc-data/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting department ${id}:`, error);
    throw error;
  }
};

export const createArea = async (data: { name: string; description: string; department_id: number }): Promise<FunctionalArea> => {
  try {
    const response = await api.post<FunctionalArea>('/bc-data/functional-areas', data);
    return response.data;
  } catch (error) {
    console.error('Error creating functional area:', error);
    throw error;
  }
};

export const updateArea = async (id: number, data: { name?: string; description?: string; department_id?: number }): Promise<FunctionalArea> => {
  try {
    const response = await api.put<FunctionalArea>(`/bc-data/functional-areas/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating functional area ${id}:`, error);
    throw error;
  }
};

export const deleteArea = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(`/bc-data/functional-areas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting functional area ${id}:`, error);
    throw error;
  }
};

const bcrtmService = {
  getDepartments,
  getFunctionalAreas,
  getFunctionalAreasByDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createArea,
  updateArea,
  deleteArea,
};

export default bcrtmService;
