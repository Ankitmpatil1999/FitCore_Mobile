import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

interface LegalDocProps {
  route: {
    params?: {
      initialTab?: 'privacy' | 'terms' | 'data';
    };
  };
  navigation: any;
}

export default function LegalWebviewScreen({ route, navigation }: LegalDocProps) {
  const insets = useSafeAreaInsets();
  const [activeDoc, setActiveDoc] = useState<'privacy' | 'terms' | 'data'>(
    route?.params?.initialTab || 'privacy'
  );

  const handleOpenExternal = (url: string) => {
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
            <Text style={styles.headerTitle}>Legal & Privacy</Text>
            <Text style={styles.headerSub}>FitCore Compliance & Policies</Text>
          </View>
        </View>

        {/* ── SEGMENT SWITCHER ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeDoc === 'privacy' && styles.tabBtnActive]}
            onPress={() => setActiveDoc('privacy')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeDoc === 'privacy' && styles.tabBtnTextActive]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeDoc === 'terms' && styles.tabBtnActive]}
            onPress={() => setActiveDoc('terms')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeDoc === 'terms' && styles.tabBtnTextActive]}>
              Terms of Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeDoc === 'data' && styles.tabBtnActive]}
            onPress={() => setActiveDoc('data')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeDoc === 'data' && styles.tabBtnTextActive]}>
              Data & Privacy
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + hp(6) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── PUBLIC URL BANNER ── */}
          <View style={styles.publicUrlCard}>
            <View style={styles.publicUrlIconBox}>
              <Icon name="globe-outline" size={moderateScale(18)} color="#6C5CE7" />
            </View>
            <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
              <Text style={styles.publicUrlTitle}>Official Public Web URL</Text>
              <Text style={styles.publicUrlText}>
                {activeDoc === 'privacy'
                  ? 'https://fitcore.app/privacy-policy'
                  : activeDoc === 'terms'
                  ? 'https://fitcore.app/terms-and-conditions'
                  : 'https://fitcore.app/delete-account'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.openExternalBtn}
              onPress={() =>
                handleOpenExternal(
                  activeDoc === 'privacy'
                    ? 'https://fitcore.app/privacy-policy'
                    : activeDoc === 'terms'
                    ? 'https://fitcore.app/terms-and-conditions'
                    : 'https://fitcore.app/delete-account'
                )
              }
              activeOpacity={0.7}
            >
              <Icon name="open-outline" size={moderateScale(16)} color="#6C5CE7" />
            </TouchableOpacity>
          </View>

          {/* ── DOCUMENT BODY ── */}
          {activeDoc === 'privacy' && (
            <View style={styles.docCard}>
              <View style={styles.effectiveBadge}>
                <Text style={styles.effectiveBadgeText}>LAST UPDATED: SEPTEMBER 2026</Text>
              </View>
              <Text style={styles.docMainHeading}>FitCore Privacy Policy</Text>

              <Text style={styles.paragraph}>
                FitCore ("we," "our," or "us") is dedicated to protecting the privacy of members, fitness enthusiasts, and gym visitors. This Privacy Policy describes how we collect, use, process, and safeguard your personal information across the FitCore Mobile App and associated services.
              </Text>

              <Text style={styles.sectionTitle}>1. Personal & Fitness Data We Collect</Text>
              <Text style={styles.paragraph}>
                We collect personal information necessary to deliver gym management and workout tracking services:
              </Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Identity & Contact Data:</Text> Full name, mobile phone number, email address, profile picture, gender, and date of birth.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Fitness & Health Data:</Text> Body weight, measurements, workout routines, exercise completion history, and dietary meal plans assigned by your certified gym trainer.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Membership & Payments:</Text> Subscription plan duration, start and expiration dates, gym turnstile check-in logs, transaction reference IDs, and billing receipts.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Device & Notification Tokens:</Text> Device model, OS version, and Firebase Cloud Messaging (FCM) tokens used solely for gym announcements and reminders.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>2. Clear Non-Medical Statement</Text>
              <Text style={styles.paragraph}>
                FitCore is a fitness and gym management application. Features including workout logs, calorie estimation, and trainer guidance are provided strictly for general fitness management and educational purposes. FitCore does not provide medical diagnosis, clinical treatment, or cure for any medical conditions.
              </Text>

              <Text style={styles.sectionTitle}>3. Purpose of Processing</Text>
              <Text style={styles.paragraph}>
                We process your data strictly to:
              </Text>
              <Text style={styles.paragraph}>
                - Facilitate contactless gym entry and attendance logging.{"\n"}
                - Sync workout sets, reps, and nutrition logs with your personal trainer.{"\n"}
                - Send membership expiration alerts and invoice receipts.{"\n"}
                - Prevent unauthorized account access and fraud.
              </Text>

              <Text style={styles.sectionTitle}>4. Data Security & Storage</Text>
              <Text style={styles.paragraph}>
                All network transmissions are secured via TLS 1.3/HTTPS encryption. Data is stored on secure cloud database clusters with strict role-based access control. We never sell, rent, or trade your personal or fitness records with third-party advertisers.
              </Text>

              <Text style={styles.sectionTitle}>5. Account & Data Deletion Rights</Text>
              <Text style={styles.paragraph}>
                You retain complete control over your data. You may delete your account and associated profile records directly within the app (Profile → Delete Account) or via our public deletion webpage (https://fitcore.app/delete-account).
              </Text>

              <Text style={styles.sectionTitle}>6. Grievance & Privacy Contact</Text>
              <Text style={styles.paragraph}>
                For questions regarding this policy or data processing, contact our Grievance Officer:{"\n"}
                Email: privacy@fitcore.app | support@fitcore.app{"\n"}
                Helpline: +91 93260 93115
              </Text>
            </View>
          )}

          {/* ── TERMS OF SERVICE ── */}
          {activeDoc === 'terms' && (
            <View style={styles.docCard}>
              <View style={styles.effectiveBadge}>
                <Text style={styles.effectiveBadgeText}>TERMS OF SERVICE • 2026</Text>
              </View>
              <Text style={styles.docMainHeading}>FitCore Terms & Conditions</Text>

              <Text style={styles.paragraph}>
                Welcome to FitCore. By downloading, registering, or accessing the FitCore mobile application, you agree to be bound by the following terms and conditions.
              </Text>

              <Text style={styles.sectionTitle}>1. Gym Membership & Pass Validity</Text>
              <Text style={styles.paragraph}>
                FitCore provides digital member passes and workout tracking for affiliated physical gym facilities. Membership validity, operating hours, facility access, and refund policies are governed by your subscribed gym center.
              </Text>

              <Text style={styles.sectionTitle}>2. User Code of Conduct & Safety</Text>
              <Text style={styles.paragraph}>
                Members agree to:
              </Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Provide accurate contact and identity information during registration.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Not share QR check-in codes or account credentials with non-members.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Adhere to physical gym equipment safety rules and personal trainer instructions.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>3. Physical Activity & Liability Waiver</Text>
              <Text style={styles.paragraph}>
                Physical exercise involves inherent risk of physical injury. You are advised to consult a medical physician prior to commencing intense weight training or strict dietary regimens. FitCore and its software operators are not liable for physical injury resulting from independent workout routines.
              </Text>

              <Text style={styles.sectionTitle}>4. Payment & Billing for Gym Services</Text>
              <Text style={styles.paragraph}>
                Payments for physical gym memberships, lockers, and personal training packages are recorded as physical service transactions. Invoices issued through the app reflect the settlement with your local gym branch.
              </Text>

              <Text style={styles.sectionTitle}>5. Account Termination</Text>
              <Text style={styles.paragraph}>
                We reserve the right to suspend or terminate accounts in cases of fraudulent activity, harassment, or violation of gym facility guidelines.
              </Text>
            </View>
          )}

          {/* ── DATA SAFETY & SUMMARY ── */}
          {activeDoc === 'data' && (
            <View style={styles.docCard}>
              <View style={styles.effectiveBadge}>
                <Text style={styles.effectiveBadgeText}>TRANSPARENCY & CONTROL</Text>
              </View>
              <Text style={styles.docMainHeading}>Data Safety & Privacy Summary</Text>

              <Text style={styles.paragraph}>
                Google Play Data Safety and your personal privacy are of paramount importance to us. Below is an itemized breakdown of what data is collected and why.
              </Text>

              {/* Data Items Table */}
              <View style={styles.dataTableRow}>
                <Icon name="person" size={moderateScale(18)} color="#6C5CE7" />
                <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                  <Text style={styles.dataRowTitle}>Personal Information</Text>
                  <Text style={styles.dataRowDesc}>Name, Phone, Email, Profile Picture</Text>
                  <Text style={styles.dataRowPurpose}>Purpose: Account management & gym check-in identification</Text>
                </View>
              </View>

              <View style={styles.dataTableRow}>
                <Icon name="fitness" size={moderateScale(18)} color="#00A86B" />
                <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                  <Text style={styles.dataRowTitle}>Fitness & Nutrition Info</Text>
                  <Text style={styles.dataRowDesc}>Weight logs, Workout routines, Meal schedules</Text>
                  <Text style={styles.dataRowPurpose}>Purpose: Gym coaching, progress charts & trainer sync</Text>
                </View>
              </View>

              <View style={styles.dataTableRow}>
                <Icon name="receipt" size={moderateScale(18)} color="#D97706" />
                <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                  <Text style={styles.dataRowTitle}>Purchase & Billing History</Text>
                  <Text style={styles.dataRowDesc}>Membership invoices, Transaction dates, Amounts</Text>
                  <Text style={styles.dataRowPurpose}>Purpose: Gym tax compliance & membership verification</Text>
                </View>
              </View>

              <View style={styles.dataTableRow}>
                <Icon name="phone-portrait" size={moderateScale(18)} color="#475569" />
                <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                  <Text style={styles.dataRowTitle}>Device Identifiers & Tokens</Text>
                  <Text style={styles.dataRowDesc}>FCM notification token, OS version</Text>
                  <Text style={styles.dataRowPurpose}>Purpose: Gym class reminders & security notifications</Text>
                </View>
              </View>

              <View style={styles.securityHighlightBox}>
                <Icon name="shield-checkmark" size={moderateScale(22)} color="#10B981" />
                <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                  <Text style={styles.securityTitle}>Encrypted in Transit & At Rest</Text>
                  <Text style={styles.securityDesc}>
                    All data transmissions are protected via SSL/TLS 256-bit encryption. Data deletion requests are processed automatically.
                  </Text>
                </View>
              </View>
            </View>
          )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(5),
    borderRadius: moderateScale(14),
    padding: moderateScale(4),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(10),
  },
  tabBtnActive: {
    backgroundColor: '#EEF2FF',
  },
  tabBtnText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  contentScroll: {
    paddingHorizontal: wp(5),
  },
  publicUrlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  publicUrlIconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicUrlTitle: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  publicUrlText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#6C5CE7',
    marginTop: 1,
  },
  openExternalBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  effectiveBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
    alignSelf: 'flex-start',
    marginBottom: moderateScale(8),
  },
  effectiveBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  docMainHeading: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: moderateScale(12),
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: hp(1.8),
    marginBottom: moderateScale(6),
  },
  paragraph: {
    fontSize: fontScale(12),
    color: '#475569',
    lineHeight: fontScale(18),
    marginBottom: moderateScale(8),
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: moderateScale(6),
    paddingLeft: moderateScale(4),
  },
  bulletDot: {
    fontSize: fontScale(14),
    color: '#6C5CE7',
    marginRight: moderateScale(6),
    lineHeight: fontScale(18),
  },
  bulletText: {
    flex: 1,
    fontSize: fontScale(11.5),
    color: '#475569',
    lineHeight: fontScale(17),
  },
  bold: {
    fontWeight: '800',
    color: '#0F172A',
  },

  // Data Safety Table
  dataTableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dataRowTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  dataRowDesc: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  dataRowPurpose: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#6C5CE7',
    marginTop: 3,
  },
  securityHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  securityTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#065F46',
  },
  securityDesc: {
    fontSize: fontScale(10.5),
    color: '#047857',
    marginTop: 2,
    lineHeight: fontScale(15),
  },
});
