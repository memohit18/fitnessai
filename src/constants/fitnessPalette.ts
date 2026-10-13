export type FitnessPalette = {
  bg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  lime: string;
  limeSoft: string;
  limeDim: string;
  onLime: string;
  burn: string;
  active: string;
  hydrate: string;
  sleep: string;
  hot: string;
  wave: string;
  dangerDot: string;
  track: string;
};

/** Dark fitness palette used by the meal design. */
export const darkFitnessPalette: FitnessPalette = {
  bg: '#07140F',
  surface: '#12201A',
  surfaceElevated: '#1A2A22',
  border: '#24362C',
  text: '#FFFFFF',
  textSecondary: '#9AA8A0',
  textMuted: '#6B7A72',
  lime: '#C8FF00',
  limeSoft: '#9BE15D',
  limeDim: 'rgba(200, 255, 0, 0.16)',
  onLime: '#0A140F',
  burn: '#FF4D6A',
  active: '#F5C518',
  hydrate: '#2EE6D6',
  sleep: '#A78BFA',
  hot: '#FF5C8A',
  wave: '#2EE6D6',
  dangerDot: '#FF3B30',
  track: '#1E3328',
};

export const lightFitnessPalette: FitnessPalette = {
  bg: '#F4F6F3',
  surface: '#FFFFFF',
  surfaceElevated: '#F3F5F2',
  border: '#E4E8E3',
  text: '#111827',
  textSecondary: '#5C6B63',
  textMuted: '#8A978F',
  lime: '#8FBF00',
  limeSoft: '#5C8A00',
  limeDim: 'rgba(143, 191, 0, 0.16)',
  onLime: '#10210A',
  burn: '#E11D48',
  active: '#D97706',
  hydrate: '#0F9F94',
  sleep: '#7C6BB5',
  hot: '#E11D6A',
  wave: '#0F9F94',
  dangerDot: '#FF3B30',
  track: '#E7EEE6',
};

/** Default export stays the dark palette for modules that have not opted into theme yet. */
export const fitnessPalette = darkFitnessPalette;
