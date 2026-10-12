import { Box, Typography } from '@mui/material';
import { Player } from './Player';
import type { Show } from '@types';

interface PlayerHeaderProps {
  title: string;
  show: Show | null;
  initialPosition?: number;
  onPlay?: () => void;
  onPause?: (position: number, duration: number) => void;
  onEnded?: () => void;
  onProgress?: (position: number, duration: number) => void;
}

export const PlayerHeader = ({
  title,
  show,
  initialPosition,
  onPlay,
  onPause,
  onEnded,
  onProgress,
}: PlayerHeaderProps) => {
  if (!show) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
        {title}
      </Typography>
      <Player
        key={show.slug}
        showSlug={show.slug}
        initialPosition={initialPosition}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onProgress={onProgress}
      />
    </Box>
  );
};
