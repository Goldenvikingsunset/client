import React, { useState, useEffect, useCallback } from 'react';
import MasterDataTable from './MasterDataTable';

// Base type for all master data entities
interface BaseMasterData {
  id: number;
  name: string;
  description?: string;
  [key: string]: any;
}

// Interface for the generic service
interface EntityService<T> {
  getAll: () => Promise<T[]>;
  getById: (id: number) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: number, data: Partial<T>) => Promise<T>;
  delete: (id: number) => Promise<{ message: string }>;
}

// Props for the GenericMasterDataPage
interface GenericMasterDataPageProps<T> {
  title: string;
  entityName: string;
  service: EntityService<T>;
  idField: string;
  additionalColumns?: {
    header: string;
    accessor: string;
    render?: (item: any) => React.ReactNode;
  }[];
}

// Type for entity with ID
interface EntityWithId extends BaseMasterData {
  [key: string]: any;
}

function GenericMasterDataPage<T extends Record<string, any>>({
  title,
  entityName,
  service,
  idField,
  additionalColumns = [],
}: GenericMasterDataPageProps<T>) {
  const [data, setData] = useState<EntityWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await service.getAll();
      
      // Map the data to include id field and handle description properly
      const mappedData = response.map(item => ({
        ...item,
        id: item[idField],
        name: item.name || '',
        description: item.description || undefined // Convert null to undefined
      }));
      
      setData(mappedData as EntityWithId[]);
      setTotalCount(response.length);
    } catch (err: any) {
      console.error(`Error fetching ${entityName.toLowerCase()}:`, err);
      setError(err.response?.data?.message || `Failed to load ${entityName.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [entityName, idField, service]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle creating a new entity
  const handleAdd = async (item: Partial<EntityWithId>) => {
    try {
      const createData: Partial<T> = {
        ...item as any
      };
      
      await service.create(createData);
      
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error(`Error adding ${entityName.toLowerCase()}:`, err);
      throw err;
    }
  };

  // Handle updating an entity
  const handleUpdate = async (id: number, item: Partial<EntityWithId>) => {
    try {
      const updateData: Partial<T> = {
        ...item as any
      };
      
      await service.update(id, updateData);
      
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error(`Error updating ${entityName.toLowerCase()}:`, err);
      throw err;
    }
  };

  // Handle deleting an entity
  const handleDelete = async (id: number) => {
    try {
      await service.delete(id);
      
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error(`Error deleting ${entityName.toLowerCase()}:`, err);
      throw err;
    }
  };

  return (
    <MasterDataTable<EntityWithId>
      title={title}
      entityName={entityName}
      data={data.slice(page * rowsPerPage, (page + 1) * rowsPerPage)}
      loading={loading}
      error={error}
      totalCount={totalCount}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      idField={idField}
      additionalColumns={additionalColumns}
    />
  );
}

export default GenericMasterDataPage;