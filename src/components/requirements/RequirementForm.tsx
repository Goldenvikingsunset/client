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
  BCFunctionalDepartment,
  FunctionalArea,
} from '../../types';
import { 
  modules,
  subModules,
  functions,
  priorities,
  statuses,
  fitGapStatuses,
  solutionOptions,
  bcrtm,
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
  phase: Yup.string().required('Phase is required'),
  // New BC RTM validations
  business_central_functional_department: Yup.number().required('BC Department is required'),
  functional_area: Yup.number()
    .required('Functional Area is required')
    .when('business_central_functional_department', {
      is: (val: number) => val && val > 0,
      then: (schema) => schema.required('Functional Area is required for selected department')
    }),
  functional_consultant: Yup.string().required('Functional Consultant is required'),
  requirement_owner_client: Yup.string().required('Client Owner is required'),
  solution_option_1: Yup.string().nullable(),
  solution_option_1_time_estimate: Yup.number().positive('Must be a positive number').nullable(),
  solution_option_2: Yup.string().nullable(),
  solution_option_2_time_estimate: Yup.number().positive('Must be a positive number').nullable(),
  solution_option_3: Yup.string().nullable(),
  solution_option_3_time_estimate: Yup.number().positive('Must be a positive number').nullable(),
  workshop_name: Yup.string().nullable(),
  phase_comments: Yup.string().nullable(),
  status_client: Yup.string().nullable(),
  client_comments: Yup.string().nullable(),
  client_preferences: Yup.string().nullable(),
});

const RequirementForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Master data states with default empty arrays
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

  // Add new state for BC RTM data with default empty arrays
  const [departments, setDepartments] = useState<BCFunctionalDepartment[]>([]);
  const [functionalAreas, setFunctionalAreas] = useState<FunctionalArea[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedBCDepartment, setSelectedBCDepartment] = useState<number | null>(null);
  
  // Initialize form with updated values
  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      details: '',
      function_id: 0,
      priority_id: 0,
      status_id: 0,
      fitgap_id: 0,
      phase: 'Initial',
      in_scope: true,
      comments: '',
      // Fix: Add option_id to initial values
      option_id: null as number | null,
      // BC RTM fields
      business_central_functional_department: null as number | null,
      functional_area: null as number | null,
      // Add these fields to ensure compatibility with both field naming conventions
      bc_department_id: null as number | null,
      functional_area_id: null as number | null,
      template_item: false,
      functional_consultant: '',
      requirement_owner_client: '',
      solution_option_1: '',
      solution_option_1_time_estimate: null as number | null,
      solution_option_2: '',
      solution_option_2_time_estimate: null as number | null,
      solution_option_3: '',
      solution_option_3_time_estimate: null as number | null,
      workshop_name: '',
      phase_comments: '',
      status_client: '',
      client_comments: '',
      client_preferences: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Convert form values to RequirementForm type
        const requirementData: RequirementFormType = {
          ...values,
          module: selectedModule || 0,
          submodule: selectedSubModule || 0,
          function: (functionList.find(f => f.function_id === values.function_id)?.name || ''),
          priority: (priorityList.find(p => p.priority_id === values.priority_id)?.name || ''),
          status: (statusList.find(s => s.status_id === values.status_id)?.name || ''),
          fitgap: (fitGapList.find(fg => fg.fitgap_id === values.fitgap_id)?.name || ''),
          option_id: values.option_id || null,
          business_central_functional_department: values.business_central_functional_department || null,
          functional_area: values.functional_area || null,
          bc_department_id: values.business_central_functional_department || null,
          functional_area_id: values.functional_area || null,
          solution_option_1_time_estimate: values.solution_option_1_time_estimate || null,
          solution_option_2_time_estimate: values.solution_option_2_time_estimate || null,
          solution_option_3_time_estimate: values.solution_option_3_time_estimate || null,
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
      // Initialize with empty arrays before fetching
      setModuleList([]);
      setSubModuleList([]);
      setFunctionList([]);
      setPriorityList([]);
      setStatusList([]);
      setFitGapList([]);
      setSolutionOptionList([]);
      
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
      
      setModuleList(modulesResponse || []);
      setSubModuleList(subModulesResponse || []);
      setFunctionList(functionsResponse || []);
      setPriorityList(prioritiesResponse || []);
      setStatusList(statusesResponse || []);
      setFitGapList(fitGapResponse || []);
      setSolutionOptionList(solutionOptionsResponse || []);
    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setError('Failed to load form data. Please try again.');
      // Initialize with empty arrays on error
      setModuleList([]);
      setSubModuleList([]);
      setFunctionList([]);
      setPriorityList([]);
      setStatusList([]);
      setFitGapList([]);
      setSolutionOptionList([]);
    }
  };

  // Add fetch for BC RTM data
  const fetchBCRTMData = async () => {
    try {
      // Initialize with empty arrays before fetching
      setDepartments([]);
      setFunctionalAreas([]);
      
      const [deptResponse, areasResponse] = await Promise.all([
        bcrtm.getDepartments(),
        bcrtm.getFunctionalAreas(),
      ]);
      
      setDepartments(deptResponse?.departments || []);
      setFunctionalAreas(areasResponse?.areas || []);
    } catch (err: any) {
      console.error('Error fetching BC RTM data:', err);
      setError('Failed to load BC RTM data');
      // Initialize with empty arrays on error
      setDepartments([]);
      setFunctionalAreas([]);
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
        option_id: requirement.option_id || null,
        phase: requirement.phase || 'Initial',
        in_scope: requirement.in_scope !== undefined ? requirement.in_scope : true,
        comments: requirement.comments || '',
        // Use both field naming conventions to ensure compatibility
        business_central_functional_department: requirement.business_central_functional_department || requirement.bc_department_id || null,
        functional_area: requirement.functional_area || requirement.functional_area_id || null,
        bc_department_id: requirement.business_central_functional_department || requirement.bc_department_id || null,
        functional_area_id: requirement.functional_area || requirement.functional_area_id || null,
        template_item: requirement.template_item || false,
        functional_consultant: requirement.functional_consultant || '',
        requirement_owner_client: requirement.requirement_owner_client || '',
        solution_option_1: requirement.solution_option_1 || '',
        solution_option_1_time_estimate: requirement.solution_option_1_time_estimate || null,
        solution_option_2: requirement.solution_option_2 || '',
        solution_option_2_time_estimate: requirement.solution_option_2_time_estimate || null,
        solution_option_3: requirement.solution_option_3 || '',
        solution_option_3_time_estimate: requirement.solution_option_3_time_estimate || null,
        workshop_name: requirement.workshop_name || '',
        phase_comments: requirement.phase_comments || '',
        status_client: requirement.status_client || '',
        client_comments: requirement.client_comments || '',
        client_preferences: requirement.client_preferences || '',
      }, false); // Add false to prevent validation on initial set
      
      // Set the selected module and submodule if function is available
      if (requirement.function_id) {
        const func = functionList.find(f => f.function_id === requirement.function_id);
        if (func && func.submodule_id) {
          const submod = subModuleList.find(sm => sm.submodule_id === func.submodule_id);
          if (submod && submod.module_id) {
            setSelectedModule(submod.module_id);
            setSelectedSubModule(func.submodule_id);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching requirement:', err);
      setError('Failed to load requirement data');
    } finally {
      setLoading(false);
    }
  }, [id, formik.setValues]); // Only depend on id and formik.setValues
  
  // Initial data load
  useEffect(() => {
    Promise.all([fetchMasterData(), fetchBCRTMData()]);
  }, []);
  
  // Load requirement data once master data is loaded and we're in edit mode
  useEffect(() => {
    if (isEditMode && id && moduleList.length > 0 && subModuleList.length > 0 && functionList.length > 0) {
      fetchRequirement();
    }
  }, [isEditMode, id, moduleList.length, subModuleList.length, functionList.length, fetchRequirement]);
  
  // When a function is selected, update the module/submodule selections
  useEffect(() => {
    if (!loading && formik.values.function_id) {
      const selectedFunc = functionList.find(f => f.function_id === formik.values.function_id);
      if (selectedFunc && selectedFunc.submodule_id) {
        const selectedSubMod = subModuleList.find(sm => sm.submodule_id === selectedFunc.submodule_id);
        if (selectedSubMod && selectedSubMod.module_id) {
          setSelectedModule(selectedSubMod.module_id);
          setSelectedSubModule(selectedFunc.submodule_id);
        }
      }
    }
  }, [formik.values.function_id]);
  
  // Filter submodules based on selected module with null check
  const filteredSubModules = selectedModule && subModuleList
    ? subModuleList.filter(sm => sm.module_id === selectedModule)
    : subModuleList || [];
  
  // Filter functions based on selected submodule with null check
  const filteredFunctions = selectedSubModule && functionList
    ? functionList.filter(f => f.submodule_id === selectedSubModule)
    : functionList || [];
  
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

  // Add handler for department change
  const handleDepartmentChange = async (departmentId: number) => {
    setSelectedDepartment(departmentId);
    formik.setFieldValue('business_central_functional_department', departmentId);
    formik.setFieldValue('bc_department_id', departmentId); // Set both field names
    formik.setFieldValue('functional_area', null);
    formik.setFieldValue('functional_area_id', null); // Set both field names
    
    try {
      const response = await bcrtm.getFunctionalAreas({ department_id: departmentId });
      setFunctionalAreas(response?.areas || []);
    } catch (err) {
      console.error('Error fetching functional areas:', err);
      setFunctionalAreas([]);
    }
  };

  // Update handler for functional area change
  const handleFunctionalAreaChange = (areaId: number) => {
    formik.setFieldValue('functional_area', areaId);
    formik.setFieldValue('functional_area_id', areaId); // Set both field names
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccess(null);
    setError(null);
  };
  
  // Make sure all arrays are initialized to empty arrays if undefined
  const safeModuleList = moduleList || [];
  const safeSubModuleList = subModuleList || [];
  const safeFunctionList = functionList || []; 
  const safePriorityList = priorityList || [];
  const safeStatusList = statusList || [];
  const safeFitGapList = fitGapList || [];
  const safeSolutionOptionList = solutionOptionList || [];
  const safeDepartments = departments || [];
  const safeFunctionalAreas = functionalAreas || [];
  
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
                      inputProps={{
                        'aria-label': 'Requirement title',
                        'aria-required': 'true'
                      }}
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
                      inputProps={{
                        'aria-label': 'Requirement description',
                        'aria-required': 'true'
                      }}
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
                  {/* Module dropdown */}
                  <Grid item xs={12} md={4}>
                    <FormControl 
                      fullWidth
                      error={Boolean(formik.touched.function_id && formik.errors.function_id)}
                    >
                      <InputLabel id="module-label">Module *</InputLabel>
                      <Select
                        labelId="module-label"
                        id="module"
                        value={selectedModule || ''}
                        label="Module *"
                        onChange={(e) => handleModuleChange(e.target.value as number)}
                        inputProps={{
                          'aria-label': 'Select module'
                        }}
                      >
                        <MenuItem value="">Select Module</MenuItem>
                        {safeModuleList.map((module) => (
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
                      <InputLabel id="submodule-label">SubModule *</InputLabel>
                      <Select
                        labelId="submodule-label"
                        id="submodule"
                        value={selectedSubModule || ''}
                        label="SubModule *"
                        onChange={(e) => handleSubModuleChange(e.target.value as number)}
                        inputProps={{
                          'aria-label': 'Select submodule'
                        }}
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
                      <InputLabel id="function-label">Function *</InputLabel>
                      <Select
                        labelId="function-label"
                        id="function_id"
                        name="function_id"
                        value={formik.values.function_id || ''}
                        label="Function *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select function'
                        }}
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
                      <InputLabel id="priority-label">Priority *</InputLabel>
                      <Select
                        labelId="priority-label"
                        id="priority_id"
                        name="priority_id"
                        value={formik.values.priority_id || ''}
                        label="Priority *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select priority'
                        }}
                      >
                        <MenuItem value="">Select Priority</MenuItem>
                        {safePriorityList.map((priority) => (
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
                      <InputLabel id="status-label">Status *</InputLabel>
                      <Select
                        labelId="status-label"
                        id="status_id"
                        name="status_id"
                        value={formik.values.status_id || ''}
                        label="Status *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select status'
                        }}
                      >
                        <MenuItem value="">Select Status</MenuItem>
                        {safeStatusList.map((status) => (
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
                      <InputLabel id="phase-label">Phase *</InputLabel>
                      <Select
                        labelId="phase-label"
                        id="phase"
                        name="phase"
                        value={formik.values.phase || ''}
                        label="Phase *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={Boolean(formik.touched.phase && formik.errors.phase)}
                        inputProps={{
                          'aria-label': 'Select phase'
                        }}
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
                          inputProps={{
                            'aria-label': 'In scope toggle'
                          }}
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
                      <InputLabel id="fitgap-label">Fit/Gap *</InputLabel>
                      <Select
                        labelId="fitgap-label"
                        id="fitgap_id"
                        name="fitgap_id"
                        value={formik.values.fitgap_id || ''}
                        label="Fit/Gap *"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select fit/gap'
                        }}
                      >
                        <MenuItem value="">Select Fit/Gap</MenuItem>
                        {safeFitGapList.map((fitGap) => (
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
                      <InputLabel id="solution-option-label">Solution Option</InputLabel>
                      <Select
                        labelId="solution-option-label"
                        id="option_id"
                        name="option_id"
                        value={formik.values.option_id || ''}
                        label="Solution Option"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select solution option'
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {safeSolutionOptionList.map((option) => (
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
                      inputProps={{
                        'aria-label': 'Solution description'
                      }}
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
                      inputProps={{
                        'aria-label': 'Additional details'
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Business Central Classification */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Business Central Classification
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      error={Boolean(formik.touched.business_central_functional_department && formik.errors.business_central_functional_department)}
                    >
                      <InputLabel id="bc-department-label">Functional Department *</InputLabel>
                      <Select
                        labelId="bc-department-label"
                        id="business_central_functional_department"
                        name="business_central_functional_department"
                        value={formik.values.business_central_functional_department || ''}
                        label="Functional Department *"
                        onChange={(e) => handleDepartmentChange(e.target.value as number)}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select functional department'
                        }}
                      >
                        <MenuItem value="">Select Department</MenuItem>
                        {safeDepartments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.business_central_functional_department && formik.errors.business_central_functional_department && (
                        <FormHelperText>{formik.errors.business_central_functional_department as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      disabled={!formik.values.business_central_functional_department}
                      error={Boolean(formik.touched.functional_area && formik.errors.functional_area)}
                    >
                      <InputLabel id="functional-area-label">Functional Area *</InputLabel>
                      <Select
                        labelId="functional-area-label"
                        id="functional_area"
                        name="functional_area"
                        value={formik.values.functional_area || ''}
                        label="Functional Area *"
                        onChange={(e) => handleFunctionalAreaChange(e.target.value as number)}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select functional area'
                        }}
                      >
                        <MenuItem value="">Select Area</MenuItem>
                        {safeFunctionalAreas.map((area) => (
                          <MenuItem key={area.id} value={area.id}>
                            {area.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.functional_area && formik.errors.functional_area && (
                        <FormHelperText>{formik.errors.functional_area as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="workshop_name"
                      name="workshop_name"
                      label="Workshop"
                      value={formik.values.workshop_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      inputProps={{
                        'aria-label': 'Workshop name'
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          id="template_item"
                          name="template_item"
                          checked={formik.values.template_item}
                          onChange={formik.handleChange}
                          inputProps={{
                            'aria-label': 'Template item toggle'
                          }}
                        />
                      }
                      label="Template Item"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="functional_consultant"
                      name="functional_consultant"
                      label="Functional Consultant *"
                      value={formik.values.functional_consultant}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.functional_consultant && Boolean(formik.errors.functional_consultant)}
                      helperText={formik.touched.functional_consultant && formik.errors.functional_consultant}
                      inputProps={{
                        'aria-label': 'Functional consultant'
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="requirement_owner_client"
                      name="requirement_owner_client"
                      label="Client Owner *"
                      value={formik.values.requirement_owner_client}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.requirement_owner_client && Boolean(formik.errors.requirement_owner_client)}
                      helperText={formik.touched.requirement_owner_client && formik.errors.requirement_owner_client}
                      inputProps={{
                        'aria-label': 'Client owner'
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Solution Options */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Solution Options
                </Typography>

                {/* Option 1 */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Option 1
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="solution_option_1"
                        name="solution_option_1"
                        label="Solution Description"
                        multiline
                        rows={3}
                        value={formik.values.solution_option_1}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Solution option 1 description'
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        id="solution_option_1_time_estimate"
                        name="solution_option_1_time_estimate"
                        label="Time Estimate (hours)"
                        value={formik.values.solution_option_1_time_estimate || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.solution_option_1_time_estimate && Boolean(formik.errors.solution_option_1_time_estimate)}
                        helperText={formik.touched.solution_option_1_time_estimate && formik.errors.solution_option_1_time_estimate}
                        InputProps={{ inputProps: { min: 0, step: 0.5 } }}
                        inputProps={{
                          'aria-label': 'Solution option 1 time estimate'
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Option 2 */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Option 2
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="solution_option_2"
                        name="solution_option_2"
                        label="Solution Description"
                        multiline
                        rows={3}
                        value={formik.values.solution_option_2}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Solution option 2 description'
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        id="solution_option_2_time_estimate"
                        name="solution_option_2_time_estimate"
                        label="Time Estimate (hours)"
                        value={formik.values.solution_option_2_time_estimate || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.solution_option_2_time_estimate && Boolean(formik.errors.solution_option_2_time_estimate)}
                        helperText={formik.touched.solution_option_2_time_estimate && formik.errors.solution_option_2_time_estimate}
                        InputProps={{ inputProps: { min: 0, step: 0.5 } }}
                        inputProps={{
                          'aria-label': 'Solution option 2 time estimate'
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Option 3 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Option 3
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="solution_option_3"
                        name="solution_option_3"
                        label="Solution Description"
                        multiline
                        rows={3}
                        value={formik.values.solution_option_3}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Solution option 3 description'
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        id="solution_option_3_time_estimate"
                        name="solution_option_3_time_estimate"
                        label="Time Estimate (hours)"
                        value={formik.values.solution_option_3_time_estimate || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.solution_option_3_time_estimate && Boolean(formik.errors.solution_option_3_time_estimate)}
                        helperText={formik.touched.solution_option_3_time_estimate && formik.errors.solution_option_3_time_estimate}
                        InputProps={{ inputProps: { min: 0, step: 0.5 } }}
                        inputProps={{
                          'aria-label': 'Solution option 3 time estimate'
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>

            {/* Client Assessment */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Client Assessment
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="client-status-label">Client Status</InputLabel>
                      <Select
                        labelId="client-status-label"
                        id="status_client"
                        name="status_client"
                        value={formik.values.status_client || ''}
                        label="Client Status"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        inputProps={{
                          'aria-label': 'Select client status'
                        }}
                      >
                        <MenuItem value="">Select Status</MenuItem>
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="In Review">In Review</MenuItem>
                        <MenuItem value="Needs Discussion">Needs Discussion</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="client_comments"
                      name="client_comments"
                      label="Client Comments"
                      multiline
                      rows={3}
                      value={formik.values.client_comments}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      inputProps={{
                        'aria-label': 'Client comments'
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="client_preferences"
                      name="client_preferences"
                      label="Client Preferences"
                      multiline
                      rows={3}
                      value={formik.values.client_preferences}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      inputProps={{
                        'aria-label': 'Client preferences'
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="phase_comments"
                      name="phase_comments"
                      label="Phase Comments"
                      multiline
                      rows={3}
                      value={formik.values.phase_comments}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      inputProps={{
                        'aria-label': 'Phase comments'
                      }}
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