import { Grid } from '@mui/material';
import type { Show } from '@types';
import { ShowCard } from '../common/ShowCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { useState, useEffect } from 'react';
import { BATCH_SIZE } from '@constants';

interface ShowGridProps {
    shows: Show[];
    onShowClick: (show: Show) => void;
}

export const ShowGrid = ({ shows, onShowClick }: ShowGridProps) => {
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

    const visibleShows = shows.slice(0, displayedCount);

    return (
        <>
            <Grid container spacing={2} sx={{ width: '100%' }}>
                {visibleShows.map((show) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }} key={show.slug}>
                        <ShowCard
                            show={show}
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
