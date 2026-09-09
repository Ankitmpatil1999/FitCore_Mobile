import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Colors, Typography } from '../../theme';

const { width, height } = Dimensions.get('window');
const logo = require('../../assets/Icone.png');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(800),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080B16" translucent />

      {/* Subtle background glow */}
      <View style={styles.glowCircle} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {/* Brand Name */}
      <Animated.Text
        style={[
          styles.brandName,
          { opacity: logoOpacity },
        ]}
      >
        FITCORE
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          },
        ]}
      >
        TRAIN  •  TRACK  •  GROW
      </Animated.Text>

      {/* Dot indicator */}
      <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(59, 102, 255, 0.08)',
    top: height * 0.18,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: Typography.fontSize4xl,
    fontWeight: Typography.fontWeightExtraBold,
    color: '#FFFFFF',
    letterSpacing: Typography.letterSpacingExtraWide,
    marginBottom: 16,
  },
  tagline: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: '#38BDF8',
    letterSpacing: Typography.letterSpacingExtraWide,
    marginBottom: 60,
  },
  dot: {
    position: 'absolute',
    bottom: 80,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B66FF',
  },
});
