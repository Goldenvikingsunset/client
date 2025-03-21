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
  Tabs,
  Tab,
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
import { getCurrentUser } from '../../utils/auth';

interface ChartData {
  name: string;
  value: number;
  percentage: string;
}

interface StatsColors {
  priority: { [key: string]: string };
  status: { [key: string]: string };
  fitgap: { [key: string]: string };
}

const COLORS: StatsColors = {
  priority: {
    'High': '#f44336',
    'Medium': '#ff9800',
    'Low': '#2196f3',
    'Must have': '#4caf50',
    'Could have': '#9e9e9e',
    'Default': '#757575'
  },
  status: {
    'Approved': '#4caf50',
    'In Review': '#ff9800',
    'Rejected': '#f44336',
    'Needs Discussion': '#9c27b0'
  },
  fitgap: {
    'Fit': '#4caf50',
    'Gap': '#ff9800',
    'Default': '#757575'
  }
};

const DEFAULT_CHART_HEIGHT = 300;

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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const MAX_RETRIES = 3;
  const user = getCurrentUser();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const stats = await getRequirementStats();
        setStats(stats);
      } catch (error) {
        console.error('Dashboard error:', error);
        // Set default empty values instead of leaving state undefined
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [retryCount]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={24} aria-label="Loading..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => setRetryCount(0)}>
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
  const moduleChartData = stats?.moduleStats?.map((stat) => ({
    name: stat['Function->SubModule->Module.name'] || 'Unknown',
    value: stat.count,
    percentage: ((stat.count / (stats?.totalRequirements || 1)) * 100).toFixed(1)
  })) || [];

  const priorityChartData = stats?.priorityStats?.map((stat) => ({
    name: stat['Priority.name'] || 'Unknown',
    value: stat.count,
    percentage: ((stat.count / (stats?.totalRequirements || 1)) * 100).toFixed(1)
  })) || [];

  const fitGapChartData = stats?.fitGapStats?.map((stat) => ({
    name: stat['FitGapStatus.name'] || 'Unknown',
    value: stat.count,
    percentage: ((stat.count / (stats?.totalRequirements || 1)) * 100).toFixed(1)
  })).filter(item => item.name !== 'Unknown') || [];

  const clientStatusData = {
    approved: stats.clientStatusStats?.find(s => s.status === 'Approved')?.count || 0,
    inReview: stats.clientStatusStats?.find(s => s.status === 'In Review')?.count || 0,
    needsDiscussion: stats.clientStatusStats?.find(s => s.status === 'Needs Discussion')?.count || 0,
    rejected: stats.clientStatusStats?.find(s => s.status === 'Rejected')?.count || 0,
  };

  const getCellColor = (entry: ChartData, colorType: keyof StatsColors): string => {
    const colors = COLORS[colorType];
    return colors[entry.name] || colors['Default'];
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Role-specific view tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Overview" />
        {user?.role === 'Consultant' && <Tab label="Implementation" />}
        {(user?.role === 'Client' || user?.role === 'Consultant') && <Tab label="Client View" />}
      </Tabs>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
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
                Priority Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {priorityChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getCellColor(entry, 'priority')} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Fit/Gap Analysis
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fitGapChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {fitGapChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getCellColor(entry, 'fitgap')} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Requirements by Module
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleChartData}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      name="Requirements" 
                      fill="#2196f3"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {stats?.recentChanges?.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Recent Changes
                </Typography>
                <List>
                  {stats.recentChanges.map((change) => (
                    <React.Fragment key={change.log_id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={`REQ-${change.req_id}: ${change.changed_requirement?.title}`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {change.change_type} - {change.field_changed}
                                {change.old_value && change.new_value && 
                                  `: ${change.old_value} → ${change.new_value}`}
                              </Typography>
                              <br />
                              <Typography component="span" variant="caption" color="text.secondary">
                                by {change.change_author?.username} at {new Date(change.timestamp).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Implementation View Tab */}
      {user?.role === 'Consultant' && (
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Implementation Progress by Department" />
                <CardContent>
                  <Box sx={{ height: DEFAULT_CHART_HEIGHT }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moduleChartData} aria-label="Implementation Progress by Department Chart">
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Requirements" fill="#2196f3" role="img" aria-label="Department implementation progress" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

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
                                <Typography component="span" variant="body2" color="text.primary">
                                  {change.change_type}
                                  {change.field_changed !== 'All' && ` - ${change.field_changed}`}
                                  {change.old_value && change.new_value && (
                                    `: ${change.old_value} → ${change.new_value}`
                                  )}
                                </Typography>
                                {' by '}
                                <Typography component="span" variant="body2" color="primary">
                                  {change.change_author?.username || 'Unknown'}
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
        </TabPanel>
      )}

      {/* Client View Tab */}
      {(user?.role === 'Client' || user?.role === 'Consultant') && (
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Client Status Overview" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: COLORS.status.Approved + '20' }}>
                        <Typography variant="h6" gutterBottom>
                          Approved
                        </Typography>
                        <Typography variant="h4">{clientStatusData.approved}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: COLORS.status['In Review'] + '20' }}>
                        <Typography variant="h6" gutterBottom>
                          In Review
                        </Typography>
                        <Typography variant="h4">{clientStatusData.inReview}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: COLORS.status['Needs Discussion'] + '20' }}>
                        <Typography variant="h6" gutterBottom>
                          Needs Discussion
                        </Typography>
                        <Typography variant="h4">{clientStatusData.needsDiscussion}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: COLORS.status.Rejected + '20' }}>
                        <Typography variant="h6" gutterBottom>
                          Rejected
                        </Typography>
                        <Typography variant="h4">{clientStatusData.rejected}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Solution Options Distribution" />
                <CardContent>
                  <Box sx={{ height: DEFAULT_CHART_HEIGHT }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart aria-label="Solution Options Distribution Chart">
                        <Pie
                          data={fitGapChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                          role="img"
                          aria-label="Solution options distribution"
                        >
                          {fitGapChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getCellColor(entry, 'fitgap')} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      )}
    </Box>
  );
};

export default Dashboard;