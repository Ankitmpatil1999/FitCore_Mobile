export const Colors = {
  // Backgrounds
  bgBase: '#000000',
  bgSurface: '#08090C',
  bgCard: '#0F1015',
  bgElevated: '#17181F',

  // Accents
  accentCyan: '#4B4DF3',
  accentViolet: '#2C65DE',
  accentGradientStart: '#6B7DF2',
  accentGradientEnd: '#2C65DE',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#4B5563',

  // Borders
  border: 'rgba(107, 125, 242, 0.15)',
  borderHover: 'rgba(107, 125, 242, 0.3)',

  // Transparent overlays
  overlay: 'rgba(0,0,0,0.6)',
  glass: 'rgba(107, 125, 242, 0.04)',
  glassBorder: 'rgba(107, 125, 242, 0.15)',

  // Status backgrounds
  successBg: 'rgba(16,185,129,0.1)',
  warningBg: 'rgba(245,158,11,0.1)',
  dangerBg: 'rgba(239,68,68,0.1)',
  cyanBg: 'rgba(107, 125, 242, 0.1)',
};

export const LightColors = {
  // Backgrounds
  bgBase: '#F8FAFC',
  bgSurface: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgElevated: '#F1F5F9',

  // Accents
  accentCyan: '#5EA2D6',
  accentViolet: '#2C65DE',
  accentGradientStart: '#6B7DF2',
  accentGradientEnd: '#2C65DE',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Borders
  border: '#E2E8F0',
  borderHover: '#CBD5E1',

  // Transparent overlays
  overlay: 'rgba(15,23,42,0.4)',
  glass: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(15,23,42,0.08)',

  // Status backgrounds
  successBg: '#ECFDF5',
  warningBg: '#FEF3C7',
  dangerBg: '#FEE2E2',
  cyanBg: '#E2EEFC',
};

export const Typography = {
  fontSizeXs: 11,
  fontSizeSm: 12,
  fontSizeMd: 14,
  fontSizeLg: 16,
  fontSizeXl: 20,
  fontSize2xl: 24,
  fontSize3xl: 30,
  fontSize4xl: 36,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightExtraBold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cyan: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
};
