import { Box, Button, Tooltip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useState } from 'react';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ShareIcon from '@mui/icons-material/Share';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import type { SortOrder } from '@hooks/useFilters';
import { TextFilter } from './TextFilter';
import { CategoryFilter } from './CategoryFilter';
import { YearFilter } from './YearFilter';
import { SortFilter } from './SortFilter';
import { TagFilter } from './TagFilter';
import { SNACKBAR_AUTO_HIDE_DURATION } from '@constants';

interface FilterBarProps {
  search: string;
  categoryFilter: string;
  yearFilter: string;
  sortOrder: SortOrder;
  categories: string[];
  years: (string | number)[];
  tags: string[];
  tagFilter: string[];
  categoryImages: Map<string, string>;
  recentlyPlayedOnly: boolean;
  recentlyPlayedCount: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSortChange: (value: SortOrder) => void;
  onTagChange: (value: string[]) => void;
  onRecentlyPlayedToggle: () => void;
  onClearRecentlyPlayed: () => void;
  onRandomClick: () => void;
  onStatsClick: () => void;
}

export const FilterBar = ({
  search,
  categoryFilter,
  yearFilter,
  sortOrder,
  categories,
  years,
  tags,
  tagFilter,
  categoryImages,
  recentlyPlayedOnly,
  recentlyPlayedCount,
  onSearchChange,
  onCategoryChange,
  onYearChange,
  onSortChange,
  onTagChange,
  onRecentlyPlayedToggle,
  onClearRecentlyPlayed,
  onRandomClick,
  onStatsClick,
}: FilterBarProps) => {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleCopyPermalink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowCopiedMessage(true);
    } catch (err) {
      console.error('Failed to copy permalink:', err);
    }
  };

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
        <CategoryFilter
          value={categoryFilter}
          categories={categories}
          categoryImages={categoryImages}
          onChange={onCategoryChange}
        />
        <TextFilter value={search} onChange={onSearchChange} />
        <YearFilter value={yearFilter} years={years} onChange={onYearChange} />
        <SortFilter value={sortOrder} onChange={onSortChange} />
        <TagFilter value={tagFilter} tags={tags} onChange={onTagChange} />
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Tooltip title="Écoutés récemment">
            <Button
              variant="contained"
              onClick={onRecentlyPlayedToggle}
              color={recentlyPlayedOnly ? 'primary' : 'secondary'}
              size="small"
              sx={{ minWidth: 'auto', px: 2, height: { xs: '32px', sm: '40px' } }}
            >
              <HistoryIcon fontSize="small" />
            </Button>
          </Tooltip>
          {recentlyPlayedOnly && (
            <Tooltip title="Effacer l'historique">
              <span>
                <Button
                  variant="contained"
                  onClick={() => setShowClearDialog(true)}
                  color="secondary"
                  size="small"
                  disabled={recentlyPlayedCount === 0}
                  sx={{ minWidth: 'auto', px: 2, height: { xs: '32px', sm: '40px' } }}
                >
                  <DeleteSweepIcon fontSize="small" />
                </Button>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Voir les statistiques">
            <Button
              variant="contained"
              onClick={onStatsClick}
              color="secondary"
              size="small"
              sx={{ minWidth: 'auto', px: 2, height: { xs: '32px', sm: '40px' } }}
            >
              <AssessmentIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Jouer un épisode aléatoire basé sur les filtres">
            <Button
              variant="contained"
              onClick={onRandomClick}
              color="secondary"
              size="small"
              sx={{ minWidth: 'auto', px: 2, height: { xs: '32px', sm: '40px' } }}
            >
              <ShuffleIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Copier le lien permanent">
            <Button
              variant="contained"
              onClick={handleCopyPermalink}
              color="secondary"
              size="small"
              sx={{ minWidth: 'auto', px: 2, height: { xs: '32px', sm: '40px' } }}
            >
              <ShareIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Snackbar
        open={showCopiedMessage}
        autoHideDuration={SNACKBAR_AUTO_HIDE_DURATION}
        onClose={() => setShowCopiedMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 90, sm: 24 } }}
      >
        <Alert
          onClose={() => setShowCopiedMessage(false)}
          severity="success"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          Lien permanent copié!
        </Alert>
      </Snackbar>

      <Dialog
        open={showClearDialog}
        onClose={() => setShowClearDialog(false)}
      >
        <DialogTitle>Effacer l'historique</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment effacer tous les épisodes écoutés récemment ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)} variant="contained" color="primary">
            Annuler
          </Button>
          <Button
            onClick={() => {
              onClearRecentlyPlayed();
              setShowClearDialog(false);
            }}
            variant="outlined"
            color="error"
            autoFocus
          >
            Effacer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
