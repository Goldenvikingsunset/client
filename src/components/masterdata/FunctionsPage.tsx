import React from 'react';
import GenericMasterDataPage from './GenericMasterDataPage';
import { functions } from '../../services/masterDataService';

const FunctionsPage: React.FC = () => {
  return (
    <GenericMasterDataPage
      title="Functions"
      entityName="Function"
      service={functions}
      idField="function_id"
    />
  );
};

export default FunctionsPage; 