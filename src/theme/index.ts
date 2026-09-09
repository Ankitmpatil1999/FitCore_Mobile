// ─────────────────────────────────────────────
//  FitCore Design System
//  Theme: Radiant Pearl Lavender + Royal Electric Violet (#6C5CE7)
//  Brand: High-Performance Luxury Fitness & Gym Platform
// ─────────────────────────────────────────────

export const Colors = {
  // ── Backgrounds ──────────────────────────────
  bgBase: '#F7F7FD',           // Soft luxury lavender-pearl background
  bgSurface: '#FFFFFF',        // Pure white surface
  bgCard: '#FFFFFF',           // Crisp pure white cards
  bgCardSecondary: '#F3F2FE',  // Elevated soft violet card
  bgElevated: '#FFFFFF',       // Modals, sheets

  // ── Primary Accent (Royal Electric Violet / Purple) ─────
  primaryBlue: '#6C5CE7',      // Primary CTA, active tab, buttons
  primaryBlueDark: '#5642E5',  // Gradient end, pressed state
  primaryBlueLight: '#8C7CFF', // Hover, light glow
  primaryBlueMuted: 'rgba(108, 92, 231, 0.10)',

  // Brand Theme Aliases
  primaryPurple: '#6C5CE7',
  primaryPurpleDark: '#5642E5',
  primaryPurpleLight: '#8C7CFF',

  // Compatibility aliases
  primaryGreen: '#6C5CE7',
  primaryGreenDark: '#5642E5',
  accentCyan: '#00C2FF',
  accentViolet: '#6C5CE7',
  accentGradientStart: '#6C5CE7',
  accentGradientEnd: '#A855F7',

  // ── Quick Action / Metric Accents ────────────
  neonGreen: '#00C48C',        // Visits, positive delta
  cyanBlue: '#38BDF8',         // Clock, hours
  amberOrange: '#FF9900',      // Calories flame, trainer icon
  purpleMagenta: '#6C5CE7',    // Workouts, brand
  rosePink: '#FF4D6D',         // Body stats
  indigoChart: '#6366F1',      // Analytics

  // ── Semantic ─────────────────────────────────
  success: '#00C48C',          // Positive indicators, completed sets
  warning: '#FF9900',          // Attention, pending
  danger: '#FF4D6D',           // Errors, critical alerts
  info: '#6C5CE7',             // Informational

  // ── Text ─────────────────────────────────────
  textPrimary: '#0F172A',      // Crisp deep slate black
  textSecondary: '#64748B',    // Neutral slate secondary text
  textMuted: '#94A3B8',        // Subtle placeholder / labels
  textOnPrimary: '#FFFFFF',    // Pure white on purple buttons

  // ── Borders ──────────────────────────────────
  border: '#ECEAFD',
  borderHover: '#D5D0FC',
  borderSubtle: '#F3F2FE',

  // ── Transparent overlays ─────────────────────
  overlay: 'rgba(15, 23, 42, 0.45)',
  glass: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(108, 92, 231, 0.08)',

  // ── Status backgrounds ───────────────────────
  successBg: 'rgba(0, 196, 140, 0.10)',
  warningBg: 'rgba(255, 153, 0, 0.10)',
  dangerBg: 'rgba(255, 77, 109, 0.10)',
  cyanBg: 'rgba(56, 189, 248, 0.10)',
  blueBg: 'rgba(108, 92, 231, 0.10)',

  // ── Component-specific ───────────────────────
  tabBarBg: '#FFFFFF',
  inputBg: '#F8FAFC',
  inputBorder: '#ECEAFD',
  inputBorderFocus: '#6C5CE7',
  divider: '#ECEAFD',
};

export const LightColors = Colors;

export const Typography = {
  fontFamily: undefined as string | undefined,

  fontSizeXs: 11,
  fontSizeSm: 12,
  fontSizeMd: 14,
  fontSizeLg: 16,
  fontSizeXl: 20,
  fontSize2xl: 24,
  fontSize3xl: 30,
  fontSize4xl: 36,
  fontSize5xl: 42,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightExtraBold: '800' as const,

  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,

  letterSpacingTight: -0.5,
  letterSpacingNormal: 0,
  letterSpacingWide: 0.5,
  letterSpacingExtraWide: 2,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  cyan: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
};
