/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, locale: string = 'fr-FR'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale);
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const secondsPassed = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsPassed < 60) return 'À l\'instant';
  if (secondsPassed < 3600) return `${Math.floor(secondsPassed / 60)}m`;
  if (secondsPassed < 86400) return `${Math.floor(secondsPassed / 3600)}h`;
  if (secondsPassed < 2592000) return `${Math.floor(secondsPassed / 86400)}j`;
  if (secondsPassed < 31536000) return `${Math.floor(secondsPassed / 2592000)}m`;
  
  return formatDate(date);
};

/**
 * Format large numbers (e.g., 1000 => "1K")
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};
