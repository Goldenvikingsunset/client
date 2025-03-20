import React from 'react';
import GenericMasterDataPage from './GenericMasterDataPage';
import { fitGapStatuses } from '../../services/masterDataService';

const FitGapStatusesPage: React.FC = () => {
  return (
    <GenericMasterDataPage
      title="Fit/Gap Statuses"
      entityName="Fit/Gap Status"
      service={fitGapStatuses}
      idField="fitgap_id"
    />
  );
};

export default FitGapStatusesPage; 