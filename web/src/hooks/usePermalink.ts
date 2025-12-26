import { useEffect, useState } from 'react';
import type { Show } from '@types';
import type { SortOrder } from './useFilters';
import { DEFAULT_CATEGORY, DEFAULT_YEAR, DEFAULT_SORT_ORDER } from '@constants';

interface UsePermalinkOptions {
  debouncedSearch: string;
  categoryFilter: string;
  yearFilter: string;
  sortOrder: SortOrder;
  selectedShow: Show | null;
  shouldIncludeShow: boolean;
  shows: Show[];
  onInitialLoad: (params: {
    search: string;
    category: string;
    year: string;
    sort: SortOrder;
    showKey: string | null;
  }) => void;
}

/**
 * Custom hook to manage URL synchronization and permalink functionality
 */
export const usePermalink = ({
  debouncedSearch,
  categoryFilter,
  yearFilter,
  sortOrder,
  selectedShow,
  shouldIncludeShow,
  shows,
  onInitialLoad,
}: UsePermalinkOptions) => {
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasLoadedInitialShow, setHasLoadedInitialShow] = useState(false);

  // Initialize state from URL params on mount
  useEffect(() => {
    if (!hasInitialized && shows.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get('q') || '';
      const urlCategory = params.get('cat') || DEFAULT_CATEGORY;
      const urlYear = params.get('year') || DEFAULT_YEAR;
      const urlSort = (params.get('sort') as SortOrder) || (DEFAULT_SORT_ORDER as SortOrder);
      const urlShowKey = params.get('show') || null;

      onInitialLoad({
        search: urlSearch,
        category: urlCategory,
        year: urlYear,
        sort: urlSort,
        showKey: urlShowKey,
      });

      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shows, onInitialLoad]);

  // Update URL when filters change
  useEffect(() => {
    // Don't update URL until after initialization AND initial show is loaded
    if (!hasInitialized || !hasLoadedInitialShow) return;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (categoryFilter !== DEFAULT_CATEGORY) params.set('cat', categoryFilter);
    if (yearFilter !== DEFAULT_YEAR) params.set('year', yearFilter);
    if (sortOrder !== DEFAULT_SORT_ORDER) params.set('sort', sortOrder);

    // Only include show in URL if it was explicitly selected or came from a permalink
    if (selectedShow && shouldIncludeShow) {
      params.set('show', selectedShow.slug);
    }

    // Preserve stats parameter if it exists in the current URL
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get('stats') === '1') {
      params.set('stats', '1');
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  }, [debouncedSearch, categoryFilter, yearFilter, sortOrder, selectedShow, shouldIncludeShow, hasInitialized, hasLoadedInitialShow]);

  const markInitialShowLoaded = () => {
    setHasLoadedInitialShow(true);
  };

  return {
    hasInitialized,
    markInitialShowLoaded,
  };
};
