import api from './api';
import { BCFunctionalDepartment, FunctionalArea } from '../types';

export const getDepartments = async (): Promise<{ departments: BCFunctionalDepartment[] }> => {
  try {
    const response = await api.get<{ departments: BCFunctionalDepartment[] }>('/departments');
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const getFunctionalAreas = async (): Promise<{ areas: FunctionalArea[] }> => {
  try {
    const response = await api.get<{ areas: FunctionalArea[] }>('/functional-areas');
    return response.data;
  } catch (error) {
    console.error('Error fetching functional areas:', error);
    throw error;
  }
};

const bcrtmService = {
  getDepartments,
  getFunctionalAreas,
};

export default bcrtmService;
