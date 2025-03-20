import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  createRequirement,
  getRequirementById,
  updateRequirement,
} from '../../services/requirementService';
import { 
  RequirementForm as RequirementFormType,
  Module, 
  SubModule, 
  Function, 
  Priority, 
  Status, 
  FitGapStatus,
  SolutionOption,
} from '../../types';
import { 
  modules,
  subModules,
  functions,
  priorities,
  statuses,
  fitGapStatuses,
  solutionOptions,
} from '../../services/masterDataService';
import { StatusChip } from '../shared/StatusChip';

// Validation schema
const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  function_id: Yup.number().required('Function is required'),
  priority_id: Yup.number().required('Priority is required'),
  status_id: Yup.number().required('Status is required'),
  fitgap_id: Yup.number().required('Fit/Gap status is required'),
  solution_option_id: Yup.number().nullable(),
  phase: Yup.string().required('Phase is required'),
});

const RequirementForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Master data states
  const [moduleList, setModuleList] = useState<Module[]>([]);
  const [subModuleList, setSubModuleList] = useState<SubModule[]>([]);
  const [functionList, setFunctionList] = useState<Function[]>([]);
  const [priorityList, setPriorityList] = useState<Priority[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [fitGapList, setFitGapList] = useState<FitGapStatus[]>([]);
  const [solutionOptionList, setSolutionOptionList] = useState<SolutionOption[]>([]);
  
  // Selected values for the cascading dropdowns
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedSubModule, setSelectedSubModule] = useState<number | null>(null);
  
  // Initialize form with empty values
  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      details: '',
      function_id: 0,
      priority_id: 0,
      status_id: 0,
      fitgap_id: 0,
      solution_option_id: null as number | null,
      phase: 'Initial',
      in_scope: true,
      comments: '',
      // Additional fields not in the RequirementForm type
      solution_description: '',
      additional_notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Convert form values to RequirementForm type
        const requirementData: RequirementFormType = {
          title: values.title,
          description: values.description || '',
          details: values.details || '',
          function_id: values.function_id,
          priority_id: values.priority_id,
          status_id: values.status_id,
          fitgap_id: values.fitgap_id,
          phase: values.phase,
          in_scope: values.in_scope,
          option_id: values.solution_option_id,
          comments: values.comments || values.solution_description || ''
        };
        
        if (isEditMode && id) {
          const { requirement } = await updateRequirement(parseInt(id), requirementData);
          if (requirement) {
            setSuccess('Requirement updated successfully');
            // Navigate after a short delay
            setTimeout(() => {
              navigate('/requirements');
            }, 1500);
          } else {
            throw new Error('Failed to update requirement - no response data');
          }
        } else {
          await createRequirement(requirementData);
          setSuccess('Requirement created successfully');
          
          // Navigate after a short delay
          setTimeout(() => {
            navigate('/requirements');
          }, 1500);
        }
      } catch (err: any) {
        console.error('Error saving requirement:', err);
        setError(err.response?.data?.message || err.message || 'Failed to save requirement');
      } finally {
        setLoading(false);
      }
    },
  });
  
  // Fetch all necessary master data
  const fetchMasterData = async () => {
    try {
      const [
        modulesResponse,
        subModulesResponse,
        functionsResponse,
        prioritiesResponse,
        statusesResponse,
        fitGapResponse,
        solutionOptionsResponse,
      ] = await Promise.all([
        modules.getAll(),
        subModules.getAll(),
        functions.getAll(),
        priorities.getAll(),
        statuses.getAll(),
        fitGapStatuses.getAll(),
        solutionOptions.getAll(),
      ]);
      
      setModuleList(modulesResponse);
      setSubModuleList(subModulesResponse);
      setFunctionList(functionsResponse);
      setPriorityList(prioritiesResponse);
      setStatusList(statusesResponse);
      setFitGapList(fitGapResponse);
      setSolutionOptionList(solutionOptionsResponse);
    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setError('Failed to load form data. Please try again.');
    }
  };
  
  // Move fetchRequirement inside useCallback
  const fetchRequirement = useCallback(async () => {
    try {
      setLoading(true);
      if (!id) throw new Error('Requirement ID is missing');
      const response = await getRequirementById(parseInt(id));
      const requirement = response.requirement;
      
      // Set the form values from the requirement
      formik.setValues({
        title: requirement.title || '',
        description: requirement.description || '',
        details: requirement.details || '',
        function_id: requirement.function_id || 0,
        priority_id: requirement.priority_id || 0,
        status_id: requirement.status_id || 0,
        fitgap_id: requirement.fitgap_id || 0,
        solution_option_id: requirement.option_id || null,
        solution_description: requirement.comments || '',
        phase: requirement.phase || 'Initial',
        in_scope: requirement.in_scope !== undefined ? requirement.in_scope : true,
        comments: requirement.comments || '',
        additional_notes: '',
      });
      
      // Set the selected module and submodule if function is available
      if (requirement.function_id) {
        const func = functionList.find(f => f.function_id === requirement.function_id);
        if (func && func.submodule_id) {
          setSelectedSubModule(func.submodule_id);
          
          const submod = subModuleList.find(sm => sm.submodule_id === func.submodule_id);
          if (submod && submod.module_id) {
            setSelectedModule(submod.module_id);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching requirement:', err);
      setError('Failed to load requirement data');
    } finally {
      setLoading(false);
    }
  }, [id]); // Add any dependencies fetchRequirement uses
  
  // Initial data load
  useEffect(() => {
    fetchMasterData();
  }, []);
  
  // Load requirement data once master data is loaded and we're in edit mode
  useEffect(() => {
    if (isEditMode && id && moduleList.length > 0 && subModuleList.length > 0 && functionList.length > 0) {
      fetchRequirement();
    }
  }, [isEditMode, id, moduleList, subModuleList, functionList, fetchRequirement]);
  
  // When a function is selected, update the module/submodule selections
  useEffect(() => {
    if (formik.values.function_id) {
      const selectedFunc = functionList.find(f => f.function_id === formik.values.function_id);
      if (selectedFunc && selectedFunc.submodule_id) {
        setSelectedSubModule(selectedFunc.submodule_id);
        
        const selectedSubMod = subModuleList.find(sm => sm.submodule_id === selectedFunc.submodule_id);
        if (selectedSubMod && selectedSubMod.module_id) {
          setSelectedModule(selectedSubMod.module_id);
        }
      }
    }
  }, [formik.values.function_id, functionList, subModuleList]);
  
  // Filter submodules based on selected module
  const filteredSubModules = selectedModule 
    ? subModuleList.filter(sm => sm.module_id === selectedModule)
    : subModuleList;
  
  // Filter functions based on selected submodule
  const filteredFunctions = selectedSubModule
    ? functionList.filter(f => f.submodule_id === selectedSubModule)
    : functionList;
  
  // Handle module selection change
  const handleModuleChange = (moduleId: number) => {
    setSelectedModule(moduleId);
    setSelectedSubModule(null);
    formik.setFieldValue('function_id', 0);
  };
  
  // Handle submodule selection change
  const handleSubModuleChange = (submoduleId: number) => {
    setSelectedSubModule(submoduleId);
    formik.setFieldValue('function_id', 0);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccess(null);
    setError(null);
  };
  
  if (loading && !formik.isSubmitting) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {isEditMode ? 'Edit Requirement' : 'Create Requirement'}
            </Typography>
            {isEditMode && (
              <Typography variant="subtitle1" color="text.secondary">
                ID: {id}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/requirements')}
          >
            Back to Requirements
          </Button>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Basic Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="title"
                      name="title"
                      label="Title"
                      required
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.title && Boolean(formik.errors.title)}
                      helperText={formik.touched.title && formik.errors.title}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="description"
                      name="description"
                      label="Description"
                      required
                      multiline
                      rows={4}
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Classification */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Classification
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControl 
                      fullWidth
                      error={Boolean(formik.touched.function_id && formik.errors.function_id)}
                    >
                      <InputLabel>Module *</InputLabel>
                      <Select
                        value={selectedModule || ''}
                        label="Module *"
                        onChange={(e) => handleModuleChange(e.target.value as number)}
                      >
                        <MenuItem value="">Select Module</MenuItem>
                        {moduleList.map((module) => (
                          <MenuItem key={module.module_id} value={module.module_id}>
                            {module.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.function_id && formik.errors.function_id && (
                        <FormHelperText>{formik.errors.function_id as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl 
                      fullWidth 
                      disabled={!selectedModule}
                      error={Boolean(formik.touched.function_id && formik.errors.function_id)}
                    >
                      <InputLabel>SubModule *</InputLabel>
                      <Select
                        value={selectedSubModule || ''}
                        label="SubModule *"
                        onChange={(e) => handleSubModuleChange(e.target.value as number)}
                      >
                        <MenuItem value="">Select SubModule</MenuItem>
                        {filteredSubModules.map((subModule) => (
                          <MenuItem key={subModule.submodule_id} value={subModule.submodule_id}>
                            {subModule.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl 
                      fullWidth 
                      disabled={!selectedSubModule}
                      error={Boolean(formik.touched.function_id && formik.errors.function_id)}
                    >
                      <InputLabel>Function *</InputLabel>
                      <Select
                        id="function_id"
                        name="function_id"
                        value={formik.values.function_id || ''}
                        label="Function *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <MenuItem value="">Select Function</MenuItem>
                        {filteredFunctions.map((func) => (
                          <MenuItem key={func.function_id} value={func.function_id}>
                            {func.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Priority & Status */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Priority & Status
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControl 
                      fullWidth 
                      error={Boolean(formik.touched.priority_id && formik.errors.priority_id)}
                    >
                      <InputLabel>Priority *</InputLabel>
                      <Select
                        id="priority_id"
                        name="priority_id"
                        value={formik.values.priority_id || ''}
                        label="Priority *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <MenuItem value="">Select Priority</MenuItem>
                        {priorityList.map((priority) => (
                          <MenuItem key={priority.priority_id} value={priority.priority_id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StatusChip label={priority.name} type="priority" size="small" />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.priority_id && formik.errors.priority_id && (
                        <FormHelperText>{formik.errors.priority_id as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl 
                      fullWidth 
                      error={Boolean(formik.touched.status_id && formik.errors.status_id)}
                    >
                      <InputLabel>Status *</InputLabel>
                      <Select
                        id="status_id"
                        name="status_id"
                        value={formik.values.status_id || ''}
                        label="Status *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <MenuItem value="">Select Status</MenuItem>
                        {statusList.map((status) => (
                          <MenuItem key={status.status_id} value={status.status_id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StatusChip label={status.name} type="status" size="small" />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.status_id && formik.errors.status_id && (
                        <FormHelperText>{formik.errors.status_id as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Phase *</InputLabel>
                      <Select
                        id="phase"
                        name="phase"
                        value={formik.values.phase || ''}
                        label="Phase *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={Boolean(formik.touched.phase && formik.errors.phase)}
                      >
                        <MenuItem value="">Select Phase</MenuItem>
                        <MenuItem value="Initial">Initial</MenuItem>
                        <MenuItem value="Future">Future</MenuItem>
                      </Select>
                      {formik.touched.phase && formik.errors.phase && (
                        <FormHelperText>{formik.errors.phase as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          id="in_scope"
                          name="in_scope"
                          checked={formik.values.in_scope}
                          onChange={formik.handleChange}
                        />
                      }
                      label="In Scope"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Solution */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Solution
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      error={Boolean(formik.touched.fitgap_id && formik.errors.fitgap_id)}
                    >
                      <InputLabel>Fit/Gap *</InputLabel>
                      <Select
                        id="fitgap_id"
                        name="fitgap_id"
                        value={formik.values.fitgap_id || ''}
                        label="Fit/Gap *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <MenuItem value="">Select Fit/Gap</MenuItem>
                        {fitGapList.map((fitGap) => (
                          <MenuItem key={fitGap.fitgap_id} value={fitGap.fitgap_id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StatusChip label={fitGap.name} type="fitgap" size="small" />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.fitgap_id && formik.errors.fitgap_id && (
                        <FormHelperText>{formik.errors.fitgap_id as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Solution Option</InputLabel>
                      <Select
                        id="option_id"
                        name="option_id"
                        value={formik.values.solution_option_id || ''}
                        label="Solution Option"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <MenuItem value="">None</MenuItem>
                        {solutionOptionList.map((option) => (
                          <MenuItem key={option.option_id} value={option.option_id}>
                            {option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="comments"
                      name="comments"
                      label="Solution Description"
                      multiline
                      rows={4}
                      value={formik.values.comments}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Additional Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="details"
                      name="details"
                      label="Additional Details"
                      multiline
                      rows={4}
                      value={formik.values.details}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/requirements')}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={formik.isSubmitting}
                startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isEditMode ? 'Update Requirement' : 'Create Requirement'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Success/Error Notifications */}
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
      >
        <Alert severity="success" onClose={handleSnackbarClose}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
      >
        <Alert severity="error" onClose={handleSnackbarClose}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RequirementForm;