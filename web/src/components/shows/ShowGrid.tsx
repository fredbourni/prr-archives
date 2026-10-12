import { Grid, Typography, Box } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import type { Show } from '@types';
import { ShowCard } from '../common/ShowCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { useState, useEffect } from 'react';
import { BATCH_SIZE } from '@constants';

interface ShowGridProps {
    shows: Show[];
    onShowClick: (show: Show) => void;
    selectedShowSlug: string | null;
    onTagClick?: (tag: string) => void;
    onResetFilters?: () => void;
    onRemoveShow?: (show: Show) => void;
    progressMap?: Map<string, { position: number; duration: number; completed: boolean }>;
}

const EmptyState = ({ onReset }: { onReset?: () => void }) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            gap: 2,
            textAlign: 'center',
        }}
    >
        <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Aucun show ne correspond à vos filtres
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Essayez de modifier ou de réinitialiser les filtres.
            </Typography>
        </Box>
        {onReset && (
            <Box
                component="button"
                onClick={onReset}
                sx={{
                    bgcolor: 'background.paper',
                    color: 'primary.main',
                    border: 1,
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: 'rgba(176, 190, 210, 0.08)' },
                }}
            >
                Réinitialiser les filtres
            </Box>
        )}
    </Box>
);

export const ShowGrid = ({ shows, onShowClick, selectedShowSlug, onTagClick, onResetFilters, onRemoveShow, progressMap }: ShowGridProps) => {
    const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);

    // Reset displayed count when shows change
    useEffect(() => {
        setDisplayedCount(BATCH_SIZE);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [shows]);

    const handleLoadMore = () => {
        setDisplayedCount((prev: number) => Math.min(prev + BATCH_SIZE, shows.length));
    };

    const observerTarget = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore: displayedCount < shows.length,
    });

    if (shows.length === 0) {
        return <EmptyState onReset={onResetFilters} />;
    }

    const visibleShows = shows.slice(0, displayedCount);

    return (
        <>
            <Grid container spacing={2} sx={{ width: '100%' }}>
                {visibleShows.map((show) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }} key={show.slug}>
                        <ShowCard
                            show={show}
                            isSelected={show.slug === selectedShowSlug}
                            onTagClick={onTagClick}
                            onRemove={onRemoveShow ? () => onRemoveShow(show) : undefined}
                            progress={progressMap?.get(show.slug)}
                            onClick={() => {
                                onShowClick(show);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </Grid>
                ))}
            </Grid>

            {displayedCount < shows.length && (
                <div ref={observerTarget}>
                    <LoadingSpinner />
                </div>
            )}
        </>
    );
};
