import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const ProgressBarWithLabel = ({ value, total }) => {
  const progress = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: progress === 100 ? 'success.main' : 'primary.main',
            },
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(progress)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressBarWithLabel;