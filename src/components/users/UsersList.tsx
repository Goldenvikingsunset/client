import React, { useState, useEffect } from 'react';
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getAllUsers, createUser, updateUser, updateUserPassword, deleteUser } from '../../services/userService';
import { User } from '../../types';
import { hasRole } from '../../utils/auth';

// Define the role type to match the expected union type
type UserRole = 'Admin' | 'Consultant' | 'Client';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Validation schema for creating a user
  const createValidationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    email: Yup.string().email('Invalid email format').required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
    role: Yup.string().oneOf(['Admin', 'Consultant', 'Client'], 'Invalid role').required('Role is required'),
  });

  // Validation schema for editing a user
  const editValidationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    email: Yup.string().email('Invalid email format').required('Email is required'),
    role: Yup.string().oneOf(['Admin', 'Consultant', 'Client'], 'Invalid role').required('Role is required'),
  });

  // Validation schema for changing password
  const passwordValidationSchema = Yup.object({
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
  });

  // Form for creating a new user
  const createFormik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
    },
    validationSchema: createValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setActionLoading(true);
        await createUser({
          username: values.username,
          email: values.email,
          password: values.password,
          role: values.role as UserRole,
        });
        setOpenCreateDialog(false);
        resetForm();
        fetchUsers();
      } catch (err: any) {
        console.error('Error creating user:', err);
        setError(err.response?.data?.message || 'Failed to create user');
      } finally {
        setActionLoading(false);
      }
    },
  });

  // Form for editing a user
  const editFormik = useFormik({
    initialValues: {
      username: '',
      email: '',
      role: '',
    },
    validationSchema: editValidationSchema,
    onSubmit: async (values) => {
      if (!currentUser) return;
      
      try {
        setActionLoading(true);
        await updateUser(currentUser.user_id, {
          username: values.username,
          email: values.email,
          role: values.role as UserRole,
        });
        setOpenEditDialog(false);
        fetchUsers();
      } catch (err: any) {
        console.error('Error updating user:', err);
        setError(err.response?.data?.message || 'Failed to update user');
      } finally {
        setActionLoading(false);
      }
    },
  });

  // Form for changing password
  const passwordFormik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!currentUser) return;
      
      try {
        setActionLoading(true);
        await updateUserPassword(currentUser.user_id, values.password);
        setOpenPasswordDialog(false);
        resetForm();
      } catch (err: any) {
        console.error('Error updating password:', err);
        setError(err.response?.data?.message || 'Failed to update password');
      } finally {
        setActionLoading(false);
      }
    },
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllUsers();
      setUsers(response);
      setTotalCount(response.length);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle opening edit dialog
  const handleOpenEditDialog = (user: User) => {
    setCurrentUser(user);
    editFormik.setValues({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setOpenEditDialog(true);
  };

  // Handle opening password change dialog
  const handleOpenPasswordDialog = (user: User) => {
    setCurrentUser(user);
    passwordFormik.resetForm();
    setOpenPasswordDialog(true);
  };

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (user: User) => {
    setCurrentUser(user);
    setOpenDeleteDialog(true);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      setActionLoading(true);
      await deleteUser(currentUser.user_id);
      setOpenDeleteDialog(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get role color for chip
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'Consultant':
        return 'primary';
      case 'Client':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            User Management
          </Typography>
          
          {hasRole('Admin') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              New User
            </Button>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created At</TableCell>
                {hasRole('Admin') && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={hasRole('Admin') ? 5 : 4} align="center">
                    <CircularProgress size={30} sx={{ my: 3 }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasRole('Admin') ? 5 : 4} align="center">
                    <Typography variant="body1" sx={{ my: 3 }}>
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={getRoleColor(user.role) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleString()}
                    </TableCell>
                    {hasRole('Admin') && (
                      <TableCell align="right">
                        <Tooltip title="Edit User">
                          <IconButton 
                            color="primary"
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Change Password">
                          <IconButton 
                            color="secondary"
                            onClick={() => handleOpenPasswordDialog(user)}
                          >
                            <KeyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            color="error"
                            onClick={() => handleOpenDeleteDialog(user)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
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
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
        
        {/* Create User Dialog */}
        <Dialog 
          open={openCreateDialog} 
          onClose={() => setOpenCreateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={createFormik.handleSubmit}>
            <DialogTitle>Create New User</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  value={createFormik.values.username}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.username && Boolean(createFormik.errors.username)}
                  helperText={createFormik.touched.username && createFormik.errors.username}
                />
                
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={createFormik.values.email}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.email && Boolean(createFormik.errors.email)}
                  helperText={createFormik.touched.email && createFormik.errors.email}
                />
                
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={createFormik.values.password}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.password && Boolean(createFormik.errors.password)}
                  helperText={createFormik.touched.password && createFormik.errors.password}
                />
                
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={createFormik.values.confirmPassword}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={createFormik.touched.confirmPassword && Boolean(createFormik.errors.confirmPassword)}
                  helperText={createFormik.touched.confirmPassword && createFormik.errors.confirmPassword}
                />
                
                <FormControl fullWidth error={createFormik.touched.role && Boolean(createFormik.errors.role)}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={createFormik.values.role}
                    label="Role"
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Consultant">Consultant</MenuItem>
                    <MenuItem value="Client">Client</MenuItem>
                  </Select>
                  {createFormik.touched.role && createFormik.errors.role && (
                    <FormHelperText>{createFormik.errors.role}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setOpenCreateDialog(false)} 
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        
        {/* Edit User Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={editFormik.handleSubmit}>
            <DialogTitle>Edit User</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  value={editFormik.values.username}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.username && Boolean(editFormik.errors.username)}
                  helperText={editFormik.touched.username && editFormik.errors.username}
                />
                
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={editFormik.values.email}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={editFormik.touched.email && Boolean(editFormik.errors.email)}
                  helperText={editFormik.touched.email && editFormik.errors.email}
                />
                
                <FormControl fullWidth error={editFormik.touched.role && Boolean(editFormik.errors.role)}>
                  <InputLabel id="edit-role-label">Role</InputLabel>
                  <Select
                    labelId="edit-role-label"
                    id="role"
                    name="role"
                    value={editFormik.values.role}
                    label="Role"
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Consultant">Consultant</MenuItem>
                    <MenuItem value="Client">Client</MenuItem>
                  </Select>
                  {editFormik.touched.role && editFormik.errors.role && (
                    <FormHelperText>{editFormik.errors.role}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setOpenEditDialog(false)} 
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        
        {/* Change Password Dialog */}
        <Dialog 
          open={openPasswordDialog} 
          onClose={() => setOpenPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={passwordFormik.handleSubmit}>
            <DialogTitle>Change Password</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                {currentUser ? `Change password for user: ${currentUser.username}` : ''}
              </DialogContentText>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="New Password"
                  type="password"
                  value={passwordFormik.values.password}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.password && Boolean(passwordFormik.errors.password)}
                  helperText={passwordFormik.touched.password && passwordFormik.errors.password}
                />
                
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                  helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setOpenPasswordDialog(false)} 
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        
        {/* Delete User Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the user: {currentUser?.username}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDeleteDialog(false)} 
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser} 
              color="error" 
              disabled={actionLoading}
              autoFocus
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default UsersList; 