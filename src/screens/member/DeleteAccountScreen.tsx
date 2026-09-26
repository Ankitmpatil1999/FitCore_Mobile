import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';

export default function DeleteAccountScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentUser, currentMember, logout } = useAppContext();

  const [step, setStep] = useState<'warn' | 'confirm' | 'processing' | 'done'>('warn');
  const [selectedReason, setSelectedReason] = useState<string>('Moving to another gym / city');
  const [confirmText, setConfirmText] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const REASONS = [
    'Moving to another gym / city',
    'Subscription expired, not renewing',
    'Privacy concerns / data protection',
    'Switching to different workout app',
    'Other reason',
  ];

  const handleProceedToConfirm = () => {
    setStep('confirm');
  };

  const handleExecuteDeletion = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE in the box to confirm your request.');
      return;
    }

    setIsDeleting(true);
    setStep('processing');

    try {
      const targetPhoneOrId = currentMember?.phone || currentUser?.phone || currentMember?.id || currentUser?.id || 'm1';
      const res: any = await apiService.deleteAccount(targetPhoneOrId, selectedReason);
      
      setIsDeleting(false);
      if (res && res.success !== false) {
        setStep('done');
      } else {
        Alert.alert('Deletion Error', res?.message || 'Unable to delete account right now.');
        setStep('confirm');
      }
    } catch (err: any) {
      setIsDeleting(false);
      Alert.alert('Error', err?.message || 'Unable to process account deletion at this moment. Please try again.');
      setStep('confirm');
    }
  };

  const handleFinalLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (step === 'done' ? handleFinalLogout() : navigation.goBack())}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={moderateScale(20)} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
            <Text style={styles.headerTitle}>Delete Account</Text>
            <Text style={styles.headerSub}>Google Play Data Safety & GDPR Compliance</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(6) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── STEP 1: WARNING & DISCLOSURE ── */}
          {step === 'warn' && (
            <View>
              {/* Danger Hero Card */}
              <View style={styles.dangerHeroCard}>
                <View style={styles.dangerIconBox}>
                  <Icon name="warning" size={moderateScale(28)} color="#DC2626" />
                </View>
                <Text style={styles.dangerHeroTitle}>Permanent Account Deletion</Text>
                <Text style={styles.dangerHeroSub}>
                  Deleting your FitCore account is permanent and cannot be undone. Please review what data will be removed.
                </Text>
              </View>

              {/* What gets deleted */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>WHAT WILL BE PERMANENTLY PURGED</Text>
                <View style={styles.deletionItem}>
                  <Icon name="close-circle" size={moderateScale(18)} color="#EF4444" />
                  <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                    <Text style={styles.itemTitle}>Profile & Contact Details</Text>
                    <Text style={styles.itemDesc}>Name, phone number, email, and member credentials</Text>
                  </View>
                </View>

                <View style={styles.deletionItem}>
                  <Icon name="close-circle" size={moderateScale(18)} color="#EF4444" />
                  <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                    <Text style={styles.itemTitle}>Workout & Diet Records</Text>
                    <Text style={styles.itemDesc}>All exercise sets, personal records, and meal plans</Text>
                  </View>
                </View>

                <View style={styles.deletionItem}>
                  <Icon name="close-circle" size={moderateScale(18)} color="#EF4444" />
                  <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                    <Text style={styles.itemTitle}>Turnstile / QR Check-In History</Text>
                    <Text style={styles.itemDesc}>Daily gym check-in streak and timestamp records</Text>
                  </View>
                </View>
              </View>

              {/* Reason Selector */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>REASON FOR DELETION (OPTIONAL)</Text>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonRow, selectedReason === r && styles.reasonRowActive]}
                    onPress={() => setSelectedReason(r)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, selectedReason === r && styles.radioCircleActive]}>
                      {selectedReason === r && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.reasonText, selectedReason === r && styles.reasonTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>



              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleProceedToConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>CONTINUE TO CONFIRMATION</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: CONFIRMATION & AUTH ── */}
          {step === 'confirm' && (
            <View>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Type "DELETE" to Confirm</Text>
                <Text style={styles.confirmSub}>
                  To prevent accidental account loss, please type <Text style={{ fontWeight: '900', color: '#EF4444' }}>DELETE</Text> in the input below.
                </Text>

                <TextInput
                  style={styles.confirmInput}
                  placeholder='Type "DELETE"'
                  placeholderTextColor="#94A3B8"
                  value={confirmText}
                  onChangeText={setConfirmText}
                  autoCapitalize="characters"
                />

                <Text style={styles.inputLabel}>ENTER YOUR CURRENT PASSWORD / PIN</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Account security password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                />

                {/* Final Danger Delete Button */}
                <TouchableOpacity
                  style={[
                    styles.finalDeleteBtn,
                    confirmText.trim().toUpperCase() !== 'DELETE' && { opacity: 0.5 },
                  ]}
                  onPress={handleExecuteDeletion}
                  disabled={confirmText.trim().toUpperCase() !== 'DELETE'}
                  activeOpacity={0.85}
                >
                  <Icon name="trash" size={moderateScale(18)} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.finalDeleteBtnText}>PERMANENTLY DELETE MY ACCOUNT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setStep('warn')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>CANCEL & KEEP MY ACCOUNT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 3: PROCESSING ── */}
          {step === 'processing' && (
            <View style={styles.centerStatusCard}>
              <ActivityIndicator size="large" color="#EF4444" style={{ marginBottom: hp(2) }} />
              <Text style={styles.statusTitle}>Purging Member Data...</Text>
              <Text style={styles.statusSub}>
                Removing workout records, cloud tokens, attendance streaks, and security credentials.
              </Text>
            </View>
          )}

          {/* ── STEP 4: COMPLETED ── */}
          {step === 'done' && (
            <View style={styles.centerStatusCard}>
              <View style={styles.successIconBox}>
                <Icon name="checkmark-done" size={moderateScale(42)} color="#10B981" />
              </View>
              <Text style={styles.doneTitle}>Account Successfully Deleted</Text>
              <Text style={styles.doneSub}>
                Your FitCore account and associated personal fitness records have been permanently purged from our primary database in compliance with Google Play data safety policies.
              </Text>

              <TouchableOpacity
                style={styles.logoutExitBtn}
                onPress={handleFinalLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.logoutExitBtnText}>RETURN TO LOGIN</Text>
              </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // Danger Hero
  dangerHeroCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dangerIconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  dangerHeroTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#991B1B',
  },
  dangerHeroSub: {
    fontSize: fontScale(11),
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: fontScale(16),
  },

  // Card Section
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  sectionHeader: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: moderateScale(12),
  },
  deletionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  itemTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },
  itemDesc: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },

  // Reason
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(4),
  },
  reasonRowActive: {
    backgroundColor: '#F8FAFC',
  },
  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  radioCircleActive: {
    borderColor: '#EF4444',
  },
  radioInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#EF4444',
  },
  reasonText: {
    fontSize: fontScale(11.5),
    color: '#475569',
    fontWeight: '600',
  },
  reasonTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  webNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: hp(2),
    gap: moderateScale(8),
  },
  webNoticeText: {
    flex: 1,
    fontSize: fontScale(10.5),
    color: '#475569',
    lineHeight: fontScale(15),
  },

  continueBtn: {
    backgroundColor: '#EF4444',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Confirm Card
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  confirmTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  confirmSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 4,
    marginBottom: hp(2),
    lineHeight: fontScale(16),
  },
  confirmInput: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: hp(1.5),
  },
  inputLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: moderateScale(6),
  },
  passwordInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: fontScale(13),
    color: '#0F172A',
    marginBottom: hp(2),
  },
  finalDeleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginBottom: hp(1),
  },
  finalDeleteBtnText: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  cancelBtn: {
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#64748B',
  },

  centerStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(26),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginTop: hp(4),
  },
  statusTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  statusSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(17),
  },
  successIconBox: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  doneTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#065F46',
    marginBottom: 6,
  },
  doneSub: {
    fontSize: fontScale(11.5),
    color: '#047857',
    textAlign: 'center',
    lineHeight: fontScale(17),
    marginBottom: hp(2.5),
  },
  logoutExitBtn: {
    backgroundColor: '#10B981',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
  },
  logoutExitBtnText: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
