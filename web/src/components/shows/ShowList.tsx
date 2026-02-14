import { useState, useEffect, useCallback } from 'react';
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
  DEFAULT_CATEGORY,
  DEFAULT_YEAR,
  DEFAULT_SORT_ORDER,
} from '@constants';

interface ShowListProps {
  shows: Show[];
  onStatsClick: () => void;
}

export const ShowList = ({ shows, onStatsClick }: ShowListProps) => {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [playerTitle, setPlayerTitle] = useState(PLAYER_TITLE_LATEST);
  const [shouldSyncShow, setShouldSyncShow] = useState(false);

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
  const handlePermalinkInit = useCallback(({
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
  }, markLoaded: () => void) => {
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
        setShouldSyncShow(true);
        markLoaded();
        return;
      }
    }

    // Load latest show
    const sortedShows = [...shows].sort(
      (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    );
    setSelectedShow(sortedShows[0]);
    setPlayerTitle(PLAYER_TITLE_LATEST);
    setShouldSyncShow(false);
    markLoaded();
  }, [shows]);

  const { markInitialShowLoaded } = usePermalink({
    debouncedSearch,
    categoryFilter,
    yearFilter,
    sortOrder,
    selectedShow,
    shouldIncludeShow: shouldSyncShow,
    shows,
    onInitialLoad: handlePermalinkInit,
  });

  // Listen for navigation changes (like clicking the logo)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      handlePermalinkInit({
        search: params.get('q') || '',
        category: params.get('cat') || DEFAULT_CATEGORY,
        year: params.get('year') || DEFAULT_YEAR,
        sort: (params.get('sort') as any) || (DEFAULT_SORT_ORDER as any),
        showKey: params.get('show') || null,
      }, markInitialShowLoaded);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePermalinkInit]);

  // Update meta tags when selected show changes
  useEffect(() => {
    updateMetaTags(selectedShow);
  }, [selectedShow, shouldSyncShow]);

  const handleRandomShow = () => {
    if (filteredShows.length > 0) {
      const random = filteredShows[Math.floor(Math.random() * filteredShows.length)];
      setSelectedShow(random);
      setPlayerTitle(PLAYER_TITLE_RANDOM);
      setShouldSyncShow(true);
    }
  };

  const handleShowClick = (show: Show) => {
    setSelectedShow(show);
    setPlayerTitle(PLAYER_TITLE_SELECTED);
    setShouldSyncShow(true);
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
