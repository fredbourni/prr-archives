import { useState, useEffect } from 'react';
import type { Show } from '@types';

interface UseShowsResult {
  shows: Show[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and manage show data
 * @returns Shows data, loading state, and error state
 */
export const useShows = (): UseShowsResult => {
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/shows.json');
        if (!response.ok) {
          throw new Error('Failed to load shows');
        }
        const data = await response.json();
        setShows(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Failed to load shows:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShows();
  }, []);

  return { shows, isLoading, error };
};
