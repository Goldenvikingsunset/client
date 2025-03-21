import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { hasRole } from '../../utils/auth';

// Base type for all master data entities
interface BaseMasterData {
  id: number;
  name: string;
  description?: string;
  [key: string]: any;
}

interface MasterDataTableProps<T extends BaseMasterData> {
  title: string;
  entityName: string;
  data: T[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onAdd: (item: Partial<T>) => Promise<void>;
  onUpdate: (id: number, item: Partial<T>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  additionalColumns?: {
    header: string;
    accessor: string;
    render?: (item: T) => React.ReactNode;
  }[];
  idField?: string;
}

const MasterDataTable = <T extends BaseMasterData>({
  title,
  entityName,
  data,
  loading,
  error,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onAdd,
  onUpdate,
  onDelete,
  additionalColumns = [],
  idField = 'id',
}: MasterDataTableProps<T>) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Partial<T>>({ name: '', description: '' } as Partial<T>);
  const [editedItem, setEditedItem] = useState<Partial<T>>({} as Partial<T>);
  const [addMode, setAddMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reset form states when data changes
  useEffect(() => {
    setEditingId(null);
    setAddMode(false);
    setActionError(null);
  }, [data]);

  // Handle table page change
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  // Start editing an item
  const handleStartEdit = (item: T) => {
    setEditingId(item[idField]);
    setEditedItem({ ...item });
    setAddMode(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedItem({} as Partial<T>);
    setAddMode(false);
    setActionError(null);
  };

  // Save edited item
  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      setActionLoading(true);
      setActionError(null);
      await onUpdate(editingId, editedItem);
      setEditingId(null);
      setEditedItem({} as Partial<T>);
    } catch (err: any) {
      console.error('Error updating item:', err);
      setActionError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setActionLoading(false);
    }
  };

  // Start adding new item
  const handleStartAdd = () => {
    setAddMode(true);
    setEditingId(null);
    setNewItem({ name: '', description: '' } as Partial<T>);
    setActionError(null);
  };

  // Cancel adding
  const handleCancelAdd = () => {
    setAddMode(false);
    setNewItem({ name: '', description: '' } as Partial<T>);
    setActionError(null);
  };

  // Save new item
  const handleSaveAdd = async () => {
    if (!newItem.name) {
      setActionError('Name is required');
      return;
    }
    
    try {
      setActionLoading(true);
      setActionError(null);
      await onAdd(newItem);
      setAddMode(false);
      setNewItem({ name: '', description: '' } as Partial<T>);
    } catch (err: any) {
      console.error('Error adding item:', err);
      setActionError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete confirmation
  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Close delete confirmation
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  // Confirm and delete item
  const handleConfirmDelete = async () => {
    if (itemToDelete === null) return;
    
    try {
      setActionLoading(true);
      await onDelete(itemToDelete);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setActionError(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle input change for new item
  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle input change for edited item
  const handleEditItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
          
          {hasRole('Admin') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleStartAdd}
              disabled={addMode || !!editingId}
            >
              New {entityName}
            </Button>
          )}
        </Box>
        
        {(error || actionError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || actionError}
          </Alert>
        )}
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label={`${entityName} data table`}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                {additionalColumns.map((col) => (
                  <TableCell key={col.header}>{col.header}</TableCell>
                ))}
                {hasRole('Admin') && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {addMode && (
                <TableRow>
                  <TableCell>
                    <TextField
                      name="name"
                      value={newItem.name || ''}
                      onChange={handleNewItemChange}
                      fullWidth
                      size="small"
                      placeholder="Enter name"
                      error={actionError?.includes('Name')}
                      helperText={actionError?.includes('Name') ? actionError : ''}
                      inputProps={{
                        'aria-label': `New ${entityName.toLowerCase()} name`
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      name="description"
                      value={newItem.description || ''}
                      onChange={handleNewItemChange}
                      fullWidth
                      size="small"
                      placeholder="Enter description"
                      inputProps={{
                        'aria-label': `New ${entityName.toLowerCase()} description`
                      }}
                    />
                  </TableCell>
                  {additionalColumns.map((col) => (
                    <TableCell key={col.header}>
                      <TextField
                        name={col.accessor}
                        value={newItem[col.accessor] || ''}
                        onChange={handleNewItemChange}
                        fullWidth
                        size="small"
                        placeholder={`Enter ${col.header.toLowerCase()}`}
                        inputProps={{
                          'aria-label': `New ${entityName.toLowerCase()} ${col.header.toLowerCase()}`
                        }}
                      />
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={handleSaveAdd}
                      disabled={actionLoading}
                      aria-label={`Save new ${entityName.toLowerCase()}`}
                    >
                      {actionLoading ? <CircularProgress size={24} /> : <SaveIcon />}
                    </IconButton>
                    <IconButton
                      color="default"
                      onClick={handleCancelAdd}
                      disabled={actionLoading}
                      aria-label="Cancel adding new item"
                    >
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
              
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2 + additionalColumns.length + (hasRole('Admin') ? 1 : 0)} align="center">
                    <CircularProgress size={30} sx={{ my: 3 }} aria-label="Loading data" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2 + additionalColumns.length + (hasRole('Admin') ? 1 : 0)} align="center">
                    <Typography variant="body1" sx={{ my: 3 }}>
                      No {entityName.toLowerCase()}s found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item[idField]}>
                    <TableCell>
                      {editingId === item[idField] ? (
                        <TextField
                          name="name"
                          value={editedItem.name || ''}
                          onChange={handleEditItemChange}
                          fullWidth
                          size="small"
                          error={actionError?.includes('Name')}
                          helperText={actionError?.includes('Name') ? actionError : ''}
                          inputProps={{
                            'aria-label': `Edit ${entityName.toLowerCase()} name`
                          }}
                        />
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item[idField] ? (
                        <TextField
                          name="description"
                          value={editedItem.description || ''}
                          onChange={handleEditItemChange}
                          fullWidth
                          size="small"
                          inputProps={{
                            'aria-label': `Edit ${entityName.toLowerCase()} description`
                          }}
                        />
                      ) : (
                        item.description || '-'
                      )}
                    </TableCell>
                    {additionalColumns.map((col) => (
                      <TableCell key={col.header}>
                        {editingId === item[idField] ? (
                          <TextField
                            name={col.accessor}
                            value={editedItem[col.accessor] || ''}
                            onChange={handleEditItemChange}
                            fullWidth
                            size="small"
                            inputProps={{
                              'aria-label': `Edit ${entityName.toLowerCase()} ${col.header.toLowerCase()}`
                            }}
                          />
                        ) : col.render ? (
                          col.render(item)
                        ) : (
                          item[col.accessor] || '-'
                        )}
                      </TableCell>
                    ))}
                    {hasRole('Admin') && (
                      <TableCell align="right">
                        {editingId === item[idField] ? (
                          <>
                            <IconButton
                              color="primary"
                              onClick={handleSaveEdit}
                              disabled={actionLoading}
                              aria-label="Save changes"
                            >
                              {actionLoading ? <CircularProgress size={24} /> : <SaveIcon />}
                            </IconButton>
                            <IconButton
                              color="default"
                              onClick={handleCancelEdit}
                              disabled={actionLoading}
                              aria-label="Cancel editing"
                            >
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Edit">
                              <IconButton
                                color="primary"
                                onClick={() => handleStartEdit(item)}
                                disabled={!!editingId || addMode}
                                aria-label={`Edit ${entityName.toLowerCase()}`}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteClick(item[idField])}
                                disabled={!!editingId || addMode}
                                aria-label={`Delete ${entityName.toLowerCase()}`}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleCloseDeleteConfirm}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this {entityName.toLowerCase()}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteConfirm} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              color="error" 
              disabled={actionLoading}
              autoFocus
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default MasterDataTable;