import { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { PLAYER_HEIGHT, MIXCLOUD_USER } from '@constants';

interface PlayerProps {
    showSlug: string;
}

export const Player = ({ showSlug }: PlayerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentSlug, setCurrentSlug] = useState(showSlug);

    // Reset loading state when showSlug changes
    if (currentSlug !== showSlug) {
        setCurrentSlug(showSlug);
        setIsLoading(true);
    }

    // Mixcloud widget URL format
    // The feed parameter should be the full path: /user/slug/
    const feedPath = `/${MIXCLOUD_USER}/${showSlug}/`;
    const encodedFeed = encodeURIComponent(feedPath);
    const src = `https://www.mixcloud.com/widget/iframe/?feed=${encodedFeed}&hide_cover=1&light=0`;

    return (
        <Box sx={{ width: '100%', height: PLAYER_HEIGHT, mb: 3, position: 'relative' }}>
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.paper',
                        zIndex: 1,
                        borderRadius: 1,
                    }}
                >
                    <CircularProgress size={24} color="secondary" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        Chargement du player
                    </Typography>
                </Box>
            )}
            <iframe
                width="100%"
                height={PLAYER_HEIGHT}
                src={src}
                frameBorder="0"
                allow="autoplay"
                title="Mixcloud Player"
                onLoad={() => setIsLoading(false)}
            />
        </Box>
    );
};
