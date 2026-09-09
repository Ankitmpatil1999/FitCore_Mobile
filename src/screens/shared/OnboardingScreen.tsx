import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { Colors, Typography, Radii, Spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onFinish: () => void;
}

const SLIDES = [
  {
    icon: '🏋️',
    title: 'Train Smarter',
    subtitle: 'Track your workouts and build\nbetter habits every day.',
    accent: Colors.primaryGreen,
  },
  {
    icon: '📈',
    title: 'Track Your Progress',
    subtitle: 'Monitor weight, workouts, calories\nand achievements over time.',
    accent: Colors.success,
  },
  {
    icon: '🎯',
    title: 'Reach Your Goals',
    subtitle: 'Get personalized workouts and\nguidance from expert trainers.',
    accent: Colors.warning,
  },
];

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setActiveIndex(index);
  };

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgBase} translucent />

      {/* Skip button (not on last slide) */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipBtn} onPress={onFinish} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            {/* Background glow circle */}
            <View style={[styles.glowCircle, { backgroundColor: slide.accent + '08' }]} />

            {/* Icon container */}
            <View style={[styles.iconContainer, { backgroundColor: slide.accent + '15' }]}>
              <Text style={styles.icon}>{slide.icon}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{slide.title}</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Action button */}
        {isLastSlide ? (
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={onFinish}
            activeOpacity={0.85}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Text style={styles.getStartedArrow}>→</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => goToSlide(activeIndex + 1)}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    top: height * 0.15,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: Typography.fontSize3xl,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: Typography.letterSpacingTight,
  },
  subtitle: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
    gap: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primaryGreen,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.bgElevated,
  },
  getStartedBtn: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.primaryGreen,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  getStartedText: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
  },
  getStartedArrow: {
    fontSize: Typography.fontSizeXl,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
  },
  nextBtn: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  nextText: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
});
