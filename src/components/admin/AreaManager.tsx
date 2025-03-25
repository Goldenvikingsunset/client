import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { bcrtm } from '../../services/masterDataService';
import { BCFunctionalDepartment, FunctionalArea } from '../../types';
import { useAuth } from '../../context/AuthContext';

const AreaManager: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<BCFunctionalDepartment[]>([]);
  const [areas, setAreas] = useState<FunctionalArea[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<FunctionalArea | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'Admin';

  // Fetch departments and areas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptResponse, areasResponse] = await Promise.all([
          bcrtm.getDepartments(),
          bcrtm.getFunctionalAreas(),
        ]);
        setDepartments(deptResponse.departments || []);
        setAreas(areasResponse.areas || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      }
    };
    fetchData();
  }, []);

  // Filter areas by selected department
  const filteredAreas = selectedDepartment
    ? areas.filter((area) => area.department_id === parseInt(selectedDepartment))
    : areas;

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      department_id: selectedDepartment || '',
    });
    setEditingArea(null);
  };

  // Open dialog for adding
  const handleAddClick = () => {
    resetFormData();
    setOpenDialog(true);
  };

  // Open dialog for editing
  const handleEditClick = (area: FunctionalArea) => {
    setFormData({
      name: area.name,
      description: area.description || '',
      department_id: String(area.department_id),
    });
    setEditingArea(area);
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleClose = () => {
    setOpenDialog(false);
    resetFormData();
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle department select change
  const handleDepartmentChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      department_id: value,
    }));
  };

  // Handle filter department change
  const handleFilterDepartmentChange = (e: SelectChangeEvent) => {
    setSelectedDepartment(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Check for required fields
      if (!formData.name || !formData.department_id) {
        setError('Name and department are required');
        return;
      }

      // Prepare data
      const areaData = {
        name: formData.name,
        description: formData.description,
        department_id: parseInt(formData.department_id),
      };

      // Create or update area
      if (editingArea) {
        await bcrtm.updateArea(editingArea.id, areaData);
        setSuccess(`Area "${formData.name}" updated successfully`);
        
        // Update local state
        setAreas((prev) =>
          prev.map((area) =>
            area.id === editingArea.id
              ? { ...area, ...areaData }
              : area
          )
        );
      } else {
        const result = await bcrtm.createArea(areaData);
        setSuccess(`Area "${formData.name}" created successfully`);
        
        // Add to local state
        setAreas((prev) => [...prev, result.area]);
      }

      // Close dialog
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save area');
    }
  };

  // Handle area deletion
  const handleDeleteArea = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this area?')) {
      return;
    }
    
    try {
      await bcrtm.deleteArea(id);
      
      // Update local state
      setAreas((prev) => prev.filter((area) => area.id !== id));
      setSuccess('Area deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete area');
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Functional Area Management
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {success && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          {success}
        </Typography>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="department-filter-label">Filter by Department</InputLabel>
            <Select
              labelId="department-filter-label"
              value={selectedDepartment}
              label="Filter by Department"
              onChange={handleFilterDepartmentChange}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Add Functional Area
            </Button>
          )}
        </Grid>
      </Grid>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Department</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAreas.length > 0 ? (
                filteredAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>{area.name}</TableCell>
                    <TableCell>{area.description}</TableCell>
                    <TableCell>
                      {departments.find((d) => d.id === area.department_id)?.name}
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEditClick(area)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteArea(area.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} align="center">
                    No functional areas found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingArea ? 'Edit Functional Area' : 'Add Functional Area'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Area Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="department-select-label">Department</InputLabel>
              <Select
                labelId="department-select-label"
                name="department_id"
                value={formData.department_id}
                label="Department"
                onChange={handleDepartmentChange}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingArea ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AreaManager;