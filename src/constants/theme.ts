export type ThemeMode = 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryEnd: string;
  primaryText: string;
  border: string;
  inputBackground: string;
  inputBorder: string;
  error: string;
  placeholder: string;
  accent: string;
  glow: string;
  pattern: string;
  socialButtonBg: string;
  checkboxBorder: string;
}

export const lightColors: ThemeColors = {
  background: '#E8EDF5',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#10B981',
  primaryEnd: '#14B8A6',
  primaryText: '#FFFFFF',
  border: '#E5E7EB',
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
  error: '#DC2626',
  placeholder: '#9CA3AF',
  accent: '#059669',
  glow: 'rgba(16, 185, 129, 0.12)',
  pattern: 'rgba(16, 185, 129, 0.18)',
  socialButtonBg: '#FFFFFF',
  checkboxBorder: '#D1D5DB',
};

export const darkColors: ThemeColors = {
  background: '#0B1120',
  surface: '#161D2F',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  primary: '#10B981',
  primaryEnd: '#14B8A6',
  primaryText: '#FFFFFF',
  border: '#2A3448',
  inputBackground: '#1A2235',
  inputBorder: '#2A3448',
  error: '#F87171',
  placeholder: '#6B7280',
  accent: '#10B981',
  glow: 'rgba(16, 185, 129, 0.2)',
  pattern: 'rgba(16, 185, 129, 0.25)',
  socialButtonBg: 'transparent',
  checkboxBorder: '#374151',
};

export const THEME_STORAGE_KEY = 'theme-mode';
