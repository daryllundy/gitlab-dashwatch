// UI configuration constants
import { UI_CONSTANTS, TIME_CONSTANTS } from '@/constants';

export const UI_CONFIG = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  },
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    delays: {
      section: 1,
      cardBase: 1,
    },
  },
  colors: {
    status: {
      healthy: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      inactive: 'text-gray-600',
    },
  },
  sidebar: {
    cookieName: 'sidebar:state',
    cookieMaxAge: 7 * TIME_CONSTANTS.DAY / 1000, // 7 days in seconds
    width: '16rem',
    widthMobile: '18rem',
    widthIcon: '3rem',
    keyboardShortcut: 'b',
  },
  toast: {
    limit: 1,
    removeDelay: UI_CONSTANTS.TOAST_REMOVE_DELAY,
  },
} as const;
