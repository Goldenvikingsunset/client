import React from 'react';
import GenericMasterDataPage from './GenericMasterDataPage';
import { priorities } from '../../services/masterDataService';

const PrioritiesPage: React.FC = () => {
  return (
    <GenericMasterDataPage
      title="Priorities"
      entityName="Priority"
      service={priorities}
      idField="priority_id"
    />
  );
};

export default PrioritiesPage; 