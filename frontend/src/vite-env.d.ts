/// <reference types="vite/client" />

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { user?: TelegramUser };
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string>;
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: { top?: number; right?: number; bottom?: number; left?: number };
  contentSafeAreaInset?: { top?: number; right?: number; bottom?: number; left?: number };
  ready: () => void;
  expand: () => void;
  onEvent?: (event: string, handler: (...args: any[]) => void) => void;
  offEvent?: (event: string, handler: (...args: any[]) => void) => void;
  enableVerticalSwipes?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  MainButton?: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (handler: () => void) => void;
    offClick: (handler: () => void) => void;
  };
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') => void;
    selectionChanged: () => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
