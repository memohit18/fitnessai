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
  background: '#F3F4F6',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#B8E600',
  primaryEnd: '#C8FF00',
  primaryText: '#0E0E0E',
  border: '#E5E7EB',
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
  error: '#DC2626',
  placeholder: '#9CA3AF',
  accent: '#A3CC00',
  glow: 'rgba(200, 255, 0, 0.14)',
  pattern: 'rgba(200, 255, 0, 0.18)',
  socialButtonBg: '#FFFFFF',
  checkboxBorder: '#D1D5DB',
};

export const darkColors: ThemeColors = {
  background: '#0E0E0E',
  surface: '#171717',
  text: '#FFFFFF',
  textSecondary: '#8B8B8B',
  primary: '#C8FF00',
  primaryEnd: '#D4FF33',
  primaryText: '#0E0E0E',
  border: '#2A2A2A',
  inputBackground: '#1A1A1A',
  inputBorder: '#2A2A2A',
  error: '#F87171',
  placeholder: '#6B7280',
  accent: '#C8FF00',
  glow: 'rgba(200, 255, 0, 0.18)',
  pattern: 'rgba(200, 255, 0, 0.22)',
  socialButtonBg: 'transparent',
  checkboxBorder: '#374151',
};

export const THEME_STORAGE_KEY = 'theme-mode';
