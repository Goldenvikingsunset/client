import api from './api';
import axios from 'axios';
import { 
  Requirement, 
  RequirementsResponse, 
  RequirementResponse, 
  RequirementForm,
  StatsResponse
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get all requirements with optional filters
export const getRequirements = async (
  page = 1, 
  limit = 10, 
  filters: Record<string, string | boolean | number> = {}
): Promise<RequirementsResponse> => {
  const params = { page, limit, ...filters };
  const response = await api.get<RequirementsResponse>('/requirements', { 
    params,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return response.data;
};

// Get a single requirement by ID
export const getRequirementById = async (id: number): Promise<RequirementResponse> => {
  const response = await api.get<RequirementResponse>(`/requirements/${id}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return response.data;
};

// Create a new requirement
export const createRequirement = async (requirement: RequirementForm): Promise<Requirement> => {
  try {
    const response = await axios.post(`${API_URL}/requirements`, requirement);
    return response.data;
  } catch (error) {
    // Add better error handling
    console.error('Error creating requirement:', error);
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

// Update an existing requirement
export const updateRequirement = async (
  id: number, 
  requirement: Partial<RequirementForm>
): Promise<RequirementResponse> => {
  const response = await api.put<RequirementResponse>(`/requirements/${id}`, requirement);
  return response.data;
};

// Delete a requirement
export const deleteRequirement = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/requirements/${id}`);
  return response.data;
};

// Bulk import requirements
export const bulkImportRequirements = async (requirements: RequirementForm[]): Promise<{
  importedRequirements: Requirement[];
  errors: Array<{index: number; error: string}>;
}> => {
  try {
    const response = await axios.post(`${API_URL}/requirements/bulk`, {
      requirements,
      validateOnly: false
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk importing requirements:', error);
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

// Get requirement statistics for dashboard
export const getRequirementStats = async () => {
  try {
    const response = await api.get<StatsResponse>('/requirements/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error; // Let the component handle the error
  }
};

// Export requirements
export const exportRequirements = async (format: 'excel' | 'pdf', filters?: Record<string, any>): Promise<void> => {
  try {
    const response = await api.get(`/requirements/export/${format}`, {
      params: filters,
      responseType: 'blob',
      headers: {
        Accept: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      }
    });

    // Verify the response is actually a blob
    if (!(response.data instanceof Blob)) {
      throw new Error('Invalid response format received from server');
    }

    // Check if the response is an error message
    if (response.data.type === 'application/json') {
      const text = await response.data.text();
      const error = JSON.parse(text);
      throw new Error(error.message || 'Export failed');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `requirements.${format}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }

    // Create and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data], {
      type: format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    }));

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error: any) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Export failed');
      } catch (e) {
        throw new Error('Export failed: Unable to process server response');
      }
    }
    throw error;
  }
};

// Bulk delete requirements - new method
export const bulkDeleteRequirements = async (ids: number[]): Promise<{ message: string, count: number }> => {
  const response = await api.delete<{ message: string, count: number }>('/requirements/bulk', {
    data: { ids }
  });
  return response.data;
};

// Add type validation helper
const validateRequirement = (requirement: RequirementForm): boolean => {
  const requiredFields = [
    'title',
    'description', 
    'module',
    'submodule',
    'function',
    'priority',
    'status',
    'fitgap'
  ];

  return requiredFields.every(field => requirement[field as keyof RequirementForm] !== undefined);
};

// Add validation endpoint
export const validateRequirements = async (requirements: RequirementForm[]): Promise<{
  valid: boolean;
  errors: Array<{index: number; error: string}>;
}> => {
  try {
    const response = await axios.post(`${API_URL}/requirements/validate`, {
      requirements
    });
    return response.data;
  } catch (error) {
    console.error('Error validating requirements:', error);
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};