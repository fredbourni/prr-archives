import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import RadioIcon from '@mui/icons-material/Radio';
import { ShowList } from '@components/shows/ShowList';
import { useShows } from '@hooks/useShows';

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

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ justifyContent: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <RadioIcon sx={{ fontSize: '2rem' }} />
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  ARCHIVES PUNKROCKRADIO.CA
                </Typography>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4, width: '100%' }}>
          <ShowList shows={shows} />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
