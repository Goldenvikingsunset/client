import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import BCDepartmentList from '../components/bcdata/BCDepartmentList';
import { RequireAuth } from '../components/auth/RequireAuth';

export interface RouteProps {
  path: string;
  element: React.ReactNode;
  requiredRole?: string;
}

const Routes: React.FC = () => {
  return (
    <RouterRoutes>
      <Route
        path="/admin/bc-departments"
        element={
          <RequireAuth requiredRole="Admin">
            <BCDepartmentList />
          </RequireAuth>
        }
      />
      {/* ...existing routes... */}
    </RouterRoutes>
  );
};

export default Routes;
