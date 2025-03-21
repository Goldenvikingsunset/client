import api from './api';
import { BCFunctionalDepartment, FunctionalArea } from '../types';

/**
 * BC Master Data Service
 * Service for managing Business Central master data
 */

// Get all BC functional departments
export const getDepartments = async (): Promise<{ departments: BCFunctionalDepartment[] }> => {
  try {
    const response = await api.get<{ departments: BCFunctionalDepartment[] }>('/api/bc-data/bc-departments');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching BC departments:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

// Get all functional areas
export const getFunctionalAreas = async (): Promise<{ areas: FunctionalArea[] }> => {
  try {
    const response = await api.get<{ areas: FunctionalArea[] }>('/api/bc-data/functional-areas');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching functional areas:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

// Get functional areas by department
export const getFunctionalAreasByDepartment = async (departmentId: number): Promise<{ areas: FunctionalArea[] }> => {
  try {
    const response = await api.get<{ areas: FunctionalArea[] }>(`/api/bc-data/functional-areas/${departmentId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching functional areas for department ${departmentId}:`, {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

const bcMasterDataService = {
  getDepartments,
  getFunctionalAreas,
  getFunctionalAreasByDepartment
};

export default bcMasterDataService;