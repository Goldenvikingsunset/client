import React, { useState, useEffect } from 'react';
import { modules } from '../../services/masterDataService';
import MasterDataTable from './MasterDataTable';
import { Module } from '../../types';

// Extend Module to match BaseMasterData
interface ModuleWithId extends Omit<Module, 'description'> {
  id: number;
  description?: string; // Make description optional string (not null)
}

const ModulesPage: React.FC = () => {
  const [data, setData] = useState<ModuleWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch modules data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await modules.getAll();
      // Map the data to include id field and handle description properly
      const mappedData = response.map(module => ({
        ...module,
        id: module.module_id,
        description: module.description || undefined // Convert null to undefined
      }));
      setData(mappedData);
      setTotalCount(response.length);
    } catch (err: any) {
      console.error('Error fetching modules:', err);
      setError(err.response?.data?.message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle creating a new module
  const handleAddModule = async (item: Partial<ModuleWithId>) => {
    try {
      await modules.create({
        name: item.name,
        description: item.description || '',
      });
      
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error('Error adding module:', err);
      throw err;
    }
  };

  // Handle updating a module
  const handleUpdateModule = async (id: number, item: Partial<ModuleWithId>) => {
    try {
      await modules.update(id, {
        name: item.name,
        description: item.description || '',
      });
      
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error('Error updating module:', err);
      throw err;
    }
  };

  // Handle deleting a module
  const handleDeleteModule = async (id: number) => {
    try {
      await modules.delete(id);
      
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error('Error deleting module:', err);
      throw err;
    }
  };

  return (
    <MasterDataTable<ModuleWithId>
      title="Modules"
      entityName="Module"
      data={data.slice(page * rowsPerPage, (page + 1) * rowsPerPage)}
      loading={loading}
      error={error}
      totalCount={totalCount}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onAdd={handleAddModule}
      onUpdate={handleUpdateModule}
      onDelete={handleDeleteModule}
      idField="module_id"
    />
  );
};

export default ModulesPage; 