import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design reference (standard modern mobile screen: iPhone 14 / Pixel 7 - 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Responsive Width Percentage
 * @param percent percentage of screen width (e.g. 50 for 50%)
 */
export const wp = (percent: number): number => {
  return (SCREEN_WIDTH * percent) / 100;
};

/**
 * Responsive Height Percentage
 * @param percent percentage of screen height (e.g. 50 for 50%)
 */
export const hp = (percent: number): number => {
  return (SCREEN_HEIGHT * percent) / 100;
};

/**
 * Scale element size proportionally to screen width
 * @param size size in base design
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Moderate scale with factor for font sizes and padding
 * @param size size in base design
 * @param factor factor between 0 (fixed) and 1 (linear scaling), default 0.5
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Responsive Font Scale (accounts for accessibility font scaling and screen size)
 */
export const fontScale = (size: number): number => {
  const scaled = moderateScale(size, 0.4);
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

export const Metrics = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallScreen: SCREEN_WIDTH < 375,
  isLargeScreen: SCREEN_WIDTH >= 414,
  isTablet: SCREEN_WIDTH >= 600,
};

export default {
  wp,
  hp,
  scale,
  moderateScale,
  fontScale,
  Metrics,
};
