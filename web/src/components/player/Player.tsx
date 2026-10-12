import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { PLAYER_HEIGHT, MIXCLOUD_USER, DEBUG_PLAYER } from '@constants';

// eslint-disable-next-line no-console
const debug = (...args: unknown[]) => { if (DEBUG_PLAYER) console.log('[Player]', ...args); };

interface PlayerProps {
    showSlug: string;
    initialPosition?: number;
    onPlay?: () => void;
    onPause?: (position: number, duration: number) => void;
    onEnded?: () => void;
    onProgress?: (position: number, duration: number) => void;
}

interface MixcloudMessage {
    type: string;
    mixcloud?: string;
    data?: { eventName?: string; args?: unknown[]; methods?: string[]; events?: string[] };
}

export const Player = ({
    showSlug,
    initialPosition = 0,
    onPlay,
    onPause,
    onEnded,
    onProgress,
}: PlayerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Keep latest callbacks in a ref so the message listener (registered once
    // per show) always invokes the freshest closures without re-registering.
    const callbacksRef = useRef({ onPlay, onPause, onEnded, onProgress });
    useEffect(() => {
        callbacksRef.current = { onPlay, onPause, onEnded, onProgress };
    });

    // Capture the initial position at mount time so the effect only re-runs
    // when the show changes, not when progress updates change initialPosition.
    const initialPositionRef = useRef(initialPosition);
    useEffect(() => {
        initialPositionRef.current = initialPosition;
    });

    // Mixcloud widget URL format
    // The feed parameter should be the full path: /user/slug/
    const feedPath = `/${MIXCLOUD_USER}/${showSlug}/`;
    const encodedFeed = encodeURIComponent(feedPath);
    const src = `https://www.mixcloud.com/widget/iframe/?feed=${encodedFeed}&hide_cover=1&light=0`;

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        let cancelled = false;
        let seeked = false;

        // Track the latest position/duration from progress events so the
        // pause handler can report accurate values.
        let lastPosition = 0;
        let lastDuration = 0;

        const handleMessage = (event: MessageEvent) => {
            if (cancelled) return;

            const sourceMatch = event.source === iframe.contentWindow;
            debug('message event, source match:', sourceMatch, 'data:', event.data);

            if (!sourceMatch) return;

            let msg: MixcloudMessage;
            try {
                msg = JSON.parse(event.data);
            } catch {
                return;
            }
            debug('parsed message:', msg);

            if (msg.mixcloud !== 'playerWidget') return;

            switch (msg.type) {
                case 'ready':
                    // Request the API (methods + events list). The iframe
                    // will respond with an 'api' message.
                    iframe.contentWindow?.postMessage(
                        JSON.stringify({ type: 'getApi', mixcloud: 'playerWidget' }),
                        '*'
                    );
                    break;
                case 'api':
                    // Seek to the saved position once the widget is ready.
                    if (!seeked) {
                        seeked = true;
                        const savedPosition = initialPositionRef.current;
                        if (savedPosition > 0) {
                            iframe.contentWindow?.postMessage(
                                JSON.stringify({
                                    type: 'method',
                                    data: {
                                        methodId: 1,
                                        methodName: 'seek',
                                        args: [savedPosition],
                                    },
                                    mixcloud: 'playerWidget',
                                }),
                                '*'
                            );
                        }
                    }
                    break;
                case 'event': {
                    const eventData = msg.data as { eventName?: string; args?: unknown[] } | undefined;
                    const eventName = eventData?.eventName;
                    const args = eventData?.args ?? [];

                    if (eventName === 'play') {
                        debug('>>> PLAY EVENT FIRED');
                        callbacksRef.current.onPlay?.();
                    } else if (eventName === 'pause') {
                        debug('>>> PAUSE EVENT FIRED');
                        callbacksRef.current.onPause?.(lastPosition, lastDuration);
                    } else if (eventName === 'ended') {
                        debug('>>> ENDED EVENT FIRED');
                        callbacksRef.current.onEnded?.();
                    } else if (eventName === 'progress') {
                        // Progress event passes (position, duration) as args.
                        const position = Number(args[0] ?? 0);
                        const duration = Number(args[1] ?? 0);
                        lastPosition = position;
                        lastDuration = duration;
                        callbacksRef.current.onProgress?.(position, duration);
                    }
                    break;
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            cancelled = true;
            window.removeEventListener('message', handleMessage);
        };
    }, [showSlug]);

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
                ref={iframeRef}
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
