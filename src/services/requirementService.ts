import api from './api';
import { 
  Requirement, 
  RequirementsResponse, 
  RequirementResponse, 
  RequirementForm,
  StatsResponse
} from '../types';

// Get all requirements with optional filters
export const getRequirements = async (
  page = 1, 
  limit = 10, 
  filters: Record<string, string | boolean | number> = {}
): Promise<RequirementsResponse> => {
  const params = { page, limit, ...filters };
  const response = await api.get<RequirementsResponse>('/requirements', { params });
  return response.data;
};

// Get a single requirement by ID
export const getRequirementById = async (id: number): Promise<RequirementResponse> => {
  const response = await api.get<RequirementResponse>(`/requirements/${id}`);
  return response.data;
};

// Create a new requirement
export const createRequirement = async (requirement: RequirementForm): Promise<{ requirement: Requirement, message: string }> => {
  const response = await api.post<{ requirement: Requirement, message: string }>('/requirements', requirement);
  return response.data;
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
  importedRequirements: Requirement[], 
  message: string,
  errors?: Array<{ index: number, data: any, error: string }>
}> => {
  const response = await api.post<{ 
    importedRequirements: Requirement[], 
    message: string,
    errors?: Array<{ index: number, data: any, error: string }>
  }>('/requirements/bulk-import', { requirements });
  return response.data;
};

// Get requirement statistics for dashboard
export const getRequirementStats = async (): Promise<StatsResponse> => {
  try {
    const response = await api.get<StatsResponse>('/requirements/stats');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching stats:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
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