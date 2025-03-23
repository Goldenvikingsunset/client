import React from 'react';
import GenericMasterDataPage from './GenericMasterDataPage';
import { bcDepartments } from '../../services/masterDataService';

const BCDepartmentsPage: React.FC = () => {
  return (
    <GenericMasterDataPage
      title="BC Departments"
      entityName="Department"
      service={bcDepartments}
      idField="id"
    />
  );
};

export default BCDepartmentsPage;