import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'prr-recently-played';
const MAX_ENTRIES = 20;

export interface RecentlyPlayedEntry {
  slug: string;
  position: number; // seconds played
  duration: number; // total seconds (from progress event)
  completed: boolean; // true when the 'ended' event has fired
  updatedAt: number; // timestamp for ordering
}

/**
 * Custom hook to track recently played shows in localStorage, including
 * playback position so episodes can be resumed where the user left off.
 */
export const useRecentlyPlayed = () => {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Migrate legacy format (string[]) to the new entry format.
          const migrated: RecentlyPlayedEntry[] = parsed.map((item) => {
            if (typeof item === 'string') {
              return {
                slug: item,
                position: 0,
                duration: 0,
                completed: false,
                updatedAt: 0,
              };
            }
            return item;
          });
          setRecentlyPlayed(migrated);
        }
      }
    } catch (err) {
      console.error('Failed to read recently played:', err);
    }
  }, []);

  const persist = useCallback((next: RecentlyPlayedEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to write recently played:', err);
    }
  }, []);

  const addToRecentlyPlayed = useCallback((slug: string) => {
    if (!slug) return;
    setRecentlyPlayed((prev) => {
      const existing = prev.find((e) => e.slug === slug);
      const entry: RecentlyPlayedEntry = existing ?? {
        slug,
        position: 0,
        duration: 0,
        completed: false,
        updatedAt: Date.now(),
      };
      const next = [entry, ...prev.filter((s) => s.slug !== slug)].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, [persist]);

  const updateProgress = useCallback((slug: string, position: number, duration: number) => {
    if (!slug) return;
    setRecentlyPlayed((prev) => {
      const existingIndex = prev.findIndex((e) => e.slug === slug);
      const existing = existingIndex >= 0 ? prev[existingIndex] : null;
      const entry: RecentlyPlayedEntry = {
        slug,
        position,
        duration: duration || existing?.duration || 0,
        completed: existing?.completed ?? false,
        updatedAt: Date.now(),
      };
      const next = [entry, ...prev.filter((s) => s.slug !== slug)].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, [persist]);

  const markCompleted = useCallback((slug: string) => {
    if (!slug) return;
    setRecentlyPlayed((prev) => {
      const existing = prev.find((e) => e.slug === slug);
      if (!existing) return prev;
      const entry: RecentlyPlayedEntry = { ...existing, completed: true, updatedAt: Date.now() };
      const next = [entry, ...prev.filter((s) => s.slug !== slug)].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, [persist]);

  const removeFromRecentlyPlayed = useCallback((slug: string) => {
    if (!slug) return;
    setRecentlyPlayed((prev) => {
      const next = prev.filter((s) => s.slug !== slug);
      persist(next);
      return next;
    });
  }, [persist]);

  const clearRecentlyPlayed = useCallback(() => {
    setRecentlyPlayed([]);
    persist([]);
  }, [persist]);

  return {
    recentlyPlayed,
    addToRecentlyPlayed,
    updateProgress,
    markCompleted,
    removeFromRecentlyPlayed,
    clearRecentlyPlayed,
  };
};
