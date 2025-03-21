import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasRole } from '../../utils/auth';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: "Admin" | "Consultant" | "Client";
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token');
  const hasRequiredRole = requiredRole ? hasRole(requiredRole) : true;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Add default export to ensure file is treated as a module
export default RequireAuth;
