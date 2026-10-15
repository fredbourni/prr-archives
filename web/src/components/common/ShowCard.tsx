import { Card, CardContent, CardMedia, Typography, Box, Chip, IconButton, LinearProgress, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import { frCA } from 'date-fns/locale';
import type { Show } from '@types';
import { formatDuration } from '@utils/format';
import { getShowImage } from '@utils/image';

interface ShowCardProps {
  show: Show;
  isSelected?: boolean;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
  onRemove?: () => void;
  progress?: { position: number; duration: number; completed: boolean };
}

export const ShowCard = ({ show, isSelected = false, onClick, onTagClick, onRemove, progress }: ShowCardProps) => {
  return (
    <Tooltip title={`Publié le ${format(new Date(show.created_time), 'd MMMM yyyy', { locale: frCA })}`} arrow>
    <Card
      sx={{
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'scale(1.02)' },
        ...(isSelected
          ? {
              border: 2,
              borderColor: 'primary.main',
              boxShadow: '0 0 12px 0 rgba(176, 190, 210, 0.4)',
            }
          : {}),
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="260"
          image={getShowImage(show.picture_key)}
          alt={show.name}
          loading="lazy"
          decoding="async"
          sx={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
        />
        {progress?.completed && (
          <CheckCircleIcon
            fontSize="medium"
            sx={{
              position: 'absolute',
              top: 6,
              left: 6,
              color: 'success.main',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
            }}
          />
        )}
        {onRemove && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
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
        {progress && progress.duration > 0 && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (progress.position / progress.duration) * 100)}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 4,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
              },
            }}
          />
        )}
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {show.tags.map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              clickable={!!onTagClick}
              onClick={(e) => {
                if (!onTagClick) return;
                e.stopPropagation();
                onTagClick(tag);
              }}
              sx={{ fontSize: '0.5rem' }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
    </Tooltip>
  );
};
