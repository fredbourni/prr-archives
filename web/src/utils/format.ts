/**
 * Formats a duration in seconds to a human-readable string (HH:MM:SS or MM:SS)
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Strips common articles from the beginning of a string for sorting purposes
 */
export const stripArticles = (str: string): string => {
  return str.replace(/^(the|a|le|la|L|C)[\s']+/i, '');
};
