import { Box, CircularProgress } from '@mui/material';

interface LoadingSpinnerProps {
  color?: 'primary' | 'secondary' | 'inherit';
}

export const LoadingSpinner = ({ color = 'secondary' }: LoadingSpinnerProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        p: 4,
        width: '100%',
      }}
    >
      <CircularProgress color={color} />
    </Box>
  );
};
