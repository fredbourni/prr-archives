import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  onLoadMore: () => void;
  hasMore: boolean;
}

/**
 * Custom hook for infinite scroll functionality
 * @param options - Configuration options
 * @returns Ref to attach to the sentinel element
 */
export const useInfiniteScroll = ({
  threshold = 0.5,
  onLoadMore,
  hasMore,
}: UseInfiniteScrollOptions) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, onLoadMore, threshold]);

  return observerTarget;
};
