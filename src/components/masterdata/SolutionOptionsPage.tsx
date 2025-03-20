import React from 'react';
import GenericMasterDataPage from './GenericMasterDataPage';
import { solutionOptions } from '../../services/masterDataService';

const SolutionOptionsPage: React.FC = () => {
  return (
    <GenericMasterDataPage
      title="Solution Options"
      entityName="Solution Option"
      service={solutionOptions}
      idField="option_id"
    />
  );
};

export default SolutionOptionsPage; 