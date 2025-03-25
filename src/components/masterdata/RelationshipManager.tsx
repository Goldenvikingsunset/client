import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Breadcrumbs,
  Link,
  ListItemButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Functions as FunctionsIcon,
} from '@mui/icons-material';
import { modules, subModules, functions, bcrtm } from '../../services/masterDataService';
import { Module, SubModule, Function, BCFunctionalDepartment, FunctionalArea } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`relationship-tabpanel-${index}`}
      aria-labelledby={`relationship-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RelationshipManager: React.FC = () => {
  // State for tab management
  const [tabValue, setTabValue] = useState(0);

  // Module/Submodule/Function State
  const [modulesList, setModulesList] = useState<Module[]>([]);
  const [submodulesList, setSubmodulesList] = useState<SubModule[]>([]);
  const [functionsList, setFunctionsList] = useState<Function[]>([]);
  
  // BC Department/Functional Area State
  const [departmentsList, setDepartmentsList] = useState<BCFunctionalDepartment[]>([]);
  const [areasList, setAreasList] = useState<FunctionalArea[]>([]);
  
  // Selected items for viewing relationships
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedSubmodule, setSelectedSubmodule] = useState<SubModule | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<BCFunctionalDepartment | null>(null);
  
  // For adding new items with relationships
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [openSubmoduleDialog, setOpenSubmoduleDialog] = useState(false);
  const [openFunctionDialog, setOpenFunctionDialog] = useState(false);
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [openAreaDialog, setOpenAreaDialog] = useState(false);
  
  // Form data for new items
  const [newModule, setNewModule] = useState({ name: '', description: '' });
  const [newSubmodule, setNewSubmodule] = useState({ 
    name: '', 
    description: '', 
    module_id: '' 
  });
  const [newFunction, setNewFunction] = useState({ 
    name: '', 
    description: '', 
    submodule_id: '' 
  });
  const [newDepartment, setNewDepartment] = useState({ 
    name: '', 
    description: '' 
  });
  const [newArea, setNewArea] = useState({ 
    name: '', 
    description: '', 
    department_id: '' 
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all data on initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset selections when switching tabs
    setSelectedModule(null);
    setSelectedSubmodule(null);
    setSelectedDepartment(null);
  };

  // Fetch modules, submodules, functions, departments, and areas
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [modulesData, submodulesData, functionsData, departmentsResponse] = await Promise.all([
        modules.getAll(),
        subModules.getAll(),
        functions.getAll(),
        bcrtm.getDepartments()
      ]);

      setModulesList(modulesData);
      setSubmodulesList(submodulesData);
      setFunctionsList(functionsData);
      setDepartmentsList(departmentsResponse.departments || []);

      // If a department is selected, only fetch areas for that department
      if (selectedDepartment) {
        const areasResponse = await bcrtm.getFunctionalAreas({ department_id: selectedDepartment.id });
        setAreasList(areasResponse.areas || []);
      } else {
        const areasResponse = await bcrtm.getFunctionalAreas();
        setAreasList(areasResponse.areas || []);
      }
    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setError('Failed to load master data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Select a module to view its submodules
  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setSelectedSubmodule(null);
  };

  // Select a submodule to view its functions
  const handleSubmoduleSelect = (submodule: SubModule) => {
    setSelectedSubmodule(submodule);
  };

  // Select a department to view its functional areas
  const handleDepartmentSelect = async (department: BCFunctionalDepartment) => {
    setSelectedDepartment(department);
    try {
      const areasResponse = await bcrtm.getFunctionalAreas({ department_id: department.id });
      setAreasList(areasResponse.areas || []);
    } catch (err: any) {
      console.error('Error fetching areas for department:', err);
      setError('Failed to load functional areas for selected department');
    }
  };

  // Dialog handlers for creating new items
  const handleOpenModuleDialog = () => {
    setNewModule({ name: '', description: '' });
    setOpenModuleDialog(true);
  };

  const handleOpenSubmoduleDialog = () => {
    setNewSubmodule({ name: '', description: '', module_id: selectedModule?.module_id.toString() || '' });
    setOpenSubmoduleDialog(true);
  };

  const handleOpenFunctionDialog = () => {
    setNewFunction({ name: '', description: '', submodule_id: selectedSubmodule?.submodule_id.toString() || '' });
    setOpenFunctionDialog(true);
  };

  const handleOpenDepartmentDialog = () => {
    setNewDepartment({ name: '', description: '' });
    setOpenDepartmentDialog(true);
  };

  const handleOpenAreaDialog = () => {
    setNewArea({ 
      name: '', 
      description: '', 
      department_id: selectedDepartment?.id.toString() || '' 
    });
    setOpenAreaDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenModuleDialog(false);
    setOpenSubmoduleDialog(false);
    setOpenFunctionDialog(false);
    setOpenDepartmentDialog(false);
    setOpenAreaDialog(false);
  };

  // Create a new module
  const handleCreateModule = async () => {
    if (!newModule.name.trim()) {
      setError('Module name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await modules.create({
        name: newModule.name,
        description: newModule.description
      });
      
      setSuccess('Module created successfully');
      handleCloseDialogs();
      await fetchAllData();
    } catch (err: any) {
      console.error('Error creating module:', err);
      setError(err.response?.data?.message || 'Failed to create module');
    } finally {
      setLoading(false);
    }
  };

  // Create a new submodule
  const handleCreateSubmodule = async () => {
    if (!newSubmodule.name.trim()) {
      setError('Submodule name is required');
      return;
    }
    
    if (!newSubmodule.module_id) {
      setError('Module is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await subModules.create({
        name: newSubmodule.name,
        description: newSubmodule.description,
        module_id: parseInt(newSubmodule.module_id)
      });
      
      setSuccess('Submodule created successfully');
      handleCloseDialogs();
      await fetchAllData();
    } catch (err: any) {
      console.error('Error creating submodule:', err);
      setError(err.response?.data?.message || 'Failed to create submodule');
    } finally {
      setLoading(false);
    }
  };

  // Create a new function
  const handleCreateFunction = async () => {
    if (!newFunction.name.trim()) {
      setError('Function name is required');
      return;
    }
    
    if (!newFunction.submodule_id) {
      setError('Submodule is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await functions.create({
        name: newFunction.name,
        description: newFunction.description,
        submodule_id: parseInt(newFunction.submodule_id)
      });
      
      setSuccess('Function created successfully');
      handleCloseDialogs();
      await fetchAllData();
    } catch (err: any) {
      console.error('Error creating function:', err);
      setError(err.response?.data?.message || 'Failed to create function');
    } finally {
      setLoading(false);
    }
  };

  // Create a new department
  const handleCreateDepartment = async () => {
    if (!newDepartment.name.trim()) {
      setError('Department name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await bcrtm.createDepartment({
        name: newDepartment.name,
        description: newDepartment.description
      });
      
      setSuccess('Department created successfully');
      handleCloseDialogs();
      await fetchAllData();
    } catch (err: any) {
      console.error('Error creating department:', err);
      setError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  // Create a new functional area
  const handleCreateArea = async () => {
    if (!newArea.name.trim()) {
      setError('Functional area name is required');
      return;
    }
    
    if (!newArea.department_id) {
      setError('Department is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await bcrtm.createArea({
        name: newArea.name,
        description: newArea.description,
        department_id: parseInt(newArea.department_id)
      });
      
      setSuccess('Functional area created successfully');
      handleCloseDialogs();
      await fetchAllData();
    } catch (err: any) {
      console.error('Error creating functional area:', err);
      setError(err.response?.data?.message || 'Failed to create functional area');
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteModule = async (moduleId: number) => {
    if (!window.confirm('Are you sure you want to delete this module? This will delete all associated submodules and functions.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await modules.delete(moduleId);
      setSuccess('Module deleted successfully');
      
      if (selectedModule?.module_id === moduleId) {
        setSelectedModule(null);
        setSelectedSubmodule(null);
      }
      
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting module:', err);
      setError(err.response?.data?.message || 'Failed to delete module');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmodule = async (submoduleId: number) => {
    if (!window.confirm('Are you sure you want to delete this submodule? This will delete all associated functions.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await subModules.delete(submoduleId);
      setSuccess('Submodule deleted successfully');
      
      if (selectedSubmodule?.submodule_id === submoduleId) {
        setSelectedSubmodule(null);
      }
      
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting submodule:', err);
      setError(err.response?.data?.message || 'Failed to delete submodule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFunction = async (functionId: number) => {
    if (!window.confirm('Are you sure you want to delete this function?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await functions.delete(functionId);
      setSuccess('Function deleted successfully');
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting function:', err);
      setError(err.response?.data?.message || 'Failed to delete function');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this department? This will delete all associated functional areas.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await bcrtm.deleteDepartment(departmentId);
      setSuccess('Department deleted successfully');
      
      if (selectedDepartment?.id === departmentId) {
        setSelectedDepartment(null);
      }
      
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArea = async (areaId: number) => {
    if (!window.confirm('Are you sure you want to delete this functional area?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await bcrtm.deleteArea(areaId);
      setSuccess('Functional area deleted successfully');
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting functional area:', err);
      setError(err.response?.data?.message || 'Failed to delete functional area');
    } finally {
      setLoading(false);
    }
  };

  // Filter functions by selected submodule
  const filteredFunctions = selectedSubmodule
    ? functionsList.filter((f) => f.submodule_id === selectedSubmodule.submodule_id)
    : [];

  // Filter submodules by selected module
  const filteredSubmodules = selectedModule
    ? submodulesList.filter((s) => s.module_id === selectedModule.module_id)
    : [];

  // Filter areas by selected department
  const filteredAreas = selectedDepartment
    ? areasList.filter((a) => a.department_id === selectedDepartment.id)
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">Master Data Relationship Manager</Typography>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Modules & Functions" icon={<FunctionsIcon />} iconPosition="start" />
          <Tab label="Departments & Areas" icon={<BusinessIcon />} iconPosition="start" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <TabPanel value={tabValue} index={0}>
          <Breadcrumbs aria-label="modules breadcrumb" sx={{ mb: 3 }}>
            <Link
              underline={selectedModule ? "hover" : "none"}
              color={selectedModule ? "inherit" : "text.primary"}
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                if (selectedModule) {
                  setSelectedModule(null);
                  setSelectedSubmodule(null);
                }
              }}
            >
              Modules
            </Link>
            {selectedModule && (
              <Link
                underline={selectedSubmodule ? "hover" : "none"}
                color={selectedSubmodule ? "inherit" : "text.primary"}
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (selectedSubmodule) {
                    setSelectedSubmodule(null);
                  }
                }}
              >
                Submodules: {selectedModule.name}
              </Link>
            )}
            {selectedSubmodule && (
              <Typography color="text.primary">
                Functions: {selectedSubmodule.name}
              </Typography>
            )}
          </Breadcrumbs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Show modules list */}
              {!selectedModule && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Modules</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={handleOpenModuleDialog}
                    >
                      Add Module
                    </Button>
                  </Box>
                  <List>
                    {modulesList.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No modules found. Add your first module." />
                      </ListItem>
                    ) : (
                      modulesList.map((module) => (
                        <ListItem 
                          key={module.module_id}
                          divider
                        >
                          <ListItemButton onClick={() => handleModuleSelect(module)}>
                            <ListItemText 
                              primary={module.name} 
                              secondary={module.description || 'No description'}
                            />
                          </ListItemButton>
                          <ListItemSecondaryAction>
                            <Tooltip title="View submodules">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleModuleSelect(module)}
                              >
                                <ArrowForwardIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                edge="end" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModule(module.module_id);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>
              )}
              
              {/* Show submodules for selected module */}
              {selectedModule && !selectedSubmodule && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Submodules for {selectedModule.name}</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={handleOpenSubmoduleDialog}
                    >
                      Add Submodule
                    </Button>
                  </Box>
                  <List>
                    {filteredSubmodules.length === 0 ? (
                      <ListItem>
                        <ListItemText primary={`No submodules found for ${selectedModule.name}. Add your first submodule.`} />
                      </ListItem>
                    ) : (
                      filteredSubmodules.map((submodule) => (
                        <ListItem 
                          key={submodule.submodule_id}
                          divider
                        >
                          <ListItemButton onClick={() => handleSubmoduleSelect(submodule)}>
                            <ListItemText 
                              primary={submodule.name} 
                              secondary={submodule.description || 'No description'}
                            />
                          </ListItemButton>
                          <ListItemSecondaryAction>
                            <Tooltip title="View functions">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleSubmoduleSelect(submodule)}
                              >
                                <ArrowForwardIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                edge="end" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubmodule(submodule.submodule_id);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>
              )}
              
              {/* Show functions for selected submodule */}
              {selectedModule && selectedSubmodule && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Functions for {selectedSubmodule.name}</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={handleOpenFunctionDialog}
                    >
                      Add Function
                    </Button>
                  </Box>
                  <List>
                    {filteredFunctions.length === 0 ? (
                      <ListItem>
                        <ListItemText primary={`No functions found for ${selectedSubmodule.name}. Add your first function.`} />
                      </ListItem>
                    ) : (
                      filteredFunctions.map((func) => (
                        <ListItem 
                          key={func.function_id}
                          divider
                        >
                          <ListItemText 
                            primary={func.name} 
                            secondary={func.description || 'No description'}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Delete">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleDeleteFunction(func.function_id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Breadcrumbs aria-label="departments breadcrumb" sx={{ mb: 3 }}>
            <Link
              underline={selectedDepartment ? "hover" : "none"}
              color={selectedDepartment ? "inherit" : "text.primary"}
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                if (selectedDepartment) {
                  setSelectedDepartment(null);
                }
              }}
            >
              Departments
            </Link>
            {selectedDepartment && (
              <Typography color="text.primary">
                Functional Areas: {selectedDepartment.name}
              </Typography>
            )}
          </Breadcrumbs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Show departments list */}
              {!selectedDepartment && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">BC Functional Departments</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={handleOpenDepartmentDialog}
                    >
                      Add Department
                    </Button>
                  </Box>
                  <List>
                    {departmentsList.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No departments found. Add your first department." />
                      </ListItem>
                    ) : (
                      departmentsList.map((department) => (
                        <ListItem 
                          key={department.id}
                          divider
                        >
                          <ListItemButton onClick={() => handleDepartmentSelect(department)}>
                            <ListItemText 
                              primary={department.name} 
                              secondary={department.description || 'No description'}
                            />
                          </ListItemButton>
                          <ListItemSecondaryAction>
                            <Tooltip title="View functional areas">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleDepartmentSelect(department)}
                              >
                                <ArrowForwardIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                edge="end" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDepartment(department.id);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>
              )}
              
              {/* Show functional areas for selected department */}
              {selectedDepartment && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Functional Areas for {selectedDepartment.name}</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={handleOpenAreaDialog}
                    >
                      Add Functional Area
                    </Button>
                  </Box>
                  <List>
                    {filteredAreas.length === 0 ? (
                      <ListItem>
                        <ListItemText primary={`No functional areas found for ${selectedDepartment.name}. Add your first functional area.`} />
                      </ListItem>
                    ) : (
                      filteredAreas.map((area) => (
                        <ListItem 
                          key={area.id}
                          divider
                        >
                          <ListItemText 
                            primary={area.name} 
                            secondary={area.description || 'No description'}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Delete">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleDeleteArea(area.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
      </Paper>
      
      {/* Add Module Dialog */}
      <Dialog open={openModuleDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
        <DialogTitle>Add New Module</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Module Name"
            fullWidth
            variant="outlined"
            value={newModule.name}
            onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newModule.description}
            onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleCreateModule} 
            variant="contained" 
            disabled={loading || !newModule.name.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Submodule Dialog */}
      <Dialog open={openSubmoduleDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
        <DialogTitle>Add New Submodule</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Module</InputLabel>
            <Select
              value={newSubmodule.module_id}
              onChange={(e) => setNewSubmodule({ ...newSubmodule, module_id: e.target.value })}
              label="Module"
              required
            >
              {modulesList.map((module) => (
                <MenuItem key={module.module_id} value={module.module_id}>
                  {module.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Submodule Name"
            fullWidth
            variant="outlined"
            value={newSubmodule.name}
            onChange={(e) => setNewSubmodule({ ...newSubmodule, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newSubmodule.description}
            onChange={(e) => setNewSubmodule({ ...newSubmodule, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleCreateSubmodule} 
            variant="contained" 
            disabled={loading || !newSubmodule.name.trim() || !newSubmodule.module_id}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Function Dialog */}
      <Dialog open={openFunctionDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
        <DialogTitle>Add New Function</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Submodule</InputLabel>
            <Select
              value={newFunction.submodule_id}
              onChange={(e) => setNewFunction({ ...newFunction, submodule_id: e.target.value })}
              label="Submodule"
              required
            >
              {submodulesList.map((submodule) => (
                <MenuItem key={submodule.submodule_id} value={submodule.submodule_id}>
                  {submodule.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Function Name"
            fullWidth
            variant="outlined"
            value={newFunction.name}
            onChange={(e) => setNewFunction({ ...newFunction, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newFunction.description}
            onChange={(e) => setNewFunction({ ...newFunction, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleCreateFunction} 
            variant="contained" 
            disabled={loading || !newFunction.name.trim() || !newFunction.submodule_id}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={openDepartmentDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            variant="outlined"
            value={newDepartment.name}
            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newDepartment.description}
            onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleCreateDepartment} 
            variant="contained" 
            disabled={loading || !newDepartment.name.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Functional Area Dialog */}
      <Dialog open={openAreaDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
        <DialogTitle>Add New Functional Area</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={newArea.department_id}
              onChange={(e) => setNewArea({ ...newArea, department_id: e.target.value })}
              label="Department"
              required
            >
              {departmentsList.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Functional Area Name"
            fullWidth
            variant="outlined"
            value={newArea.name}
            onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newArea.description}
            onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleCreateArea} 
            variant="contained" 
            disabled={loading || !newArea.name.trim() || !newArea.department_id}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RelationshipManager;