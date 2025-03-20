import React from 'react';
import GenericMasterDataPage from './GenericMasterDataPage';
import { statuses } from '../../services/masterDataService';

const StatusesPage: React.FC = () => {
  return (
    <GenericMasterDataPage
      title="Statuses"
      entityName="Status"
      service={statuses}
      idField="status_id"
    />
  );
};

export default StatusesPage; 