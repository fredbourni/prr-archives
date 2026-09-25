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
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import type { Show } from '@types';
import { getShowImage } from '@utils/image';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

export type Period = '1m' | '3m' | '6m' | '1y' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1A' },
    { value: 'all', label: 'Éternité' },
];

const getPeriodCutoff = (period: Period): Date | null => {
    if (period === 'all') return null;
    const cutoff = new Date();
    switch (period) {
        case '1m': cutoff.setMonth(cutoff.getMonth() - 1); break;
        case '3m': cutoff.setMonth(cutoff.getMonth() - 3); break;
        case '6m': cutoff.setMonth(cutoff.getMonth() - 6); break;
        case '1y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
    }
    return cutoff;
};

const getChartGrouping = (period: Period): 'week' | 'month' | 'year' => {
    switch (period) {
        case '1m':
        case '3m': return 'week';
        case '6m':
        case '1y': return 'month';
        case 'all': return 'year';
    }
};

const getBucket = (date: Date, grouping: 'week' | 'month' | 'year'): { key: string; label: string } => {
    switch (grouping) {
        case 'week': {
            const d = new Date(date);
            const day = d.getDay();
            const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
            d.setDate(d.getDate() + diff);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            // ISO week number
            const thursday = new Date(d);
            thursday.setDate(d.getDate() + 3);
            const isoYear = thursday.getFullYear();
            const firstThursday = new Date(isoYear, 0, 4);
            const weekNum = Math.ceil(((thursday.getTime() - firstThursday.getTime()) / 86400000 + firstThursday.getDay() + 1) / 7);
            return { key, label: `S${weekNum} ${isoYear}` };
        }
        case 'month': {
            return {
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                label: date.toLocaleDateString('fr-FR', { month: 'long' }),
            };
        }
        case 'year': {
            const key = String(date.getFullYear());
            return { key, label: key };
        }
    }
};

const nextBucketDate = (date: Date, grouping: 'week' | 'month' | 'year'): Date => {
    const d = new Date(date);
    switch (grouping) {
        case 'week': d.setDate(d.getDate() + 7); break;
        case 'month': d.setMonth(d.getMonth() + 1); break;
        case 'year': d.setFullYear(d.getFullYear() + 1); break;
    }
    return d;
};

const CHART_TITLE: Record<string, string> = {
    week: 'Épisodes et Minutes par semaine',
    month: 'Épisodes et Minutes par mois',
    year: 'Épisodes et Minutes par année',
};

interface StatsPageProps {
    shows: Show[];
    onBack: () => void;
    onCategoryClick: (category: string) => void;
    period: Period;
    onPeriodChange: (period: Period) => void;
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

export const StatsPage = ({ shows, onBack, onCategoryClick, period, onPeriodChange }: StatsPageProps) => {
    // Filter shows to the selected period
    const cutoff = getPeriodCutoff(period);
    const filteredShows = cutoff
        ? shows.filter((show) => new Date(show.created_time) >= cutoff)
        : shows;

    // All shows stats
    const totalSeconds = filteredShows.reduce((acc, show) => acc + show.audio_length, 0);
    const allStats = calculateStats(totalSeconds);
    const totalShows = filteredShows.length;

    // Per show stats
    const showsByCategory = filteredShows.reduce((acc, show) => {
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

    // Chart data, grouped according to the selected period
    const grouping = getChartGrouping(period);
    const chartStats = filteredShows.reduce((acc, show) => {
        const { key, label } = getBucket(new Date(show.created_time), grouping);
        if (!acc[key]) {
            acc[key] = { key, label, episodes: 0, minutes: 0 };
        }
        acc[key].episodes += 1;
        acc[key].minutes += Math.floor(show.audio_length / 60);
        return acc;
    }, {} as Record<string, { key: string; label: string; episodes: number; minutes: number }>);

    // Fill in missing buckets with 0 so the chart shows continuous periods
    const chartValues = Object.values(chartStats).sort((a, b) => a.key.localeCompare(b.key));
    const filledData: { key: string; label: string; episodes: number; minutes: number }[] = [];
    if (chartValues.length > 0) {
        const first = chartValues[0];
        const last = chartValues[chartValues.length - 1];
        // Reconstruct the start date from the first bucket key
        const [y, m, d] = first.key.split('-').map(Number);
        let cursor = new Date(y, (m || 1) - 1, d || 1);
        const endKey = last.key;
        const seen = new Set(chartValues.map((v) => v.key));
        while (true) {
            const { key, label } = getBucket(cursor, grouping);
            if (seen.has(key)) {
                filledData.push(chartStats[key]);
            } else {
                filledData.push({ key, label, episodes: 0, minutes: 0 });
            }
            if (key === endKey) break;
            cursor = nextBucketDate(cursor, grouping);
        }
    }

    const chartData = filledData;

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
                <Typography variant="h4" component="h1" sx={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                    <AssessmentIcon fontSize="large" color="primary" />
                    Statistiques
                </Typography>
                <ToggleButtonGroup
                    value={period}
                    exclusive
                    size="small"
                    onChange={(_, value: Period | null) => {
                        if (value) onPeriodChange(value);
                    }}
                    sx={{
                        '& .MuiToggleButton-root': {
                            px: 1.5,
                            py: 0.5,
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            borderRadius: '999px !important',
                            border: '1px solid rgba(255,255,255,0.12) !important',
                            textTransform: 'none',
                        },
                    }}
                >
                    {PERIOD_OPTIONS.map((opt) => (
                        <ToggleButton key={opt.value} value={opt.value}>
                            {opt.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
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
                        <StatCard label="Épisodes" value={totalShows.toLocaleString()} icon={<LibraryMusicIcon color="primary" />} />
                    </Grid>
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

            {/* Combined Chart */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 6,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                    {CHART_TITLE[grouping]}
                </Typography>
                <Box sx={{ height: 400, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke="rgba(255,255,255,0.5)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#1976d2"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                label={{ value: 'Épisodes', angle: -90, position: 'insideLeft', offset: -10, fill: '#1976d2', fontSize: 12 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#ed6c02"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                label={{ value: 'Minutes', angle: 90, position: 'insideRight', offset: -10, fill: '#ed6c02', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e1e1e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="episodes"
                                name="Épisodes"
                                stroke="#1976d2"
                                strokeWidth={3}
                                dot={{ fill: '#1976d2', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="minutes"
                                name="Minutes"
                                stroke="#ed6c02"
                                strokeWidth={3}
                                dot={{ fill: '#ed6c02', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
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
                                                fontSize: '1rem',
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
