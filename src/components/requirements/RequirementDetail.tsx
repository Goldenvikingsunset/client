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
} from '@mui/icons-material';
import { getRequirementById } from '../../services/requirementService';
import { ChangeLog, Requirement } from '../../types';
import { hasRole } from '../../utils/auth';
import { StatusChip } from '../shared/StatusChip';

const RequirementDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/requirements')}
        >
          Back to Requirements
        </Button>
        
        {hasRole('Consultant') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/requirements/edit/${requirement.req_id}`)}
          >
            Edit Requirement
          </Button>
        )}
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Basic Information */}
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

        {/* Classification & Status */}
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

        {/* Solution Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">
              Solution
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Fit/Gap Analysis
                </Typography>
                {requirement.FitGapStatus?.name && (
                  <StatusChip
                    label={requirement.FitGapStatus.name}
                    type="fitgap"
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Solution Option
                </Typography>
                <Typography variant="body1">
                  {requirement.SolutionOption?.name || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Solution Description
                </Typography>
                <Typography variant="body1">
                  {requirement.comments || 'No solution description provided'}
                </Typography>
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
      </Grid>
    </Box>
  );
};

export default RequirementDetail;