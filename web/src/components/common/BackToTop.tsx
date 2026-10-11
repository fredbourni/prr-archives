import { useState, useEffect } from 'react';
import { Fab, Fade } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const SCROLL_THRESHOLD = 400;

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > SCROLL_THRESHOLD);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Fade in={visible}>
      <Fab
        color="primary"
        size="medium"
        onClick={handleClick}
        aria-label="Retour en haut"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Fade>
  );
};
