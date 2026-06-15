import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  darkColors,
  lightColors,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeColors,
  type ThemeMode,
} from '../constants/theme';
import { getStorageString, setStorageString } from '../services/storage';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    void getStorageString(THEME_STORAGE_KEY).then((stored) => {
      if (isThemeMode(stored)) {
        setModeState(stored);
      }
    });
  }, []);

  const resolvedTheme: ResolvedTheme = mode;
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void setStorageString(THEME_STORAGE_KEY, nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const nextMode: ThemeMode = current === 'dark' ? 'light' : 'dark';
      void setStorageString(THEME_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, resolvedTheme, colors, setMode, toggleMode }),
    [mode, resolvedTheme, colors, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
