import React from 'react';
import GenericMasterDataPage from './GenericMasterDataPage';
import { subModules } from '../../services/masterDataService';

const SubModulesPage: React.FC = () => {
  return (
    <GenericMasterDataPage
      title="Submodules"
      entityName="Submodule"
      service={subModules}
      idField="submodule_id"
    />
  );
};

export default SubModulesPage; 