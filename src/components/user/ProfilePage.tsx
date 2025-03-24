import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getCurrentUser, setCurrentUser } from '../../utils/auth';
import { changePassword, updateProfile } from '../../services/userService';

const profileValidationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const passwordValidationSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

const ProfilePage: React.FC = () => {
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const user = getCurrentUser();
  
  const profileFormik = useFormik({
    initialValues: {
      username: user?.username || '',
      email: user?.email || '',
      role: user?.role || '',
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      try {
        setProfileSuccess(null);
        setProfileError(null);
        
        if (!user) return;
        
        const updatedUser = await updateProfile({
          username: values.username,
          email: values.email,
        });
        
        // Update local storage with new user data
        setCurrentUser({
          ...user,
          username: updatedUser.username,
          email: updatedUser.email,
        });
        
        setProfileSuccess('Profile updated successfully');
      } catch (err: any) {
        console.error('Error updating profile:', err);
        setProfileError(err.response?.data?.message || 'Failed to update profile');
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      try {
        setPasswordSuccess(null);
        setPasswordError(null);
        
        await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        
        setPasswordSuccess('Password changed successfully');
        passwordFormik.resetForm();
      } catch (err: any) {
        console.error('Error changing password:', err);
        setPasswordError(err.response?.data?.message || 'Failed to change password');
      }
    },
  });

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Not logged in</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      
      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: { xs: 3, md: 0 } }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {profileSuccess}
              </Alert>
            )}
            
            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}
            
            <form onSubmit={profileFormik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="username"
                    name="username"
                    label="Username"
                    value={profileFormik.values.username}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.username && Boolean(profileFormik.errors.username)}
                    helperText={profileFormik.touched.username && profileFormik.errors.username}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    value={profileFormik.values.email}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                    helperText={profileFormik.touched.email && profileFormik.errors.email}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="role"
                    name="role"
                    label="Role"
                    value={profileFormik.values.role}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={profileFormik.isSubmitting}
                  >
                    {profileFormik.isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
        
        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {passwordSuccess}
              </Alert>
            )}
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}
            
            <form onSubmit={passwordFormik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="currentPassword"
                    name="currentPassword"
                    label="Current Password"
                    type="password"
                    value={passwordFormik.values.currentPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                    helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="newPassword"
                    name="newPassword"
                    label="New Password"
                    type="password"
                    value={passwordFormik.values.newPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                    helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                  />
                </Grid>
                
                <Grid item xs={12}>
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
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={passwordFormik.isSubmitting}
                  >
                    {passwordFormik.isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;