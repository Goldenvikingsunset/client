import React from 'react';
import { Chip, styled } from '@mui/material';
import { PRIORITY_COLORS, STATUS_COLORS, FITGAP_COLORS } from '../../theme/constants';

type ChipType = 'priority' | 'status' | 'fitgap';

interface StatusChipProps {
  label: string;
  type: ChipType;
  size?: 'small' | 'medium';
}

interface StyledChipProps {
  colormain: string;
  colorbg: string;
}

const StyledChip = styled(Chip)<StyledChipProps>(({ colormain, colorbg }) => ({
  backgroundColor: colorbg,
  color: colormain,
  borderColor: colormain,
  '&:hover': {
    backgroundColor: colorbg,
  },
}));

const getChipColors = (type: ChipType, label: string) => {
  switch (type) {
    case 'priority':
      return PRIORITY_COLORS[label as keyof typeof PRIORITY_COLORS] || { main: '#757575', bg: '#f5f5f5' };
    case 'status':
      return STATUS_COLORS[label as keyof typeof STATUS_COLORS] || { main: '#757575', bg: '#f5f5f5' };
    case 'fitgap':
      const isGap = label.toLowerCase().includes('gap');
      return isGap ? FITGAP_COLORS['Gap'] : FITGAP_COLORS['Fit'];
  }
};

export const StatusChip: React.FC<StatusChipProps> = ({ label, type, size = 'small' }) => {
  const colors = getChipColors(type, label);

  return (
    <StyledChip
      label={label}
      size={size}
      variant="outlined"
      colormain={colors.main}
      colorbg={colors.bg}
    />
  );
};