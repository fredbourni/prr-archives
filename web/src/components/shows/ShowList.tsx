import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import type { Show } from '@types';
import { useFilters } from '@hooks/useFilters';
import { useDebounce } from '@hooks/useDebounce';
import { usePermalink } from '@hooks/usePermalink';
import { FilterBar } from '../filters/FilterBar';
import { PlayerHeader } from '../player/PlayerHeader';
import { ShowGrid } from './ShowGrid';
import { updateMetaTags } from '@utils/meta';
import {
  DEBOUNCE_DELAY,
  PLAYER_TITLE_LATEST,
  PLAYER_TITLE_RANDOM,
  PLAYER_TITLE_SELECTED,
  PLAYER_TITLE_PERMALINK,
} from '@constants';

interface ShowListProps {
  shows: Show[];
  onStatsClick: () => void;
}

export const ShowList = ({ shows, onStatsClick }: ShowListProps) => {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [playerTitle, setPlayerTitle] = useState(PLAYER_TITLE_LATEST);

  const {
    search,
    categoryFilter,
    yearFilter,
    sortOrder,
    setSearch,
    setDebouncedSearch,
    setCategoryFilter,
    setYearFilter,
    setSortOrder,
    categories,
    years,
    filteredShows,
    categoryImages,
  } = useFilters({ shows });

  const debouncedSearch = useDebounce(search, DEBOUNCE_DELAY);

  // Update debounced search in filters
  useEffect(() => {
    setDebouncedSearch(debouncedSearch);
  }, [debouncedSearch, setDebouncedSearch]);

  // Handle permalink initialization
  const handlePermalinkInit = ({
    search: urlSearch,
    category,
    year,
    sort,
    showKey,
  }: {
    search: string;
    category: string;
    year: string;
    sort: 'newest' | 'oldest';
    showKey: string | null;
  }) => {
    setSearch(urlSearch);
    setDebouncedSearch(urlSearch);
    setCategoryFilter(category);
    setYearFilter(year);
    setSortOrder(sort);

    if (showKey) {
      const showFromUrl = shows.find((s) => s.slug === showKey);
      if (showFromUrl) {
        setSelectedShow(showFromUrl);
        setPlayerTitle(PLAYER_TITLE_PERMALINK);
        markInitialShowLoaded();
        return;
      }
    }

    // Load latest show
    const sortedShows = [...shows].sort(
      (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    );
    setSelectedShow(sortedShows[0]);
    setPlayerTitle(PLAYER_TITLE_LATEST);
    markInitialShowLoaded();
  };

  const { markInitialShowLoaded } = usePermalink({
    debouncedSearch,
    categoryFilter,
    yearFilter,
    sortOrder,
    selectedShow,
    shows,
    onInitialLoad: handlePermalinkInit,
  });

  // Update meta tags when selected show changes
  useEffect(() => {
    updateMetaTags(selectedShow);
  }, [selectedShow]);

  const handleRandomShow = () => {
    if (filteredShows.length > 0) {
      const random = filteredShows[Math.floor(Math.random() * filteredShows.length)];
      setSelectedShow(random);
      setPlayerTitle(PLAYER_TITLE_RANDOM);
    }
  };

  const handleShowClick = (show: Show) => {
    setSelectedShow(show);
    setPlayerTitle(PLAYER_TITLE_SELECTED);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <FilterBar
        search={search}
        categoryFilter={categoryFilter}
        yearFilter={yearFilter}
        sortOrder={sortOrder}
        categories={categories}
        years={years}
        categoryImages={categoryImages}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onYearChange={setYearFilter}
        onSortChange={setSortOrder}
        onRandomClick={handleRandomShow}
        onStatsClick={onStatsClick}
      />

      <PlayerHeader title={playerTitle} show={selectedShow} />

      <Box sx={{ pb: 2 }}>
        <ShowGrid shows={filteredShows} onShowClick={handleShowClick} />
      </Box>
    </Box>
  );
};
