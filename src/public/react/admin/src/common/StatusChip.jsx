import React from 'react';
import { Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledChip = styled(Chip)(({ theme, statuscolor }) => ({
  fontWeight: 600,
  ...(statuscolor === 'success' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  }),
  ...(statuscolor === 'warning' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(statuscolor === 'error' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
  ...(statuscolor === 'default' && {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[800],
  }),
}));

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'success';
    case 'pending':
    case 'in_progress':
      return 'warning';
    case 'cancelled':
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const StatusChip = ({ status, label, ...props }) => {
  const statusColor = getStatusColor(status);
  const displayLabel = label || status;
  
  return (
    <StyledChip
      label={displayLabel}
      statuscolor={statusColor}
      {...props}
    />
  );
};

export default StatusChip;