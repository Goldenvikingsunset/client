import React, { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { resetPassword } from '../../services/authService';

const validationSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!token) {
        setError('Reset token is missing');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        
        const response = await resetPassword({
          token,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });
        
        setSuccess(response.message || 'Password has been reset successfully.');
        
        // Redirect to login page after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        console.error('Password reset error:', err);
        setError(err.response?.data?.message || 'Failed to reset password');
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (!token) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              Error
            </Typography>
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              Password reset token is missing or invalid.
            </Alert>
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="contained"
              color="primary"
              fullWidth
            >
              Request New Reset Link
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Business Central RTM
          </Typography>
          
          <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
            Reset Password
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
              {success} Redirecting to login page...
            </Alert>
          )}
          
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
              helperText={formik.touched.newPassword && formik.errors.newPassword}
              disabled={!!success}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              disabled={!!success}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !!success}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
            <Grid container justifyContent="center">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Back to Sign In
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword; 