import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TablePagination,
  Button,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Checkbox,
  ListItemText,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  FormControlLabel,
  Switch,
  TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
  CloudUpload as CloudUploadIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { getRequirements, exportRequirements } from '../../services/requirementService';
import { getSavedFilters, saveFilter, deleteFilter } from '../../services/filterService';
import { Requirement, Priority, Status, FitGapStatus, Module, SubModule, Function, SavedFilter, BCFunctionalDepartment, FunctionalArea } from '../../types';
import { modules, subModules, functions, priorities, statuses, fitGapStatuses } from '../../services/masterDataService';
import bcDataService from '../../services/bcDataService';
import { hasRole } from '../../utils/auth';
import { StatusChip } from '../shared/StatusChip';

interface FilterObject {
  module_id?: string;
  submodule_id?: string;
  function_id?: string;
  priority_id?: string;
  status_id?: string;
  fitgap_id?: string;
  phase?: string;
  search?: string;
  in_scope?: boolean;
  [key: string]: string | boolean | undefined;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  minWidth?: number;
}

const RequirementsList: React.FC = () => {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filter states
  const [moduleList, setModuleList] = useState<Module[]>([]);
  const [subModuleList, setSubModuleList] = useState<SubModule[]>([]);
  const [functionList, setFunctionList] = useState<Function[]>([]);
  const [priorityList, setPriorityList] = useState<Priority[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [fitGapList, setFitGapList] = useState<FitGapStatus[]>([]);
  
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedSubModule, setSelectedSubModule] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedFitGap, setSelectedFitGap] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedInScope, setSelectedInScope] = useState<boolean | undefined>(undefined);
  
  // New state for export and saved filters
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterOpen, setSaveFilterOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterError, setFilterError] = useState<string | null>(null);

  // New states for column management and enhanced filtering
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [showTemplateOnly, setShowTemplateOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnConfigAnchor, setColumnConfigAnchor] = useState<null | HTMLElement>(null);
  
  // Column configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'req_id', label: 'ID', visible: true, sortable: true, minWidth: 70 },
    { id: 'title', label: 'Title', visible: true, sortable: true, minWidth: 200 },
    { id: 'businessCentralDepartment', label: 'Department', visible: true, sortable: true, minWidth: 150 },
    { id: 'functionalArea', label: 'Functional Area', visible: true, sortable: true, minWidth: 150 },
    { id: 'isTemplateItem', label: 'Template', visible: true, sortable: true, minWidth: 100 },
    { id: 'functionalConsultant', label: 'Consultant', visible: true, sortable: true, minWidth: 150 },
    { id: 'requirementOwnerClient', label: 'Client Owner', visible: false, sortable: true, minWidth: 150 },
    { id: 'solutionOption', label: 'Solution', visible: true, sortable: true, minWidth: 200 },
    { id: 'priority', label: 'Priority', visible: true, sortable: true, minWidth: 120 },
    { id: 'status', label: 'Status', visible: true, sortable: true, minWidth: 120 },
    { id: 'workshopName', label: 'Workshop', visible: false, sortable: true, minWidth: 150 },
    { id: 'phase', label: 'Phase', visible: true, sortable: true, minWidth: 120 },
    { id: 'statusClient', label: 'Client Status', visible: false, sortable: true, minWidth: 150 },
  ]);

  // Add state for BC data
  const [departmentList, setDepartmentList] = useState<BCFunctionalDepartment[]>([]);
  const [areaList, setAreaList] = useState<FunctionalArea[]>([]);
  const [filteredAreaList, setFilteredAreaList] = useState<FunctionalArea[]>([]);

  // Fetch requirements
  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        ...(selectedModule && { module_id: selectedModule }),
        ...(selectedSubModule && { submodule_id: selectedSubModule }),
        ...(selectedFunction && { function_id: selectedFunction }),
        ...(selectedPriority && { priority_id: selectedPriority }),
        ...(selectedStatus && { status_id: selectedStatus }),
        ...(selectedFitGap && { fitgap_id: selectedFitGap }),
        ...(selectedPhase && { phase: selectedPhase }),
        ...(selectedInScope !== undefined && { in_scope: selectedInScope }),
        ...(selectedDepartment && { business_central_functional_department: selectedDepartment }),
        ...(selectedArea && { functional_area: selectedArea }),
        ...(showTemplateOnly && { template_item: true }),
        sort_field: sortField === 'id' ? 'req_id' : sortField,
        sort_direction: sortDirection,
      };
      
      const response = await getRequirements(page + 1, rowsPerPage, filters);
      if (response && response.pagination) {
        setRequirements(response.requirements || []);
        setTotalCount(response.pagination.totalItems || 0);
      } else {
        setRequirements([]);
        setTotalCount(0);
        setError('No requirements data received');
      }
    } catch (err: any) {
      console.error('Error fetching requirements:', err);
      setRequirements([]);
      setTotalCount(0);
      setError(err.response?.data?.message || err.message || 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedModule, selectedSubModule, selectedFunction, selectedPriority, selectedStatus, selectedFitGap, selectedPhase, selectedInScope, selectedDepartment, selectedArea, showTemplateOnly, sortField, sortDirection]);
  
  // Update fetch filter options to include BC data
  const fetchFilterOptions = async () => {
    try {
      const [
        modulesResponse,
        subModulesResponse,
        functionsResponse,
        prioritiesResponse,
        statusesResponse,
        fitGapResponse,
        { departments: departmentsResponse },  // Destructure departments from response
        { areas: areasResponse }               // Destructure areas from response
      ] = await Promise.all([
        modules.getAll(),
        subModules.getAll(),
        functions.getAll(),
        priorities.getAll(),
        statuses.getAll(),
        fitGapStatuses.getAll(),
        bcDataService.getDepartments(),
        bcDataService.getFunctionalAreas(),
      ]);
      
      setModuleList(modulesResponse);
      setSubModuleList(subModulesResponse);
      setFunctionList(functionsResponse);
      setPriorityList(prioritiesResponse);
      setStatusList(statusesResponse);
      setFitGapList(fitGapResponse);
      setDepartmentList(departmentsResponse || []); // Add null check
      setAreaList(areasResponse || []); // Add null check
    } catch (err: any) {
      console.error('Error fetching filter options:', err);
      // Initialize with empty arrays on error
      setDepartmentList([]);
      setAreaList([]);
    }
  };
  
  useEffect(() => {
    fetchFilterOptions();
  }, []);
  
  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);
  
  // Load saved filters on mount
  useEffect(() => {
    setSavedFilters(getSavedFilters());
  }, []);

  // Filter submodules based on selected module
  const filteredSubModules = selectedModule 
    ? subModuleList.filter(sm => sm.module_id === parseInt(selectedModule))
    : subModuleList;
  
  // Filter functions based on selected submodule
  const filteredFunctions = selectedSubModule
    ? functionList.filter(f => f.submodule_id === parseInt(selectedSubModule))
    : functionList;

  // Update filtered areas when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const departmentId = parseInt(selectedDepartment);
      setFilteredAreaList(areaList.filter(area => area.department_id === departmentId));
    } else {
      setFilteredAreaList(areaList);
    }
  }, [selectedDepartment, areaList]);
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };
  
  const handleReset = () => {
    setSearch('');
    setSelectedModule('');
    setSelectedSubModule('');
    setSelectedFunction('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedFitGap('');
    setSelectedPhase('');
    setSelectedInScope(undefined);
    setSelectedDepartment('');
    setSelectedArea('');
    setShowTemplateOnly(false);
    setPage(0);
  };
  
  const handleViewRequirement = (id: number) => {
    navigate(`/requirements/view/${id}`);
  };
  
  const handleEditRequirement = (id: number) => {
    navigate(`/requirements/edit/${id}`);
  };
  
  // Handle exports
  const handleExportOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: FilterObject = {
        module_id: selectedModule || undefined,
        submodule_id: selectedSubModule || undefined,
        function_id: selectedFunction || undefined,
        priority_id: selectedPriority || undefined,
        status_id: selectedStatus || undefined,
        fitgap_id: selectedFitGap || undefined,
        phase: selectedPhase || undefined,
        search: search || undefined,
        in_scope: selectedInScope
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });
      
      await exportRequirements(format, filters);
      setSuccess(`Export to ${format.toUpperCase()} completed successfully`);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || err.message || 'Export failed');
    } finally {
      setLoading(false);
      handleExportClose();
    }
  };

  // Handle saved filters
  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSaveFilterOpen = () => {
    setSaveFilterOpen(true);
    handleFilterClose();
  };

  const handleSaveFilterClose = () => {
    setSaveFilterOpen(false);
    setFilterName('');
    setFilterError(null);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      setFilterError('Filter name is required');
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: {
        module_id: selectedModule,
        submodule_id: selectedSubModule,
        function_id: selectedFunction,
        priority_id: selectedPriority,
        status_id: selectedStatus,
        fitgap_id: selectedFitGap,
        phase: selectedPhase,
        search
      },
      createdAt: new Date().toISOString()
    };

    saveFilter(newFilter);
    setSavedFilters(getSavedFilters());
    handleSaveFilterClose();
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    const { filters } = filter;
    setSelectedModule(filters.module_id || '');
    setSelectedSubModule(filters.submodule_id || '');
    setSelectedFunction(filters.function_id || '');
    setSelectedPriority(filters.priority_id || '');
    setSelectedStatus(filters.status_id || '');
    setSelectedFitGap(filters.fitgap_id || '');
    setSelectedPhase(filters.phase || '');
    setSearch(filters.search || '');
    setPage(0);
    handleFilterClose();
  };

  const handleDeleteFilter = (id: string) => {
    deleteFilter(id);
    setSavedFilters(getSavedFilters());
  };

  // Column visibility toggle handler
  const handleColumnToggle = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Sort handler
  const handleSort = (columnId: string) => {
    setSortField(columnId);
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (loading && page === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Requirements</Typography>
        <Box>
          <Button
            sx={{ mr: 1 }}
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportOpen}
          >
            Export
          </Button>
          <Button
            sx={{ mr: 1 }}
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleFilterOpen}
          >
            Saved Filters
          </Button>
          {hasRole('Consultant') && (
            <>
              <Button
                sx={{ mr: 1 }}
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => navigate('/requirements/import')}
              >
                Bulk Import
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/requirements/create')}
              >
                New Requirement
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => handleExport('excel')}>Export to Excel</MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>Export to PDF</MenuItem>
      </Menu>

      {/* Saved Filters Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        {savedFilters.map((filter) => (
          <MenuItem
            key={filter.id}
            sx={{ display: 'flex', justifyContent: 'space-between', width: 250 }}
          >
            <Box
              sx={{ flex: 1, cursor: 'pointer' }}
              onClick={() => handleApplyFilter(filter)}
            >
              {filter.name}
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFilter(filter.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleSaveFilterOpen}>
          <SaveIcon sx={{ mr: 1 }} fontSize="small" />
          Save Current Filters
        </MenuItem>
      </Menu>

      {/* Save Filter Dialog */}
      <Dialog open={saveFilterOpen} onClose={handleSaveFilterClose}>
        <DialogTitle>Save Filter</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Filter Name"
            fullWidth
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            error={Boolean(filterError)}
            helperText={filterError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveFilterClose}>Cancel</Button>
          <Button onClick={handleSaveFilter} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Column Configuration Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          startIcon={<ViewColumnIcon />}
          onClick={(e) => setColumnConfigAnchor(e.currentTarget)}
        >
          Configure Columns
        </Button>
      </Box>

      {/* Column Configuration Menu */}
      <Menu
        anchorEl={columnConfigAnchor}
        open={Boolean(columnConfigAnchor)}
        onClose={() => setColumnConfigAnchor(null)}
      >
        {columns.map((column) => (
          <MenuItem key={column.id} onClick={() => handleColumnToggle(column.id)}>
            <ListItemIcon>
              <Checkbox checked={column.visible} />
            </ListItemIcon>
            <ListItemText primary={column.label} />
          </MenuItem>
        ))}
      </Menu>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center" role="search">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              id="search-input"
              variant="outlined"
              label="Search Requirements"
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon aria-hidden="true" />
                  </InputAdornment>
                ),
                'aria-label': 'Search requirements',
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="module-filter-label">Module</InputLabel>
              <Select
                labelId="module-filter-label"
                id="module-filter"
                value={selectedModule}
                label="Module"
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setSelectedSubModule('');
                  setSelectedFunction('');
                }}
                inputProps={{
                  'aria-label': 'Filter by module'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {moduleList.map((module) => (
                  <MenuItem key={module.module_id} value={module.module_id.toString()}>
                    {module.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth disabled={!selectedModule}>
              <InputLabel id="submodule-filter-label">SubModule</InputLabel>
              <Select
                labelId="submodule-filter-label"
                id="submodule-filter"
                value={selectedSubModule}
                label="SubModule"
                onChange={(e) => {
                  setSelectedSubModule(e.target.value);
                  setSelectedFunction('');
                }}
                inputProps={{
                  'aria-label': 'Filter by submodule'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {filteredSubModules.map((subModule) => (
                  <MenuItem key={subModule.submodule_id} value={subModule.submodule_id.toString()}>
                    {subModule.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth disabled={!selectedSubModule}>
              <InputLabel id="function-filter-label">Function</InputLabel>
              <Select
                labelId="function-filter-label"
                id="function-filter"
                value={selectedFunction}
                label="Function"
                onChange={(e) => setSelectedFunction(e.target.value)}
                inputProps={{
                  'aria-label': 'Filter by function'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {filteredFunctions.map((func) => (
                  <MenuItem key={func.function_id} value={func.function_id.toString()}>
                    {func.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                id="priority-filter"
                value={selectedPriority}
                label="Priority"
                onChange={(e) => setSelectedPriority(e.target.value)}
                inputProps={{
                  'aria-label': 'Filter by priority'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {priorityList.map((priority) => (
                  <MenuItem key={priority.priority_id} value={priority.priority_id.toString()}>
                    {priority.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
                inputProps={{
                  'aria-label': 'Filter by status'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {statusList.map((status) => (
                  <MenuItem key={status.status_id} value={status.status_id.toString()}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="fitgap-filter-label">Fit/Gap</InputLabel>
              <Select
                labelId="fitgap-filter-label"
                id="fitgap-filter"
                value={selectedFitGap}
                label="Fit/Gap"
                onChange={(e) => setSelectedFitGap(e.target.value)}
                inputProps={{
                  'aria-label': 'Filter by fit/gap'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {fitGapList.map((fitGap) => (
                  <MenuItem key={fitGap.fitgap_id} value={fitGap.fitgap_id.toString()}>
                    {fitGap.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="phase-filter-label">Phase</InputLabel>
              <Select
                labelId="phase-filter-label"
                id="phase-filter"
                value={selectedPhase}
                label="Phase"
                onChange={(e) => setSelectedPhase(e.target.value)}
                inputProps={{
                  'aria-label': 'Filter by phase'
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Initial">Initial</MenuItem>
                <MenuItem value="Future">Future</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="inscope-filter-label">In Scope</InputLabel>
              <Select
                labelId="inscope-filter-label"
                id="inscope-filter"
                value={selectedInScope === undefined ? '' : selectedInScope.toString()}
                label="In Scope"
                onChange={(e) => setSelectedInScope(e.target.value === '' ? undefined : e.target.value === 'true')}
                inputProps={{
                  'aria-label': 'Filter by in scope'
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="department-filter-label">Department</InputLabel>
              <Select
                labelId="department-filter-label"
                id="department-filter"
                value={selectedDepartment}
                label="Department"
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedArea('');
                }}
                inputProps={{
                  'aria-label': 'Filter by department'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {departmentList.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth disabled={!selectedDepartment}>
              <InputLabel id="area-filter-label">Functional Area</InputLabel>
              <Select
                labelId="area-filter-label"
                id="area-filter"
                value={selectedArea}
                label="Functional Area"
                onChange={(e) => setSelectedArea(e.target.value)}
                inputProps={{
                  'aria-label': 'Filter by functional area'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {filteredAreaList.map((area) => (
                  <MenuItem key={area.id} value={area.id.toString()}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showTemplateOnly}
                  onChange={(e) => setShowTemplateOnly(e.target.checked)}
                  inputProps={{
                    'aria-label': 'Show template items only'
                  }}
                />
              }
              label="Template Items Only"
            />
          </Grid>
          <Grid item xs={12} md={12} sx={{ textAlign: 'right' }}>
            <Button variant="outlined" onClick={handleReset} sx={{ mr: 1 }}>
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Requirements Table */}
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="requirements table">
            <TableHead>
              <TableRow>
                {columns
                  .filter(col => col.visible)
                  .map(column => (
                    <TableCell
                      key={column.id}
                      style={{ minWidth: column.minWidth }}
                      sortDirection={sortField === column.id ? sortDirection : false}
                    >
                      <TableSortLabel
                        active={sortField === column.id}
                        direction={sortField === column.id ? sortDirection : 'asc'}
                        onClick={() => handleSort(column.id)}
                        aria-label={`Sort by ${column.label}`}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                ))}
                <TableCell align="right" aria-label="Actions">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => col.visible).length + 1} align="center">
                    <CircularProgress size={30} sx={{ my: 3 }} aria-label="Loading requirements" />
                  </TableCell>
                </TableRow>
              ) : requirements && requirements.length > 0 ? (
                requirements.map((req) => (
                  <TableRow 
                    key={req.req_id} 
                    hover
                    onClick={() => handleViewRequirement(req.req_id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleViewRequirement(req.req_id);
                      }
                    }}
                    sx={{ cursor: 'pointer' }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View requirement: ${req.title}`}
                  >
                    {columns
                      .filter(col => col.visible)
                      .map(column => (
                        <TableCell key={column.id}>
                          {renderCellContent(req, column.id)}
                        </TableCell>
                    ))}
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRequirement(req.req_id);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {hasRole('Consultant') && (
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRequirement(req.req_id);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasRole('Admin') && (
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => col.visible).length + 1} align="center">
                    <Typography variant="body1" sx={{ my: 3 }}>
                      No requirements found
                    </Typography>
                  </TableCell>
                </TableRow>
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
          labelRowsPerPage="Requirements per page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} of ${count} requirements`
          }
        />
      </Paper>

      {/* Export Menu */}
      <Menu
        id="export-menu"
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        aria-label="Export options"
      >
        <MenuItem onClick={() => handleExport('excel')} role="menuitem">Export to Excel</MenuItem>
        <MenuItem onClick={() => handleExport('pdf')} role="menuitem">Export to PDF</MenuItem>
      </Menu>

      {/* Other menus and dialogs... */}
    </Box>
  );
  
  // Helper function to render cell content
  function renderCellContent(req: Requirement, columnId: string) {
    switch (columnId) {
      case 'req_id':
        return req.req_id;
      case 'title':
        return req.title;
      case 'businessCentralDepartment':
        return req.bc_department?.name || req.BCFunctionalDepartment?.name || '';
      case 'functionalArea':
        return req.functional_area_relation?.name || req.FunctionalArea?.name || '';
      case 'isTemplateItem':
        return req.template_item ? 'Yes' : 'No';
      case 'functionalConsultant':
        return req.functional_consultant || '';
      case 'requirementOwnerClient':
        return req.requirement_owner_client || '';
      case 'solutionOption':
        return req.SolutionOption?.name || '';
      case 'priority':
        return req.Priority?.name ? <StatusChip label={req.Priority.name} type="priority" /> : '';
      case 'status':
        return req.Status?.name ? <StatusChip label={req.Status.name} type="status" /> : '';
      case 'workshopName':
        return req.workshop_name || '';
      case 'phase':
        return req.phase || '';
      case 'statusClient':
        return req.status_client || '';
      default:
        const value = req[columnId as keyof Requirement];
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' 
          ? value 
          : '';
    }
  }
};

export default RequirementsList;