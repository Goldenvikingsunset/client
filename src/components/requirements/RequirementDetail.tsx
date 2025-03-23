import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { getRequirementById, deleteRequirement } from '../../services/requirementService';
import { ChangeLog, Requirement } from '../../types';
import { hasRole } from '../../utils/auth';
import { StatusChip } from '../shared/StatusChip';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`solution-tabpanel-${index}`}
      aria-labelledby={`solution-tab-${index}`}
      {...other }
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const RequirementDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solutionTabIndex, setSolutionTabIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRequirement = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          setError('Requirement ID is missing');
          setLoading(false);
          return;
        }
        
        const response = await getRequirementById(parseInt(id));
        console.log('Requirement data received:', response.requirement);
        console.log('Solution option 1:', response.requirement.solution_option_1);
        console.log('Solution option 1 time estimate:', response.requirement.solution_option_1_time_estimate);
        setRequirement(response.requirement);
      } catch (err: any) {
        console.error('Error fetching requirement:', err);
        setError(err.response?.data?.message || 'Failed to load requirement details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequirement();
  }, [id]);

  const formatFieldName = (field: string): string => {
    const fieldMap: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      details: 'Details',
      function_id: 'Function',
      priority_id: 'Priority',
      status_id: 'Status',
      phase: 'Phase',
      in_scope: 'In Scope',
      option_id: 'Solution Option',
      fitgap_id: 'Fit/Gap Status',
      comments: 'Comments'
    };
    return fieldMap[field] || field;
  };

  const formatChangeValue = (change: ChangeLog): string => {
    const field = change.field_changed;
    if (!field) return '';

    if (field === 'in_scope') {
      return `${change.old_value === 'true' ? 'Yes' : 'No'} → ${change.new_value === 'true' ? 'Yes' : 'No'}`;
    }

    if (change.old_value && change.new_value) {
      return `${change.old_value} → ${change.new_value}`;
    } else if (change.new_value) {
      return `Set to ${change.new_value}`;
    } else if (change.old_value) {
      return `Removed (was: ${change.old_value})`;
    }
    return 'Changed';
  };

  const handleDelete = async () => {
    try {
      if (!id) return;
      await deleteRequirement(parseInt(id));
      navigate('/requirements', { state: { message: 'Requirement deleted successfully' } });
    } catch (err: any) {
      console.error('Error deleting requirement:', err);
      setError(err.response?.data?.message || 'Failed to delete requirement');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !requirement) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load requirement details'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/requirements')}
        >
          Back to Requirements
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/requirements')}
        >
          Back to Requirements
        </Button>
        
        {hasRole('Consultant') && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/requirements/edit/${requirement?.req_id}`)}
            >
              Edit Requirement
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Title and Basic Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {requirement.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" color="text.secondary">
                  ID: {requirement.req_id}
                </Typography>
                {requirement.in_scope !== undefined && (
                  <StatusChip
                    label={requirement.in_scope ? 'In Scope' : 'Out of Scope'}
                    type="status"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            <Typography variant="body1" paragraph>
              {requirement.description}
            </Typography>
          </Paper>
        </Grid>

        {/* Business Central Classification */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">
              Business Central Classification
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Functional Department
                </Typography>
                <Typography variant="body1">
                  {requirement?.bc_department?.name || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Functional Area
                </Typography>
                <Typography variant="body1">
                  {requirement?.functional_area_relation?.name || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Template Item
                </Typography>
                <StatusChip
                  label={requirement?.template_item ? 'Yes' : 'No'}
                  type="status"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Workshop
                </Typography>
                <Typography variant="body1">
                  {requirement?.workshop_name || 'Not specified'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Status and Classification */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">
              Classification
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Module Path
                </Typography>
                <Typography variant="body1">
                  {requirement.Function?.SubModule?.Module?.name} {' > '}
                  {requirement.Function?.SubModule?.name} {' > '}
                  {requirement.Function?.name}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Priority
                </Typography>
                {requirement.Priority?.name && (
                  <StatusChip
                    label={requirement.Priority.name}
                    type="priority"
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                {requirement.Status?.name && (
                  <StatusChip
                    label={requirement.Status.name}
                    type="status"
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phase
                </Typography>
                <Typography variant="body1">
                  {requirement.phase || 'Not specified'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Solution Options */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Solution Options
            </Typography>
            <Tabs
              value={solutionTabIndex}
              onChange={(_, newValue) => setSolutionTabIndex(newValue)}
              aria-label="solution options tabs"
            >
              <Tab label="Option 1" />
              <Tab label="Option 2" />
              <Tab label="Option 3" />
            </Tabs>
            
            <TabPanel value={solutionTabIndex} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {requirement?.solution_option_1 || 'No solution description provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time Estimate
                  </Typography>
                  <Typography variant="body1">
                    {requirement?.solution_option_1_time_estimate !== null && requirement?.solution_option_1_time_estimate !== undefined 
                      ? `${requirement.solution_option_1_time_estimate} hours`
                      : 'No estimate provided'}
                  </Typography>
                </Grid>
              </Grid>
            </TabPanel>
            
            <TabPanel value={solutionTabIndex} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {requirement?.solution_option_2 || 'No solution description provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time Estimate
                  </Typography>
                  <Typography variant="body1">
                    {requirement?.solution_option_2_time_estimate !== null && requirement?.solution_option_2_time_estimate !== undefined
                      ? `${requirement.solution_option_2_time_estimate} hours`
                      : 'No estimate provided'}
                  </Typography>
                </Grid>
              </Grid>
            </TabPanel>
            
            <TabPanel value={solutionTabIndex} index={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {requirement?.solution_option_3 || 'No solution description provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time Estimate
                  </Typography>
                  <Typography variant="body1">
                    {requirement?.solution_option_3_time_estimate !== null && requirement?.solution_option_3_time_estimate !== undefined
                      ? `${requirement.solution_option_3_time_estimate} hours`
                      : 'No estimate provided'}
                  </Typography>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>

        {/* Client Assessment */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Client Assessment
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Client Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {requirement?.status_client && (
                        <StatusChip
                          label={requirement.status_client}
                          type="status"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Client Comments
                    </Typography>
                    <Typography variant="body1">
                      {requirement?.client_comments || 'No comments provided'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Client Preferences
                    </Typography>
                    <Typography variant="body1">
                      {requirement?.client_preferences || 'No preferences specified'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Additional Details */}
        {requirement.details && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Additional Details
              </Typography>
              <Typography variant="body1">
                {requirement.details}
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Change History */}
        {requirement.requirement_changes && requirement.requirement_changes.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Change History
              </Typography>
              <Timeline>
                {requirement.requirement_changes.map((change) => (
                  <TimelineItem key={change.log_id}>
                    <TimelineOppositeContent color="text.secondary">
                      {new Date(change.timestamp).toLocaleString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={
                        change.change_type === 'Create' ? 'success' :
                        change.change_type === 'Update' ? 'primary' :
                        'error'
                      } />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2">
                        {change.change_type === 'Create' ? (
                          'Requirement created'
                        ) : change.change_type === 'Delete' ? (
                          'Requirement deleted'
                        ) : (
                          <>
                            Update - {formatFieldName(change.field_changed || '')}: {formatChangeValue(change)}
                          </>
                        )}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          by {change.change_author?.username || 'System'}
                        </Typography>
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Paper>
          </Grid>
        )}

        {/* Metadata */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Metadata
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body2">
                  {requirement.requirement_creator?.username || 'System'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body2">
                  {new Date(requirement.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated By
                </Typography>
                <Typography variant="body2">
                  {requirement.requirement_updater?.username || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated At
                </Typography>
                <Typography variant="body2">
                  {new Date(requirement.updated_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Debug section has been removed */}

      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this requirement? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequirementDetail;