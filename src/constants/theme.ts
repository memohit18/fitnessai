export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  border: string;
  inputBackground: string;
  error: string;
  placeholder: string;
}

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  border: '#E2E8F0',
  inputBackground: '#FFFFFF',
  error: '#DC2626',
  placeholder: '#94A3B8',
};

export const darkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  border: '#334155',
  inputBackground: '#1E293B',
  error: '#F87171',
  placeholder: '#64748B',
};

export const THEME_STORAGE_KEY = 'theme-mode';
