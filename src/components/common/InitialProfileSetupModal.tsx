import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { apiService } from '../../services/api';

interface InitialProfileSetupModalProps {
  visible: boolean;
  member: any;
  onComplete: (updatedData: any) => void;
}

export default function InitialProfileSetupModal({
  visible,
  member,
  onComplete,
}: InitialProfileSetupModalProps) {
  const [weight, setWeight] = useState(member?.weight ? String(member.weight) : '');
  const [height, setHeight] = useState(member?.height ? String(member.height) : '');
  const [age, setAge] = useState(member?.age ? String(member.age) : '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(
    member?.gender === 'Female' ? 'Female' : 'Male'
  );
  const [emergencyContact, setEmergencyContact] = useState(
    member?.emergencyContact || ''
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    member?.emergencyPhone || ''
  );
  const [address, setAddress] = useState(member?.address || '');
  const [goal, setGoal] = useState<'fat_loss' | 'muscle_building' | 'general_fitness'>(
    member?.goal || 'general_fitness'
  );
  const [saving, setSaving] = useState(false);

  // Live Dynamic BMI Computation
  const calculatedBMI = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      return Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    }
    return null;
  }, [weight, height]);

  const bmiCategory = useMemo(() => {
    if (!calculatedBMI) return null;
    if (calculatedBMI < 18.5) return { label: 'Underweight', color: '#D97706', bg: '#FEF3C7' };
    if (calculatedBMI <= 24.9) return { label: 'Normal Weight', color: '#059669', bg: '#D1FAE5' };
    if (calculatedBMI <= 29.9) return { label: 'Overweight', color: '#EA580C', bg: '#FFEDD5' };
    return { label: 'Obese', color: '#DC2626', bg: '#FEE2E2' };
  }, [calculatedBMI]);

  const handleSave = async () => {
    if (!weight.trim() || !height.trim()) {
      Alert.alert('Missing Details', 'Please enter your current body Weight (kg) and Height (cm).');
      return;
    }
    if (!emergencyPhone.trim() || emergencyPhone.trim().length < 10) {
      Alert.alert('Emergency Contact', 'Please provide a valid 10-digit emergency contact phone number.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Missing Details', 'Please enter your residential address or city.');
      return;
    }

    const numWeight = parseFloat(weight);
    const numHeight = parseFloat(height);
    const numAge = age ? parseInt(age, 10) : undefined;

    if (isNaN(numWeight) || numWeight <= 20 || numWeight >= 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 20 kg and 300 kg.');
      return;
    }
    if (isNaN(numHeight) || numHeight <= 50 || numHeight >= 250) {
      Alert.alert('Invalid Height', 'Please enter a valid height between 50 cm and 250 cm.');
      return;
    }

    setSaving(true);
    try {
      const memberId = member?.userId || member?.id || member?._id || member?.phone;
      const payload = {
        memberId,
        weight: numWeight,
        height: numHeight,
        bmi: calculatedBMI || undefined,
        age: numAge,
        gender,
        emergencyContact: emergencyContact.trim() || 'Family',
        emergencyPhone: emergencyPhone.trim(),
        address: address.trim(),
        goal,
      };

      await apiService.savePersonalDetails(payload);
      const storageKey = `@fitcore_profile_setup_done_${memberId}`;
      await AsyncStorage.setItem(storageKey, 'true');

      onComplete({
        ...member,
        ...payload,
        hasCompletedProfileSetup: true,
      });
    } catch (e: any) {
      Alert.alert('Save Error', e?.message || 'Could not save profile details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Icon name="sparkles" size={moderateScale(12)} color="#6C5CE7" />
              <Text style={styles.stepBadgeText}>INITIAL ATHLETE SETUP</Text>
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Enter your baseline body metrics & emergency details to unlock workouts & gym access.
            </Text>
          </View>

          {/* Responsive Scroll Body */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section 1: Physical Measurements */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconCirclePurple}>
                  <Icon name="speedometer-outline" size={moderateScale(16)} color="#6C5CE7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Physical Measurements</Text>
                  <Text style={styles.sectionSub}>Calculates your BMI & calorie goals</Text>
                </View>
              </View>

              {/* Weight & Height Responsive Row */}
              <View style={styles.twoColRow}>
                {/* Weight */}
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Weight *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="70"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      value={weight}
                      onChangeText={setWeight}
                      maxLength={5}
                    />
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitText}>kg</Text>
                    </View>
                  </View>
                </View>

                {/* Height */}
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Height *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="175"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      value={height}
                      onChangeText={setHeight}
                      maxLength={5}
                    />
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitText}>cm</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Dynamic BMI Banner */}
              {calculatedBMI && bmiCategory ? (
                <View style={[styles.bmiCard, { backgroundColor: bmiCategory.bg }]}>
                  <Icon name="fitness" size={moderateScale(15)} color={bmiCategory.color} />
                  <Text style={[styles.bmiText, { color: bmiCategory.color }]} numberOfLines={1}>
                    Calculated BMI: <Text style={{ fontWeight: '900' }}>{calculatedBMI}</Text>
                    {' • '}
                    <Text style={{ fontWeight: '800' }}>{bmiCategory.label}</Text>
                  </Text>
                </View>
              ) : null}

              {/* Age & Gender Responsive Row */}
              <View style={[styles.twoColRow, { marginTop: hp(1.2) }]}>
                {/* Age */}
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="24"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={age}
                      onChangeText={setAge}
                      maxLength={3}
                    />
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitText}>yrs</Text>
                    </View>
                  </View>
                </View>

                {/* Gender */}
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.genderTabs}>
                    {(['Male', 'Female'] as const).map((g) => {
                      const isSelected = gender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[styles.genderTabBtn, isSelected && styles.genderTabBtnActive]}
                          onPress={() => setGender(g)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.genderTabText,
                              isSelected && styles.genderTabTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Section 2: Fitness Goal */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconCircleIndigo}>
                  <Icon name="flame-outline" size={moderateScale(16)} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Primary Fitness Goal</Text>
                  <Text style={styles.sectionSub}>Customizes your workout plan</Text>
                </View>
              </View>

              <View style={styles.goalGrid}>
                {[
                  {
                    key: 'fat_loss',
                    label: 'Fat Loss',
                    sub: 'Burn fat & build lean muscle',
                    icon: 'flash-outline',
                  },
                  {
                    key: 'muscle_building',
                    label: 'Muscle Gain',
                    sub: 'Hypertrophy & raw strength',
                    icon: 'barbell-outline',
                  },
                  {
                    key: 'general_fitness',
                    label: 'General Fitness',
                    sub: 'Stay energized, active & fit',
                    icon: 'heart-outline',
                  },
                ].map((item) => {
                  const isSelected = goal === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.goalCard, isSelected && styles.goalCardActive]}
                      onPress={() => setGoal(item.key as any)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.goalIconBox, isSelected && styles.goalIconBoxActive]}>
                        <Icon
                          name={item.icon}
                          size={moderateScale(16)}
                          color={isSelected ? '#6C5CE7' : '#64748B'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.goalTitle, isSelected && styles.goalTitleActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.goalSub} numberOfLines={1}>{item.sub}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Emergency Contact & Address */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconCircleRose}>
                  <Icon name="shield-checkmark-outline" size={moderateScale(16)} color="#E11D48" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Emergency & Address</Text>
                  <Text style={styles.sectionSub}>Member safety & verification records</Text>
                </View>
              </View>

              {/* Emergency Contact Name */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Emergency Contact Person</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="person-outline" size={moderateScale(15)} color="#94A3B8" style={{ marginLeft: moderateScale(10) }} />
                  <TextInput
                    style={[styles.inputField, { paddingLeft: moderateScale(8) }]}
                    placeholder="e.g. Father / Gaurav"
                    placeholderTextColor="#94A3B8"
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                  />
                </View>
              </View>

              {/* Emergency Contact Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Emergency Phone Number *</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="call-outline" size={moderateScale(15)} color="#94A3B8" style={{ marginLeft: moderateScale(10) }} />
                  <TextInput
                    style={[styles.inputField, { paddingLeft: moderateScale(8) }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={emergencyPhone}
                    onChangeText={setEmergencyPhone}
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Residential Address */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Residential Address / City *</Text>
                <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: moderateScale(8) }]}>
                  <Icon name="location-outline" size={moderateScale(15)} color="#94A3B8" style={{ marginLeft: moderateScale(10), marginTop: 2 }} />
                  <TextInput
                    style={[styles.inputField, styles.multilineField, { paddingLeft: moderateScale(8) }]}
                    placeholder="e.g. Flat 102, Green Avenue, Nagpur"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={2}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>
            </View>

            <View style={{ height: hp(2) }} />
          </ScrollView>

          {/* Sticky Save Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnInnerRow}>
                  <Text style={styles.saveButtonText}>Save & Enter Dashboard</Text>
                  <Icon name="arrow-forward" size={moderateScale(16)} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },

  // ── Header Bar ──
  header: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    paddingBottom: hp(1.8),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    alignSelf: 'flex-start',
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(8),
    marginBottom: hp(0.6),
  },
  stepBadgeText: {
    color: '#6C5CE7',
    fontSize: fontScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: fontScale(21),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: hp(0.4),
    lineHeight: fontScale(16.5),
    fontWeight: '500',
  },

  // ── Scroll Content ──
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1.8),
    paddingBottom: hp(3),
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(9),
    marginBottom: hp(1.3),
  },
  iconCirclePurple: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(9),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleIndigo: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(9),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRose: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(9),
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },

  // ── Responsive Two Column Row ──
  twoColRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  formGroup: {
    marginBottom: hp(1.2),
  },
  fieldLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#334155',
    marginBottom: moderateScale(5),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(11),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    minHeight: moderateScale(42),
  },
  inputField: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: moderateScale(10),
    paddingVertical: Platform.OS === 'ios' ? moderateScale(10) : moderateScale(7),
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  multilineField: {
    minHeight: hp(7),
    textAlignVertical: 'top',
  },
  unitBadge: {
    backgroundColor: '#ECEAFD',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(7),
    marginRight: moderateScale(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  // ── BMI Preview Card ──
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingVertical: moderateScale(7),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(9),
    marginTop: hp(1),
  },
  bmiText: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
    flex: 1,
  },

  // ── Gender Tabs ──
  genderTabs: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(11),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 3,
    height: moderateScale(42),
  },
  genderTabBtn: {
    flex: 1,
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderTabBtnActive: {
    backgroundColor: '#6C5CE7',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  genderTabText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  genderTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ── Goals Grid ──
  goalGrid: {
    gap: moderateScale(8),
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    backgroundColor: '#F8FAFC',
    padding: moderateScale(11),
    borderRadius: moderateScale(13),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  goalCardActive: {
    backgroundColor: '#F3F2FE',
    borderColor: '#6C5CE7',
  },
  goalIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(9),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalIconBoxActive: {
    backgroundColor: '#ECEAFD',
    borderColor: '#6C5CE7',
  },
  goalTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#334155',
  },
  goalTitleActive: {
    color: '#6C5CE7',
  },
  goalSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#6C5CE7',
  },
  radioDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#6C5CE7',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: wp(4.5),
    paddingVertical: hp(1.5),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEAFD',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(13),
    paddingVertical: hp(1.6),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(14),
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
