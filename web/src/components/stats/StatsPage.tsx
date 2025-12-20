import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Avatar,
    Paper,
    Divider,
    Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import type { Show } from '@types';
import { getShowImage } from '@utils/image';

interface StatsPageProps {
    shows: Show[];
    onBack: () => void;
    onCategoryClick: (category: string) => void;
}

interface ShowStats {
    seconds: number;
    minutes: number;
    hours: number;
    days: number;
    weeks: number;
    months: number;
}

const calculateStats = (seconds: number): ShowStats => {
    const minutes = Math.floor(seconds / 60);
    const hours = Number((seconds / 3600).toFixed(1));
    const days = Number((seconds / (24 * 3600)).toFixed(1));
    const weeks = Number((seconds / (7 * 24 * 3600)).toFixed(1));
    const months = Number((seconds / (30 * 24 * 3600)).toFixed(1));

    return { seconds, minutes, hours, days, weeks, months };
};

export const StatsPage = ({ shows, onBack, onCategoryClick }: StatsPageProps) => {
    // All shows stats
    const totalSeconds = shows.reduce((acc, show) => acc + show.audio_length, 0);
    const allStats = calculateStats(totalSeconds);

    // Per show stats
    const showsByCategory = shows.reduce((acc, show) => {
        if (!acc[show.category]) {
            acc[show.category] = { shows: [], totalSeconds: 0 };
        }
        acc[show.category].shows.push(show);
        acc[show.category].totalSeconds += show.audio_length;
        return acc;
    }, {} as Record<string, { shows: Show[]; totalSeconds: number }>);

    const statsByShow = Object.entries(showsByCategory)
        .map(([category, data]) => ({
            category,
            stats: calculateStats(data.totalSeconds),
            image: getShowImage(data.shows[0]?.picture_key),
            count: data.shows.length,
        }))
        .sort((a, b) => b.stats.seconds - a.stats.seconds);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    sx={{ borderRadius: 2 }}
                >
                    Retour
                </Button>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                    <AssessmentIcon fontSize="large" color="primary" />
                    Statistiques
                </Typography>
            </Box>

            {/* Global Stats */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, md: 4 },
                    mb: 6,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #1e1e1e 0%, #111 100%)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}
            >
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                    Toutes les émissions
                </Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                        <StatCard label="Minutes" value={allStats.minutes.toLocaleString()} icon={<AvTimerIcon color="info" />} />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                        <StatCard label="Heures" value={allStats.hours.toLocaleString()} icon={<AccessTimeIcon color="primary" />} />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                        <StatCard label="Jours" value={allStats.days.toLocaleString()} icon={<DateRangeIcon color="secondary" />} />
                    </Grid>
                    {allStats.weeks >= 1 && (
                        <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                            <StatCard label="Semaines" value={allStats.weeks.toLocaleString()} icon={<DateRangeIcon color="success" />} />
                        </Grid>
                    )}
                    {allStats.months >= 1 && (
                        <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                            <StatCard label="Mois" value={allStats.months.toLocaleString()} icon={<CalendarMonthIcon color="warning" />} />
                        </Grid>
                    )}
                </Grid>
            </Paper>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Par Émission</Typography>
            <Grid container spacing={3}>
                {statsByShow.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.category}>
                        <Card
                            elevation={0}
                            onClick={() => onCategoryClick(item.category)}
                            sx={{
                                height: '100%',
                                borderRadius: 3,
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.2s ease-in-out',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'primary.main'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar
                                        src={item.image}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    />
                                    <Box sx={{ overflow: 'hidden' }}>
                                        <Typography
                                            variant="h6"
                                            noWrap
                                            sx={{
                                                fontWeight: 'bold',
                                                lineHeight: 1.2,
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {item.category}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">{item.count} épisodes</Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ mb: 2, opacity: 0.1 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <StatRow label="Minutes" value={item.stats.minutes.toLocaleString()} />
                                    <StatRow label="Heures" value={item.stats.hours.toLocaleString()} />
                                    {item.stats.days >= 1 && <StatRow label="Jours" value={item.stats.days.toLocaleString()} />}
                                    {item.stats.weeks >= 1 && <StatRow label="Semaines" value={item.stats.weeks.toLocaleString()} />}
                                    {item.stats.months >= 1 && <StatRow label="Mois" value={item.stats.months.toLocaleString()} />}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
    <Box sx={{ p: 1, textAlign: 'center' }}>
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
            {import.meta.env.DEV ? icon : (icon as any)}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {value}
        </Typography>
        <Typography
            variant="caption"
            color="text.secondary"
            sx={{
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                fontSize: '0.7rem',
                fontWeight: 'bold'
            }}
        >
            {label}
        </Typography>
    </Box>
);

const StatRow = ({ label, value }: { label: string; value: string }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{value}</Typography>
    </Box>
);
