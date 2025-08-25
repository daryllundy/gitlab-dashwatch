// Storage utility functions
import { STORAGE_CONSTANTS } from '@/constants';

export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = STORAGE_CONSTANTS.TEST_KEY;
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

export const getStorageSize = (data: string): number => {
  return new Blob([data]).size;
};

export const safeJsonParse = <T>(data: string, fallback: T): T => {
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

export const safeJsonStringify = (data: unknown, fallback: string = '{}'): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return fallback;
  }
};
