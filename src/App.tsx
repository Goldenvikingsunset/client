import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Layout
import MainLayout from './components/layout/MainLayout';

// Main Components
import Dashboard from './components/dashboard/Dashboard';
import RequirementsList from './components/requirements/RequirementsList';
import RequirementDetail from './components/requirements/RequirementDetail';
import RequirementForm from './components/requirements/RequirementForm';
import BulkImport from './components/requirements/BulkImport';
import ProfilePage from './components/user/ProfilePage';

// Master Data Components
import ModulesPage from './components/masterdata/ModulesPage';
import SubModulesPage from './components/masterdata/SubModulesPage';
import FunctionsPage from './components/masterdata/FunctionsPage';
import PrioritiesPage from './components/masterdata/PrioritiesPage';
import StatusesPage from './components/masterdata/StatusesPage';
import FitGapStatusesPage from './components/masterdata/FitGapStatusesPage';
import SolutionOptionsPage from './components/masterdata/SolutionOptionsPage';
import BCDepartmentsPage from './components/masterdata/BCDepartmentsPage';

// User Management
import UsersList from './components/users/UsersList';

// Auth Utils
import { isAuthenticated, getCurrentUser } from './utils/auth';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check auth status when app loads
    const user = getCurrentUser();
    setLoading(false);
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  // Admin route component
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const user = getCurrentUser();
    if (!isAuthenticated() || !user || user.role !== 'Admin') {
      return <Navigate to="/dashboard" />;
    }
    return <>{children}</>;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Main Application Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            
            {/* Requirements Routes */}
            <Route path="requirements">
              <Route index element={<RequirementsList />} />
              <Route path="view/:id" element={<RequirementDetail />} />
              <Route path="create" element={<RequirementForm />} />
              <Route path="edit/:id" element={<RequirementForm />} />
              <Route path="import" element={<BulkImport />} />
            </Route>
            
            {/* Master Data Routes - Admin Only */}
            <Route path="master-data">
              <Route index element={<Navigate to="/master-data/modules" />} />
              <Route path="modules" element={
                <AdminRoute>
                  <ModulesPage />
                </AdminRoute>
              } />
              <Route path="submodules" element={
                <AdminRoute>
                  <SubModulesPage />
                </AdminRoute>
              } />
              <Route path="functions" element={
                <AdminRoute>
                  <FunctionsPage />
                </AdminRoute>
              } />
              <Route path="priorities" element={
                <AdminRoute>
                  <PrioritiesPage />
                </AdminRoute>
              } />
              <Route path="statuses" element={
                <AdminRoute>
                  <StatusesPage />
                </AdminRoute>
              } />
              <Route path="fitgap" element={
                <AdminRoute>
                  <FitGapStatusesPage />
                </AdminRoute>
              } />
              <Route path="solution-options" element={
                <AdminRoute>
                  <SolutionOptionsPage />
                </AdminRoute>
              } />
              <Route path="bc-departments" element={
                <AdminRoute>
                  <BCDepartmentsPage />
                </AdminRoute>
              } />
            </Route>
            
            {/* User Management Routes - Admin Only */}
            <Route path="users" element={
              <AdminRoute>
                <UsersList />
              </AdminRoute>
            } />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
