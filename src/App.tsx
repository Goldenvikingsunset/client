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
import RelationshipManager from './components/masterdata/RelationshipManager';

// Admin Components
import UsersList from './components/users/UsersList';
import DepartmentManager from './components/admin/DepartmentManager';
import AreaManager from './components/admin/AreaManager';

// Context
import { AuthProvider } from './context/AuthContext';

// Utilities
import { isAuthenticated, hasRole } from './utils/auth';

// Route wrappers for protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated() || !hasRole('Admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Redirect root to dashboard if authenticated */}
            <Route path="/" element={
              isAuthenticated() 
                ? <Navigate to="/dashboard" replace /> 
                : <Navigate to="/login" replace />
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
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
                <Route index element={<Navigate to="/master-data/relationships" />} />
                <Route path="relationships" element={
                  <AdminRoute>
                    <RelationshipManager />
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
              </Route>
              
              {/* Admin Routes */}
              <Route path="admin">
                <Route index element={<Navigate to="/admin/users" />} />
                <Route path="users" element={
                  <AdminRoute>
                    <UsersList />
                  </AdminRoute>
                } />
                <Route path="departments" element={
                  <AdminRoute>
                    <DepartmentManager />
                  </AdminRoute>
                } />
                <Route path="areas" element={
                  <AdminRoute>
                    <AreaManager />
                  </AdminRoute>
                } />
              </Route>
            </Route>
            
            {/* Catch all unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
