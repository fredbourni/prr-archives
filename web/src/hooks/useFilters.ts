import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Show } from '@types';
import { DEFAULT_CATEGORY, DEFAULT_YEAR, DEFAULT_SORT_ORDER, FUSE_THRESHOLD } from '@constants';
import { stripArticles } from '@utils/format';
import { getShowImage, ImageSize } from '@utils/image';

export type SortOrder = 'newest' | 'oldest';

interface UseFiltersOptions {
  shows: Show[];
}

interface UseFiltersResult {
  // Filter states
  search: string;
  debouncedSearch: string;
  categoryFilter: string;
  yearFilter: string;
  sortOrder: SortOrder;

  // Setters
  setSearch: (value: string) => void;
  setDebouncedSearch: (value: string) => void;
  setCategoryFilter: (value: string) => void;
  setYearFilter: (value: string) => void;
  setSortOrder: (value: SortOrder) => void;

  // Computed values
  categories: string[];
  years: (string | number)[];
  filteredShows: Show[];
  categoryImages: Map<string, string>;
}

/**
 * Custom hook to manage all filtering logic
 */
export const useFilters = ({ shows }: UseFiltersOptions): UseFiltersResult => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(DEFAULT_CATEGORY);
  const [yearFilter, setYearFilter] = useState(DEFAULT_YEAR);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER as SortOrder);

  // Compute categories with sorting
  const categories = useMemo(() => {
    const cats = new Set(shows.map((s) => s.category));
    const sortedCats = Array.from(cats).sort((a, b) =>
      stripArticles(a).localeCompare(stripArticles(b))
    );
    return [DEFAULT_CATEGORY, ...sortedCats];
  }, [shows]);

  // Map categories to their representative images
  const categoryImages = useMemo(() => {
    const imageMap = new Map<string, string>();
    shows.forEach((show) => {
      if (!imageMap.has(show.category)) {
        imageMap.set(show.category, getShowImage(show.picture_key, ImageSize.THUMBNAIL));
      }
    });
    return imageMap;
  }, [shows]);

  // Compute available years
  const years = useMemo(() => {
    const yearSet = new Set(shows.map((s) => new Date(s.created_time).getFullYear()));
    return [DEFAULT_YEAR, ...Array.from(yearSet).sort((a, b) => b - a)];
  }, [shows]);

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(shows, {
      keys: ['name', 'tags', 'category', 'description'],
      threshold: FUSE_THRESHOLD,
      useExtendedSearch: true,
      ignoreLocation: true,
    });
  }, [shows]);

  // Compute filtered shows
  const filteredShows = useMemo(() => {
    let result = shows;

    // Apply text search
    if (debouncedSearch) {

      // 1. Exact/Includes match (using ' prefix for includes-match in Fuse extended search)
      // This finds items where the query string appears exactly
      const exactResults = fuse.search(`'${debouncedSearch}`);

      // 2. Fallback: If query contains hyphens, search with spaces
      let fallbackResults: ReturnType<typeof fuse.search> = [];
      if (debouncedSearch.includes('-')) {
        const spaceQuery = debouncedSearch.replace(/-/g, ' ');
        fallbackResults = fuse.search(`'${spaceQuery}`); // Use exact match for fallback too
      }

      // 3. Combine results: Exact matches first, then fallback
      // Use a Map to deduplicate by show key
      const combinedMap = new Map<string, Show>();

      // Add exact matches first
      exactResults.forEach((r) => {
        combinedMap.set(r.item.slug, r.item);
      });

      // Add fallback matches if not already present
      fallbackResults.forEach((r) => {
        const item = r.item as Show;
        if (!combinedMap.has(item.slug)) {
          combinedMap.set(item.slug, item);
        }
      });

      result = Array.from(combinedMap.values());
    }

    // Apply category filter
    if (categoryFilter !== DEFAULT_CATEGORY) {
      result = result.filter((s) => s.category === categoryFilter);
    }

    // Apply year filter
    if (yearFilter !== DEFAULT_YEAR) {
      result = result.filter((s) => new Date(s.created_time).getFullYear() === Number(yearFilter));
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.created_time).getTime();
      const dateB = new Date(b.created_time).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [shows, debouncedSearch, categoryFilter, yearFilter, sortOrder, fuse]);

  return {
    search,
    debouncedSearch,
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
  };
};
