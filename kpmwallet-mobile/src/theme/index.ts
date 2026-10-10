export const colors = {
  primary: '#3B4FE4',
  primaryLight: '#6B7CF6',
  primaryDark: '#2836A3',
  accent: '#4FD1C5',
  white: '#FFFFFF',
  black: '#1A1A2E',
  gray50: '#F5F7FA',
  gray100: '#E9EEF5',
  gray200: '#D1D9E6',
  gray400: '#8F9BB3',
  gray500: '#6B7280',
  gray700: '#374151',
  error: '#EF4444',
  success: '#10B981',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
} as const;
