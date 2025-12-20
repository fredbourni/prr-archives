import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Link,
} from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import RadioIcon from '@mui/icons-material/Radio';
import GitHubIcon from '@mui/icons-material/GitHub';
import IconButton from '@mui/material/IconButton';
import { ShowList } from '@components/shows/ShowList';
import { useShows } from '@hooks/useShows';
import { StatsPage } from '@components/stats/StatsPage';
import { useState, useEffect } from 'react';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blueGrey[200],
    },
    secondary: {
      main: blueGrey[800],
    },
    background: {
      default: '#131313ff',
      paper: '#111111ff',
    },
  },
});

function App() {
  const { shows } = useShows();
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowStats(params.get('stats') === '1');
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setShowStats(params.get('stats') === '1');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStatsClick = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('stats', '1');
    window.history.pushState({}, '', `?${params.toString()}`);
    setShowStats(true);
  };

  const handleBackFromStats = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('stats');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setShowStats(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ justifyContent: 'flex-start' }}>
              <Link
                href={window.location.origin + window.location.pathname}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <RadioIcon sx={{ fontSize: '2rem' }} />
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  ARCHIVES PUNKROCKRADIO.CA
                </Typography>
              </Link>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton
                color="inherit"
                href="https://github.com/fredbourni/prr-archives"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <GitHubIcon fontSize="large" />
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4, width: '100%' }}>
          {showStats ? (
            <StatsPage shows={shows} onBack={handleBackFromStats} />
          ) : (
            <ShowList shows={shows} onStatsClick={handleStatsClick} />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
