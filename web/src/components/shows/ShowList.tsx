import { useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import type { Show } from '@types';
import { useFilters } from '@hooks/useFilters';
import type { SortOrder } from '@hooks/useFilters';
import { useDebounce } from '@hooks/useDebounce';
import { usePermalink } from '@hooks/usePermalink';
import { useRecentlyPlayed } from '@hooks/useRecentlyPlayed';
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
  DEFAULT_TAGS,
} from '@constants';

interface ShowListProps {
  shows: Show[];
  onStatsClick: () => void;
}

export const ShowList = ({ shows, onStatsClick }: ShowListProps) => {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [playerTitle, setPlayerTitle] = useState(PLAYER_TITLE_LATEST);
  const [shouldSyncShow, setShouldSyncShow] = useState(false);
  const [recentlyPlayedOnly, setRecentlyPlayedOnly] = useState(false);
  const { recentlyPlayed, addToRecentlyPlayed } = useRecentlyPlayed();

  const {
    search,
    categoryFilter,
    yearFilter,
    sortOrder,
    tagFilter,
    setSearch,
    setDebouncedSearch,
    setCategoryFilter,
    setYearFilter,
    setSortOrder,
    setTagFilter,
    categories,
    years,
    tags,
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
    tags: urlTags,
    recentlyPlayedOnly: urlRecentlyPlayed,
  }: {
    search: string;
    category: string;
    year: string;
    sort: 'newest' | 'oldest';
    showKey: string | null;
    tags: string[];
    recentlyPlayedOnly: boolean;
  }, markLoaded: () => void) => {
    setSearch(urlSearch);
    setDebouncedSearch(urlSearch);
    setCategoryFilter(category);
    setYearFilter(year);
    setSortOrder(sort);
    setTagFilter(urlTags);
    setRecentlyPlayedOnly(urlRecentlyPlayed);

    if (showKey) {
      const showFromUrl = shows.find((s) => s.slug === showKey);
      if (showFromUrl) {
        setSelectedShow(showFromUrl);
        setPlayerTitle(PLAYER_TITLE_PERMALINK);
        setShouldSyncShow(true);
        addToRecentlyPlayed(showFromUrl.slug);
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
  }, [shows, addToRecentlyPlayed, setSearch, setDebouncedSearch, setCategoryFilter, setYearFilter, setSortOrder, setTagFilter, setRecentlyPlayedOnly]);

  const { markInitialShowLoaded } = usePermalink({
    debouncedSearch,
    categoryFilter,
    yearFilter,
    sortOrder,
    tagFilter,
    recentlyPlayedOnly,
    selectedShow,
    shouldIncludeShow: shouldSyncShow,
    shows,
    onInitialLoad: handlePermalinkInit,
  });

  // Listen for navigation changes (like clicking the logo)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTags = params.get('tag') ? params.get('tag')!.split(',').filter(Boolean) : DEFAULT_TAGS;
      const urlRecentlyPlayed = params.get('recent') === '1';
      handlePermalinkInit({
        search: params.get('q') || '',
        category: params.get('cat') || DEFAULT_CATEGORY,
        year: params.get('year') || DEFAULT_YEAR,
        sort: (params.get('sort') as SortOrder) || DEFAULT_SORT_ORDER,
        showKey: params.get('show') || null,
        tags: urlTags,
        recentlyPlayedOnly: urlRecentlyPlayed,
      }, markInitialShowLoaded);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePermalinkInit, markInitialShowLoaded]);

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
      addToRecentlyPlayed(random.slug);
    }
  };

  const handleShowClick = (show: Show) => {
    setSelectedShow(show);
    setPlayerTitle(PLAYER_TITLE_SELECTED);
    setShouldSyncShow(true);
    addToRecentlyPlayed(show.slug);
  };

  const handleTagClick = (tag: string) => {
    setTagFilter([tag]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategoryFilter(DEFAULT_CATEGORY);
    setYearFilter(DEFAULT_YEAR);
    setSortOrder(DEFAULT_SORT_ORDER);
    setTagFilter(DEFAULT_TAGS);
    setRecentlyPlayedOnly(false);
  };

  const handleRecentlyPlayedToggle = () => {
    setRecentlyPlayedOnly((prev) => !prev);
  };

  // Apply recently-played filter on top of the filtered shows
  const visibleShows = recentlyPlayedOnly
    ? filteredShows.filter((s) => recentlyPlayed.includes(s.slug))
    : filteredShows;

  const isFiltering =
    search !== '' ||
    categoryFilter !== DEFAULT_CATEGORY ||
    yearFilter !== DEFAULT_YEAR ||
    tagFilter.length > 0 ||
    recentlyPlayedOnly;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <FilterBar
        search={search}
        categoryFilter={categoryFilter}
        yearFilter={yearFilter}
        sortOrder={sortOrder}
        categories={categories}
        years={years}
        tags={tags}
        tagFilter={tagFilter}
        categoryImages={categoryImages}
        recentlyPlayedOnly={recentlyPlayedOnly}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onYearChange={setYearFilter}
        onSortChange={setSortOrder}
        onTagChange={setTagFilter}
        onRecentlyPlayedToggle={handleRecentlyPlayedToggle}
        onRandomClick={handleRandomShow}
        onStatsClick={onStatsClick}
      />

      <PlayerHeader title={playerTitle} show={selectedShow} />

      {isFiltering && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {visibleShows.length} show{visibleShows.length !== 1 ? 's' : ''}
        </Typography>
      )}

      <Box sx={{ pb: 2 }}>
        <ShowGrid
          shows={visibleShows}
          onShowClick={handleShowClick}
          selectedShowSlug={selectedShow?.slug ?? null}
          onTagClick={handleTagClick}
          onResetFilters={handleResetFilters}
        />
      </Box>
    </Box>
  );
};
