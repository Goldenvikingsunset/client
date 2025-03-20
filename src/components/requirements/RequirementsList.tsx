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
} from '@mui/icons-material';
import { getRequirements, exportRequirements } from '../../services/requirementService';
import { getSavedFilters, saveFilter, deleteFilter } from '../../services/filterService';
import { Requirement, Priority, Status, FitGapStatus, Module, SubModule, Function, SavedFilter } from '../../types';
import { modules, subModules, functions, priorities, statuses, fitGapStatuses } from '../../services/masterDataService';
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

  // Fetch requirements
  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filter object
      const filters: Record<string, string | number | boolean> = {};
      if (search) filters.search = search;
      if (selectedModule) filters.module_id = selectedModule;
      if (selectedSubModule) filters.submodule_id = selectedSubModule;
      if (selectedFunction) filters.function_id = selectedFunction;
      if (selectedPriority) filters.priority_id = selectedPriority;
      if (selectedStatus) filters.status_id = selectedStatus;
      if (selectedFitGap) filters.fitgap_id = selectedFitGap;
      if (selectedPhase) filters.phase = selectedPhase;
      if (selectedInScope !== undefined) filters.in_scope = selectedInScope;
      
      const response = await getRequirements(page + 1, rowsPerPage, filters);
      if (response && response.requirements) {
        setRequirements(response.requirements);
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
      setError(err.response?.data?.message || 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedModule, selectedSubModule, selectedFunction, selectedPriority, selectedStatus, selectedFitGap, selectedPhase, selectedInScope]);
  
  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const [
        modulesResponse,
        subModulesResponse,
        functionsResponse,
        prioritiesResponse,
        statusesResponse,
        fitGapResponse,
      ] = await Promise.all([
        modules.getAll(),
        subModules.getAll(),
        functions.getAll(),
        priorities.getAll(),
        statuses.getAll(),
        fitGapStatuses.getAll(),
      ]);
      
      setModuleList(modulesResponse);
      setSubModuleList(subModulesResponse);
      setFunctionList(functionsResponse);
      setPriorityList(prioritiesResponse);
      setStatusList(statusesResponse);
      setFitGapList(fitGapResponse);
    } catch (err: any) {
      console.error('Error fetching filter options:', err);
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
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search"
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Module</InputLabel>
              <Select
                value={selectedModule}
                label="Module"
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setSelectedSubModule('');
                  setSelectedFunction('');
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
              <InputLabel>SubModule</InputLabel>
              <Select
                value={selectedSubModule}
                label="SubModule"
                onChange={(e) => {
                  setSelectedSubModule(e.target.value);
                  setSelectedFunction('');
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
              <InputLabel>Function</InputLabel>
              <Select
                value={selectedFunction}
                label="Function"
                onChange={(e) => setSelectedFunction(e.target.value)}
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
              <InputLabel>Priority</InputLabel>
              <Select
                value={selectedPriority}
                label="Priority"
                onChange={(e) => setSelectedPriority(e.target.value)}
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
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
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
              <InputLabel>Fit/Gap</InputLabel>
              <Select
                value={selectedFitGap}
                label="Fit/Gap"
                onChange={(e) => setSelectedFitGap(e.target.value)}
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
              <InputLabel>Phase</InputLabel>
              <Select
                value={selectedPhase}
                label="Phase"
                onChange={(e) => setSelectedPhase(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Initial">Initial</MenuItem>
                <MenuItem value="Future">Future</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>In Scope</InputLabel>
              <Select
                value={selectedInScope === undefined ? '' : selectedInScope.toString()}
                label="In Scope"
                onChange={(e) => setSelectedInScope(e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
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
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Function</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fit/Gap</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={30} />
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
                  >
                    <TableCell>{req.req_id}</TableCell>
                    <TableCell>{req.title}</TableCell>
                    <TableCell>
                      {req.Function?.SubModule?.Module?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{req.Function?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {req.Priority?.name && (
                        <StatusChip
                          label={req.Priority.name}
                          type="priority"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {req.Status?.name && (
                        <StatusChip
                          label={req.Status.name}
                          type="status"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {req.FitGapStatus?.name && (
                        <StatusChip
                          label={req.FitGapStatus.name}
                          type="fitgap"
                        />
                      )}
                    </TableCell>
                    <TableCell>{req.phase}</TableCell>
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
                  <TableCell colSpan={9} align="center">
                    No requirements found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default RequirementsList;