import api from './api';
import { BCFunctionalDepartment, FunctionalArea } from '../types';

// Get all BC functional departments
export const getDepartments = async (): Promise<{ departments: BCFunctionalDepartment[] }> => {
  try {
    const response = await api.get<{ departments: BCFunctionalDepartment[] }>('/bc-data/departments');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching BC departments:', {
      message: error.message,
      response: error.response?.data
    });
    return { departments: [] }; // Return empty array on error
  }
};

// Get all functional areas
export const getFunctionalAreas = async (): Promise<{ areas: FunctionalArea[] }> => {
  try {
    const response = await api.get<{ areas: FunctionalArea[] }>('/bc-data/functional-areas');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching functional areas:', {
      message: error.message,
      response: error.response?.data
    });
    return { areas: [] }; // Return empty array on error
  }
};

const bcDataService = {
  getDepartments,
  getFunctionalAreas,
};

export default bcDataService;

// This ensures TypeScript treats this file as a module
export type BCDataService = typeof bcDataService;
