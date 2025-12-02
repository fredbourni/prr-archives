import { Box, Typography } from '@mui/material';
import { Player } from './Player';
import type { Show } from '@types';

interface PlayerHeaderProps {
  title: string;
  show: Show | null;
}

export const PlayerHeader = ({ title, show }: PlayerHeaderProps) => {
  if (!show) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
        {title}
      </Typography>
      <Player showSlug={show.slug} />
    </Box>
  );
};
