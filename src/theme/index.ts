export const Colors = {
  // Backgrounds
  bgBase: '#06070A',
  bgSurface: '#0F1014',
  bgCard: '#141519',
  bgElevated: '#1A1B21',

  // Accents
  accentCyan: '#00F0FF',
  accentViolet: '#7928CA',
  accentGradientStart: '#00F0FF',
  accentGradientEnd: '#7928CA',

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
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.16)',

  // Transparent overlays
  overlay: 'rgba(0,0,0,0.6)',
  glass: 'rgba(255,255,255,0.03)',
  glassBorder: 'rgba(255,255,255,0.08)',

  // Status backgrounds
  successBg: 'rgba(16,185,129,0.1)',
  warningBg: 'rgba(245,158,11,0.1)',
  dangerBg: 'rgba(239,68,68,0.1)',
  cyanBg: 'rgba(0,240,255,0.08)',
};

export const LightColors = {
  // Backgrounds
  bgBase: '#F8FAFC',
  bgSurface: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgElevated: '#F1F5F9',

  // Accents
  accentCyan: '#0EA5E9',
  accentViolet: '#8B5CF6',
  accentGradientStart: '#0EA5E9',
  accentGradientEnd: '#8B5CF6',

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
  cyanBg: '#E0F2FE',
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
