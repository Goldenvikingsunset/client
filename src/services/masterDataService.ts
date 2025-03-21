import api from './api';
import { Module, SubModule, Function, Priority, Status, FitGapStatus, SolutionOption, BCFunctionalDepartment, FunctionalArea } from '../types';

// Generic function to fetch all entities of a specific type
const getAll = async <T>(endpoint: string): Promise<T[]> => {
  const response = await api.get<T[]>(endpoint);
  return response.data;
};

// Generic function to get a specific entity by ID
const getById = async <T>(endpoint: string, id: number): Promise<T> => {
  const response = await api.get<T>(`${endpoint}/${id}`);
  return response.data;
};

// Generic function to create an entity
const create = async <T>(endpoint: string, data: Partial<T>): Promise<T> => {
  const response = await api.post<T>(endpoint, data);
  return response.data;
};

// Generic function to update an entity
const update = async <T>(endpoint: string, id: number, data: Partial<T>): Promise<T> => {
  const response = await api.put<T>(`${endpoint}/${id}`, data);
  return response.data;
};

// Generic function to delete an entity
const deleteEntity = async (endpoint: string, id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`${endpoint}/${id}`);
  return response.data;
};

// Module endpoints
export const modules = {
  getAll: async (): Promise<Module[]> => {
    const response = await api.get<Module[]>('/master-data/modules');
    return response.data;
  },
  getById: (id: number) => getById<Module>('/master-data/modules', id),
  create: (data: Partial<Module>) => create<Module>('/master-data/modules', data),
  update: (id: number, data: Partial<Module>) => update<Module>('/master-data/modules', id, data),
  delete: (id: number) => deleteEntity('/master-data/modules', id)
};

// SubModule endpoints
export const subModules = {
  getAll: async (): Promise<SubModule[]> => {
    const response = await api.get<SubModule[]>('/master-data/submodules');
    return response.data;
  },
  getById: (id: number) => getById<SubModule>('/master-data/submodules', id),
  create: (data: Partial<SubModule>) => create<SubModule>('/master-data/submodules', data),
  update: (id: number, data: Partial<SubModule>) => update<SubModule>('/master-data/submodules', id, data),
  delete: (id: number) => deleteEntity('/master-data/submodules', id)
};

// Function endpoints
export const functions = {
  getAll: async (): Promise<Function[]> => {
    const response = await api.get<Function[]>('/master-data/functions');
    return response.data;
  },
  getById: (id: number) => getById<Function>('/master-data/functions', id),
  create: (data: Partial<Function>) => create<Function>('/master-data/functions', data),
  update: (id: number, data: Partial<Function>) => update<Function>('/master-data/functions', id, data),
  delete: (id: number) => deleteEntity('/master-data/functions', id)
};

// Priority endpoints
export const priorities = {
  getAll: async (): Promise<Priority[]> => {
    const response = await api.get<Priority[]>('/master-data/priorities');
    return response.data;
  },
  getById: (id: number) => getById<Priority>('/master-data/priorities', id),
  create: (data: Partial<Priority>) => create<Priority>('/master-data/priorities', data),
  update: (id: number, data: Partial<Priority>) => update<Priority>('/master-data/priorities', id, data),
  delete: (id: number) => deleteEntity('/master-data/priorities', id)
};

// Status endpoints
export const statuses = {
  getAll: async (): Promise<Status[]> => {
    const response = await api.get<Status[]>('/master-data/statuses');
    return response.data;
  },
  getById: (id: number) => getById<Status>('/master-data/statuses', id),
  create: (data: Partial<Status>) => create<Status>('/master-data/statuses', data),
  update: (id: number, data: Partial<Status>) => update<Status>('/master-data/statuses', id, data),
  delete: (id: number) => deleteEntity('/master-data/statuses', id)
};

// FitGapStatus endpoints
export const fitGapStatuses = {
  getAll: async (): Promise<FitGapStatus[]> => {
    const response = await api.get<FitGapStatus[]>('/master-data/fitgap-statuses');
    return response.data;
  },
  getById: (id: number) => getById<FitGapStatus>('/master-data/fitgap-statuses', id),
  create: (data: Partial<FitGapStatus>) => create<FitGapStatus>('/master-data/fitgap-statuses', data),
  update: (id: number, data: Partial<FitGapStatus>) => update<FitGapStatus>('/master-data/fitgap-statuses', id, data),
  delete: (id: number) => deleteEntity('/master-data/fitgap-statuses', id)
};

// SolutionOption endpoints
export const solutionOptions = {
  getAll: async (): Promise<SolutionOption[]> => {
    const response = await api.get<SolutionOption[]>('/master-data/solution-options');
    return response.data;
  },
  getById: (id: number) => getById<SolutionOption>('/master-data/solution-options', id),
  create: (data: Partial<SolutionOption>) => create<SolutionOption>('/master-data/solution-options', data),
  update: (id: number, data: Partial<SolutionOption>) => update<SolutionOption>('/master-data/solution-options', id, data),
  delete: (id: number) => deleteEntity('/master-data/solution-options', id)
};

// BC RTM endpoints
export const bcrtm = {
  getDepartments: async (): Promise<{ departments: BCFunctionalDepartment[] }> => {
    const response = await api.get('/api/departments');
    return response.data;
  },
  getFunctionalAreas: async (params?: { department_id?: number }): Promise<{ areas: FunctionalArea[] }> => {
    const response = await api.get('/api/functional-areas', { params });
    return response.data;
  },
  getSolutionOptions: async (): Promise<{ options: SolutionOption[] }> => {
    const response = await api.get('/api/solution-options');
    return response.data;
  },
  createDepartment: async (data: { name: string; description: string }) => {
    const response = await api.post('/bc-data/departments', data);
    return response.data;
  },
  updateDepartment: async (id: number, data: { name: string; description: string }) => {
    const response = await api.put(`/bc-data/departments/${id}`, data);
    return response.data;
  },
  deleteDepartment: async (id: number) => {
    const response = await api.delete(`/bc-data/departments/${id}`);
    return response.data;
  },
};