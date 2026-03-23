/**
 * Generic helper to wait for a specific time
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Clone an object deeply
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: unknown): boolean => {
  if (typeof obj !== 'object' || obj === null) return true;
  return Object.keys(obj).length === 0;
};

/**
 * Merge objects  
 */
export const mergeObjects = <T extends Record<string, unknown>>(target: T, source: Partial<T>): T => {
  return { ...target, ...source };
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
