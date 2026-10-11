import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'prr-recently-played';
const MAX_ENTRIES = 20;

/**
 * Custom hook to track recently played shows in localStorage.
 * @returns Array of recently played slugs (most recent first) and a function to add a slug.
 */
export const useRecentlyPlayed = () => {
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentlyPlayed(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to read recently played:', err);
    }
  }, []);

  const addToRecentlyPlayed = useCallback((slug: string) => {
    if (!slug) return;
    setRecentlyPlayed((prev) => {
      // Remove existing occurrence, then prepend
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to write recently played:', err);
      }
      return next;
    });
  }, []);

  return { recentlyPlayed, addToRecentlyPlayed };
};
