import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getRequirementStats } from '../../services/requirementService';
import { StatsResponse } from '../../types';

const COLORS = {
  priority: {
    'Must have': '#f44336',
    'Should have': '#ff9800',
    'Could have': '#2196f3',
    'Won\'t have': '#9e9e9e'
  },
  status: {
    'Approved': '#4caf50',
    'In Review': '#ff9800',
    'Rejected': '#f44336'
  },
  fitgap: {
    'Fit': '#4caf50',
    'Gap': '#ff9800'
  }
};

const DEFAULT_CHART_HEIGHT = 300;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching dashboard stats...');
        const statsData = await getRequirementStats();
        console.log('Received stats:', statsData);
        
        if (!statsData) {
          throw new Error('No data received from server');
        }
        
        setStats(statsData);
      } catch (err: any) {
        console.error('Dashboard error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(prev => prev + 1);
          return;
        }
        
        setError(
          err.response?.data?.message || 
          err.message || 
          'Failed to load dashboard data. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [retryCount]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => setRetryCount(0)}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert severity="info">No data available</Alert>
      </Box>
    );
  }

  // Prepare data for charts
  const priorityChartData = stats.priorityStats.map((stat) => ({
    name: stat['Priority.name'],
    value: Number(stat.count),
    percentage: ((Number(stat.count) / stats.totalRequirements) * 100).toFixed(1)
  }));

  const statusChartData = stats.statusStats.map((stat) => ({
    name: stat['Status.name'],
    value: Number(stat.count),
    percentage: ((Number(stat.count) / stats.totalRequirements) * 100).toFixed(1)
  }));

  const fitGapChartData = stats.fitGapStats.map((stat) => ({
    name: stat['FitGapStatus.name'],
    value: Number(stat.count),
    percentage: ((Number(stat.count) / stats.totalRequirements) * 100).toFixed(1)
  }));

  const moduleChartData = stats.moduleStats.map((stat) => ({
    name: stat['Function->SubModule->Module.name'],
    value: Number(stat.count)
  }));

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Top Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Requirements
            </Typography>
            <Typography variant="h3" component="div">
              {stats.totalRequirements}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              By Priority
            </Typography>
            {priorityChartData.map((item) => (
              <Box key={item.name} sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name}</span>
                  <span>{item.value} ({item.percentage}%)</span>
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              By Status
            </Typography>
            {statusChartData.map((item) => (
              <Box key={item.name} sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name}</span>
                  <span>{item.value} ({item.percentage}%)</span>
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Requirements by Module */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Requirements by Module" />
            <CardContent>
              <Box sx={{ height: DEFAULT_CHART_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={moduleChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <XAxis 
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Requirements"
                      fill="#2196f3"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recent Activity" />
            <CardContent>
              <List>
                {stats.recentChanges.map((change) => (
                  <React.Fragment key={change.log_id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={`Requirement ${change.changed_requirement?.title || change.req_id}`}
                        secondary={
                          <>
                            <Typography
                              sx={{ display: 'inline' }}
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {change.change_type}
                              {change.field_changed !== 'All' && ` - ${change.field_changed}`}
                              {change.old_value && change.new_value && (
                                `: ${change.old_value} → ${change.new_value}`
                              )}
                            </Typography>
                            {' by '}
                            <Typography
                              sx={{ display: 'inline' }}
                              component="span"
                              variant="body2"
                              color="primary"
                            >
                              {change.change_author?.username || 'Unknown User'}
                            </Typography>
                            {' - '}
                            {new Date(change.timestamp).toLocaleString()}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;