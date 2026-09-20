import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

const appLogo = require('../../assets/Icons/dumbbell.png');

export default function AboutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={moderateScale(20)} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
            <Text style={styles.headerTitle}>About FitCore</Text>
            <Text style={styles.headerSub}>Platform & Developer Information</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(6) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO BRAND CARD ── */}
          <View style={styles.brandHeroCard}>
            <View style={styles.logoRing}>
              <Image source={appLogo} style={styles.appLogoImg} resizeMode="contain" />
            </View>
            <Text style={styles.brandName}>FitCore</Text>
            <Text style={styles.brandTagline}>Smarter Gym Management & Member Fitness Platform</Text>

            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>VERSION 2.4.0 • PRODUCTION BUILD 2026</Text>
            </View>
          </View>

          {/* ── DETAILS CARD ── */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeader}>DEVELOPER & ORGANIZATION</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Developer / Entity</Text>
              <Text style={styles.infoVal}>FitCore Technologies India</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Official Website</Text>
              <TouchableOpacity onPress={() => handleOpenLink('https://fitcore.app')}>
                <Text style={styles.infoLink}>https://fitcore.app</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Email</Text>
              <TouchableOpacity onPress={() => handleOpenLink('mailto:support@fitcore.app')}>
                <Text style={styles.infoLink}>support@fitcore.app</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Target Platform</Text>
              <Text style={styles.infoVal}>Android 16 (API Level 36)</Text>
            </View>
          </View>

          {/* ── QUICK POLICIES CARD ── */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeader}>LEGAL & COMPLIANCE</Text>

            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('LegalWebview', { initialTab: 'privacy' })}
              activeOpacity={0.7}
            >
              <View style={styles.navRowLeft}>
                <Icon name="shield-checkmark-outline" size={moderateScale(18)} color="#6C5CE7" />
                <Text style={styles.navRowTitle}>Privacy Policy</Text>
              </View>
              <Icon name="chevron-forward" size={moderateScale(16)} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('LegalWebview', { initialTab: 'terms' })}
              activeOpacity={0.7}
            >
              <View style={styles.navRowLeft}>
                <Icon name="document-text-outline" size={moderateScale(18)} color="#6C5CE7" />
                <Text style={styles.navRowTitle}>Terms & Conditions</Text>
              </View>
              <Icon name="chevron-forward" size={moderateScale(16)} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('LegalWebview', { initialTab: 'data' })}
              activeOpacity={0.7}
            >
              <View style={styles.navRowLeft}>
                <Icon name="lock-closed-outline" size={moderateScale(18)} color="#6C5CE7" />
                <Text style={styles.navRowTitle}>Data Safety Disclosure</Text>
              </View>
              <Icon name="chevron-forward" size={moderateScale(16)} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          <Text style={styles.copyrightText}>
            © 2026 FitCore Technologies India. All rights reserved.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  root: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  brandHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    alignItems: 'center',
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  logoRing: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(20),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appLogoImg: {
    width: moderateScale(32),
    height: moderateScale(32),
    tintColor: '#FFFFFF',
  },
  brandName: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: fontScale(16),
  },
  versionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    marginTop: hp(1.5),
  },
  versionBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.5,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  cardHeader: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: moderateScale(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
  },
  infoLabel: {
    fontSize: fontScale(12),
    color: '#64748B',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },
  infoLink: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: moderateScale(4),
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  navRowTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  copyrightText: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: hp(1),
  },
});
