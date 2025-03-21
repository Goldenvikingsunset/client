import React, { useState, useEffect } from 'react';
import { 
  Box, Button, TextField, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogActions, DialogContent, 
  DialogTitle, IconButton, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { bcrtm } from '../../services/masterDataService';
import { BCFunctionalDepartment } from '../../types';

const DepartmentManager: React.FC = () => {
  const [departments, setDepartments] = useState<BCFunctionalDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<{id?: number, name: string, description: string}>({
    name: '',
    description: ''
  });

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await bcrtm.getDepartments();
      setDepartments(response.departments || []);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenDialog = (department?: BCFunctionalDepartment) => {
    if (department) {
      setCurrentDepartment({ 
        id: department.id, 
        name: department.name, 
        description: department.description ? String(department.description) : '' 
      });
      setIsEdit(true);
    } else {
      setCurrentDepartment({ name: '', description: '' });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEdit && currentDepartment.id) {
        await bcrtm.updateDepartment(currentDepartment.id, currentDepartment);
        setSuccess('Department updated successfully');
      } else {
        await bcrtm.createDepartment(currentDepartment);
        setSuccess('Department created successfully');
      }
      
      setOpenDialog(false);
      fetchDepartments();
    } catch (err: any) {
      console.error('Error saving department:', err);
      setError(err.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await bcrtm.deleteDepartment(id);
      setSuccess('Department deleted successfully');
      fetchDepartments();
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.message || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Department Management</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add Department
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
        )}

        {loading && !openDialog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No departments found. Add your first department.
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>{dept.id}</TableCell>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell>{dept.description}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenDialog(dept)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(dept.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEdit ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Department Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentDepartment.name}
            onChange={(e) => setCurrentDepartment({...currentDepartment, name: e.target.value})}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={currentDepartment.description}
            onChange={(e) => setCurrentDepartment({...currentDepartment, description: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!currentDepartment.name || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentManager;
