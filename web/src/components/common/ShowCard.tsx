import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import { format } from 'date-fns';
import type { Show } from '@types';
import { formatDuration } from '@utils/format';
import { getShowImage } from '@utils/image';

interface ShowCardProps {
  show: Show;
  onClick: () => void;
}

export const ShowCard = ({ show, onClick }: ShowCardProps) => {
  return (
    <Card
      sx={{
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.02)' },
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia component="img" height="260" image={getShowImage(show.picture_key)} alt={show.name} />
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          {formatDuration(show.audio_length)}
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          sx={{ fontSize: '1rem', lineHeight: 1.2 }}
        >
          {show.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {format(new Date(show.created_time), 'MMM d, yyyy')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {show.tags.map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.5rem' }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
