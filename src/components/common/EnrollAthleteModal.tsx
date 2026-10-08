import React, { useState, useEffect, useMemo } from 'react';
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
import AppIcon from './AppIcon';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import apiService from '../../services/api';

export interface PackageItem {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  durationDays?: number;
  durationMonths?: number;
  description?: string;
  isPopular?: boolean;
}

export interface TrainerItem {
  id?: string;
  _id?: string;
  name: string;
  phone?: string;
  specialty?: string;
  fee?: number;
  monthlyFee?: number;
  salary?: number;
}

interface EnrollAthleteModalProps {
  visible: boolean;
  gymId: string;
  gymName: string;
  packages?: PackageItem[];
  trainers?: TrainerItem[];
  onClose: () => void;
  onSuccess: (newMember: any) => void;
}

export default function EnrollAthleteModal({
  visible,
  gymId,
  gymName,
  packages: propPackages,
  trainers: propTrainers,
  onClose,
  onSuccess,
}: EnrollAthleteModalProps) {
  // Dynamic API state for packages and trainers (100% MongoDB)
  const [livePackages, setLivePackages] = useState<PackageItem[]>([]);
  const [liveTrainers, setLiveTrainers] = useState<TrainerItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [address, setAddress] = useState('');

  // Dropdown States
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>('Morning Batch (06:00 AM - 11:30 AM)');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerItem | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>('Cash Collection');

  // Dropdown Picker Modals
  const [showPackagePicker, setShowPackagePicker] = useState(false);
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [showTrainerPicker, setShowTrainerPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  // Billing Fields
  const [planPrice, setPlanPrice] = useState<string>('');
  const [admissionFee, setAdmissionFee] = useState('');
  const [adminDiscount, setAdminDiscount] = useState('');
  const [coachFee, setCoachFee] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    name: string;
    phone: string;
    plan: string;
    amountPaid: number;
    shift: string;
  } | null>(null);

  // Load real packages & trainers directly from MongoDB API on open
  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      setLoadingInitial(true);
      try {
        const [pkgRes, trnRes] = await Promise.all([
          apiService.getOwnerPackages(gymId).catch(() => ({ success: false, data: [] })),
          apiService.getOwnerTrainers(gymId).catch(() => ({ success: false, data: [] })),
        ]);

        let resolvedPkgs: PackageItem[] = [];
        if (pkgRes.success && Array.isArray(pkgRes.data) && pkgRes.data.length > 0) {
          resolvedPkgs = pkgRes.data;
        } else if (propPackages && propPackages.length > 0) {
          resolvedPkgs = propPackages;
        }
        setLivePackages(resolvedPkgs);

        if (resolvedPkgs.length > 0) {
          const initialPkg = resolvedPkgs.find((p) => p.isPopular) || resolvedPkgs[0];
          setSelectedPackage(initialPkg);
          setPlanPrice(String(initialPkg.price || 0));
        } else {
          setSelectedPackage(null);
          setPlanPrice('0');
        }

        let resolvedTrns: TrainerItem[] = [];
        if (trnRes.success && Array.isArray(trnRes.data)) {
          resolvedTrns = trnRes.data;
        } else if (propTrainers) {
          resolvedTrns = propTrainers;
        }
        setLiveTrainers(resolvedTrns);
      } catch (err) {
        console.log('Error loading enrollment meta:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [visible, gymId]);

  // Packages & Trainers list (100% Live DB)
  const availablePackages = livePackages;
  const availableTrainers = liveTrainers;

  const shiftOptions = [
    { label: 'Morning Batch', time: '06:00 AM - 11:30 AM', icon: 'time' },
    { label: 'Evening Batch', time: '04:00 PM - 10:00 PM', icon: 'time' },
  ];

  const paymentOptions = [
    { label: 'Cash Collection', sub: 'Direct cash handover at desk', icon: 'cash' },
  ];

  // Select package handler
  const handleSelectPackage = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setPlanPrice(String(pkg.price));
    setShowPackagePicker(false);
  };

  // Live calculation of Total Payable
  const totalPayable = useMemo(() => {
    const base = parseFloat(planPrice) || 0;
    const disc = parseFloat(adminDiscount) || 0;
    const reg = parseFloat(admissionFee) || 0;
    const pt = selectedTrainer ? parseFloat(coachFee) || 0 : 0;
    const discountedBase = Math.max(0, base - disc);
    return discountedBase + reg + pt;
  }, [planPrice, adminDiscount, admissionFee, selectedTrainer, coachFee]);

  const resetForm = () => {
    setFullName('');
    setMobileNumber('');
    setEmailAddress('');
    setGender('Male');
    setAge('');
    setWeight('');
    setHeight('');
    setAddress('');
    setSelectedTrainer(null);
    setCoachFee('');
    setAdminDiscount('');
    setAdmissionFee('');
    setPaymentMode('Cash Collection');
    setSelectedShift('Morning Batch (06:00 AM - 11:30 AM)');
    if (availablePackages.length > 0) {
      const pop = availablePackages.find((p) => p.isPopular) || availablePackages[0];
      setSelectedPackage(pop);
      setPlanPrice(String(pop.price));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEnroll = async () => {
    const cleanName = fullName.trim();
    const cleanPhone = mobileNumber.replace(/\D/g, '');

    if (!cleanName) {
      Alert.alert('Required Field', 'Please enter Member Full Name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const durationDays = selectedPackage?.durationDays || 30;
      const durationMonths =
        selectedPackage?.durationMonths ||
        (durationDays >= 365 ? 12 : durationDays >= 180 ? 6 : durationDays >= 90 ? 3 : 1);

      const payload = {
        gymId,
        gymName,
        name: cleanName,
        phone: cleanPhone,
        email: emailAddress.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        gender,
        age: age ? parseInt(age, 10) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        address: address.trim(),
        plan: selectedPackage?.name || 'Standard Membership',
        planPrice: parseFloat(planPrice) || selectedPackage?.price || 1499,
        durationDays,
        durationMonths,
        shift: selectedShift,
        discountAmount: parseFloat(adminDiscount) || 0,
        admissionFee: parseFloat(admissionFee) || 0,
        needsTrainer: !!selectedTrainer,
        assignedTrainerId: selectedTrainer ? (selectedTrainer._id || selectedTrainer.id) : undefined,
        assignedTrainerName: selectedTrainer ? selectedTrainer.name : undefined,
        trainerFee: selectedTrainer ? parseFloat(coachFee) || 0 : 0,
        paymentMode,
        amountPaid: totalPayable,
        feesPaid: totalPayable,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
      };

      const res = await apiService.createOwnerMember(payload);
      if (res.success) {
        setSuccessData({
          name: cleanName,
          phone: cleanPhone,
          plan: payload.plan,
          amountPaid: totalPayable,
          shift: selectedShift,
        });
      } else {
        Alert.alert('Notice', res.error || 'Failed to add member.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not add member. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* ── TOP APP BAR ── */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <AppIcon name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.titleCenterWrap}>
            <Text style={styles.appBarTitle}>Add New Member</Text>
            <Text style={styles.appBarSub}>{gymName}</Text>
          </View>
          <View style={{ width: moderateScale(38) }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── SECTION 1: ATHLETE PERSONAL PROFILE ── */}
            <View style={styles.mobileCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <AppIcon name="person-add" size={16} color="#4F46E5" />
                </View>
                <Text style={styles.cardHeaderTitle}>Personal Profile</Text>
              </View>

              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter member's full name"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Mobile Number (Login ID) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <View style={styles.phonePrefixBox}>
                    <Text style={styles.phonePrefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                  />
                </View>
              </View>

              {/* Gender Segmented Pills */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Gender <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.genderRow}>
                  {(['Male', 'Female', 'Other'] as const).map((g) => {
                    const isSel = gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderPill, isSel && styles.genderPillActive]}
                        onPress={() => setGender(g)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.genderPillText, isSel && styles.genderPillTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Age & Weight 2-Col Grid */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Age (Yrs)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 24"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={3}
                      value={age}
                      onChangeText={setAge}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Weight (Kg)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 72"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={weight}
                      onChangeText={setWeight}
                    />
                  </View>
                </View>
              </View>

              {/* Residential Address */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Residential Address / Area</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter locality / city"
                    placeholderTextColor="#94A3B8"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>
            </View>

            {/* ── SECTION 2: PLAN & WORKOUT CONFIGURATION ── */}
            <View style={styles.mobileCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <AppIcon name="plan" size={16} color="#16A34A" />
                </View>
                <Text style={styles.cardHeaderTitle}>Plan & Shift Selection</Text>
              </View>

              {/* Dropdown 1: Membership Package */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Membership Package <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setShowPackagePicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownTriggerVal}>
                      {selectedPackage?.name || 'Select Membership Plan'}
                    </Text>
                    <Text style={styles.dropdownTriggerSub}>
                      ₹{(selectedPackage?.price || 0).toLocaleString('en-IN')} • {selectedPackage?.durationDays || 30} Days Access
                    </Text>
                  </View>
                  <View style={styles.dropdownChevronBox}>
                    <AppIcon name="chevron-forward" size={16} color="#4F46E5" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Dropdown 2: Preferred Shift / Batch */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Workout Shift / Batch</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setShowShiftPicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownTriggerVal}>{selectedShift}</Text>
                    <Text style={styles.dropdownTriggerSub}>Turnstile Access Window</Text>
                  </View>
                  <View style={styles.dropdownChevronBox}>
                    <AppIcon name="chevron-forward" size={16} color="#64748B" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Dropdown 3: Personal Coach Assignment */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Personal Coach / Trainer</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setShowTrainerPicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownTriggerVal}>
                      {selectedTrainer ? selectedTrainer.name : 'Self Workout (No Coach)'}
                    </Text>
                    <Text style={styles.dropdownTriggerSub}>
                      {selectedTrainer ? `${selectedTrainer.specialty || 'Coach'} • Fee: ₹${coachFee || selectedTrainer.fee || 0}` : 'Self paced training without personal trainer'}
                    </Text>
                  </View>
                  <View style={styles.dropdownChevronBox}>
                    <AppIcon name="chevron-forward" size={16} color="#64748B" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Trainer Fee adjustment if trainer selected */}
              {selectedTrainer && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Trainer Monthly Fee (₹)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Coach fee"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={coachFee}
                      onChangeText={setCoachFee}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* ── SECTION 3: FEES, DISCOUNTS & PAYMENT ── */}
            <View style={styles.mobileCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <AppIcon name="wallet" size={16} color="#D97706" />
                </View>
                <Text style={styles.cardHeaderTitle}>Billing & Payment Mode</Text>
              </View>

              {/* Base Plan Price & Discount */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Plan Fee (₹)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Fee"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={planPrice}
                      onChangeText={setPlanPrice}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { color: '#EF4444' }]}>Special Discount (₹)</Text>
                  <View style={[styles.inputContainer, { borderColor: '#FECACA' }]}>
                    <TextInput
                      style={[styles.textInput, { color: '#DC2626' }]}
                      placeholder="0"
                      placeholderTextColor="#F87171"
                      keyboardType="numeric"
                      value={adminDiscount}
                      onChangeText={setAdminDiscount}
                    />
                  </View>
                </View>
              </View>

              {/* Admission Fee */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Registration / Admission Fee (₹)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0 (Optional one-time fee)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={admissionFee}
                    onChangeText={setAdmissionFee}
                  />
                </View>
              </View>

              {/* Dropdown 4: Payment Mode */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Payment Mode <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setShowPaymentPicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownTriggerVal}>{paymentMode}</Text>
                    <Text style={styles.dropdownTriggerSub}>Auto-generated digital receipt</Text>
                  </View>
                  <View style={styles.dropdownChevronBox}>
                    <AppIcon name="chevron-forward" size={16} color="#4F46E5" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: hp(3) }} />
          </ScrollView>

          {/* ── STICKY BOTTOM CHECKOUT SUMMARY (ABOVE ANDROID 3-BUTTON NAV BAR) ── */}
          <View style={styles.stickyBottomBar}>
            <View style={styles.bottomSummaryLeft}>
              <Text style={styles.bottomSummaryLabel}>TOTAL PAYABLE</Text>
              <Text style={styles.bottomSummaryPrice}>
                ₹{totalPayable.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.bottomSummaryPlan} numberOfLines={1}>
                {selectedPackage?.name || 'Selected Plan'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.enrollActionBtn, submitting && { opacity: 0.7 }]}
              onPress={handleEnroll}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.enrollActionBtnText}>Collect & Enroll</Text>
                  <AppIcon name="checkmark" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* ═══════════════════════════════════════════════════════════
            DROPDOWN MODAL 1: MEMBERSHIP PACKAGES PICKER
        ═══════════════════════════════════════════════════════════ */}
        <Modal
          visible={showPackagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPackagePicker(false)}
        >
          <View style={styles.pickerBackdrop}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerSheetHeader}>
                <View>
                  <Text style={styles.pickerSheetTitle}>Select Membership Plan</Text>
                  <Text style={styles.pickerSheetSub}>Choose duration and pricing</Text>
                </View>
                <TouchableOpacity
                  style={styles.pickerCloseBtn}
                  onPress={() => setShowPackagePicker(false)}
                >
                  <AppIcon name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: hp(50) }} showsVerticalScrollIndicator={false}>
                {availablePackages.length > 0 ? (
                  availablePackages.map((pkg) => {
                    const isSel = selectedPackage?.name === pkg.name;
                    return (
                      <TouchableOpacity
                        key={pkg.id || pkg._id || pkg.name}
                        style={[styles.pickerItemCard, isSel && styles.pickerItemCardSelected]}
                        onPress={() => handleSelectPackage(pkg)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={[styles.pickerItemName, isSel && styles.pickerItemNameSelected]}>
                              {pkg.name}
                            </Text>
                            {pkg.isPopular && (
                              <View style={styles.popularPill}>
                                <Text style={styles.popularPillText}>Popular</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.pickerItemDesc} numberOfLines={1}>
                            {pkg.description || `${pkg.durationDays || 30} Days unlimited access`}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                          <Text style={styles.pickerItemPrice}>₹{(pkg.price || 0).toLocaleString('en-IN')}</Text>
                          <Text style={styles.pickerItemDuration}>{pkg.durationDays || 30} Days</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyPickerWrap}>
                    <Text style={styles.emptyPickerText}>No membership packages created in Gym Database.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ═══════════════════════════════════════════════════════════
            DROPDOWN MODAL 2: SHIFT / BATCH PICKER
        ═══════════════════════════════════════════════════════════ */}
        <Modal
          visible={showShiftPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowShiftPicker(false)}
        >
          <View style={styles.pickerBackdrop}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerSheetHeader}>
                <View>
                  <Text style={styles.pickerSheetTitle}>Select Workout Shift</Text>
                  <Text style={styles.pickerSheetSub}>Turnstile access batch timing</Text>
                </View>
                <TouchableOpacity
                  style={styles.pickerCloseBtn}
                  onPress={() => setShowShiftPicker(false)}
                >
                  <AppIcon name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8 }}>
                {shiftOptions.map((sh) => {
                  const fullStr = `${sh.label} (${sh.time})`;
                  const isSel = selectedShift === fullStr;
                  return (
                    <TouchableOpacity
                      key={sh.label}
                      style={[styles.pickerItemCard, isSel && styles.pickerItemCardSelected]}
                      onPress={() => {
                        setSelectedShift(fullStr);
                        setShowShiftPicker(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerItemName, isSel && styles.pickerItemNameSelected]}>
                          {sh.label}
                        </Text>
                        <Text style={styles.pickerItemDesc}>{sh.time}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSel && styles.radioCircleActive]}>
                        {isSel && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* ═══════════════════════════════════════════════════════════
            DROPDOWN MODAL 3: PERSONAL TRAINER PICKER
        ═══════════════════════════════════════════════════════════ */}
        <Modal
          visible={showTrainerPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTrainerPicker(false)}
        >
          <View style={styles.pickerBackdrop}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerSheetHeader}>
                <View>
                  <Text style={styles.pickerSheetTitle}>Select Personal Trainer</Text>
                  <Text style={styles.pickerSheetSub}>Real-time registered gym coaches</Text>
                </View>
                <TouchableOpacity
                  style={styles.pickerCloseBtn}
                  onPress={() => setShowTrainerPicker(false)}
                >
                  <AppIcon name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: hp(45) }} showsVerticalScrollIndicator={false}>
                {/* Option 0: No Trainer */}
                <TouchableOpacity
                  style={[styles.pickerItemCard, !selectedTrainer && styles.pickerItemCardSelected]}
                  onPress={() => {
                    setSelectedTrainer(null);
                    setCoachFee('');
                    setShowTrainerPicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerItemName, !selectedTrainer && styles.pickerItemNameSelected]}>
                      Self Workout (No Coach)
                    </Text>
                    <Text style={styles.pickerItemDesc}>Member trains independently</Text>
                  </View>
                  <View style={[styles.radioCircle, !selectedTrainer && styles.radioCircleActive]}>
                    {!selectedTrainer && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>

                {availableTrainers.length > 0 ? (
                  availableTrainers.map((t) => {
                    const isSel = selectedTrainer?.name === t.name;
                    const trainerFee = Number(t.fee || t.monthlyFee || (t as any).salary || 0);
                    return (
                      <TouchableOpacity
                        key={t.id || t._id || t.name}
                        style={[styles.pickerItemCard, isSel && styles.pickerItemCardSelected]}
                        onPress={() => {
                          setSelectedTrainer(t);
                          setCoachFee(String(trainerFee));
                          setShowTrainerPicker(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pickerItemName, isSel && styles.pickerItemNameSelected]}>
                            {t.name}
                          </Text>
                          <Text style={styles.pickerItemDesc}>{t.specialty || 'Fitness Coach'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.pickerItemPrice}>
                            {trainerFee > 0 ? `+₹${trainerFee.toLocaleString('en-IN')}` : 'Included'}
                          </Text>
                          <Text style={styles.pickerItemDuration}>Monthly Fee</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ═══════════════════════════════════════════════════════════
            DROPDOWN MODAL 4: PAYMENT MODE PICKER
        ═══════════════════════════════════════════════════════════ */}
        <Modal
          visible={showPaymentPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPaymentPicker(false)}
        >
          <View style={styles.pickerBackdrop}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerSheetHeader}>
                <View>
                  <Text style={styles.pickerSheetTitle}>Select Payment Mode</Text>
                  <Text style={styles.pickerSheetSub}>Choose collection transaction method</Text>
                </View>
                <TouchableOpacity
                  style={styles.pickerCloseBtn}
                  onPress={() => setShowPaymentPicker(false)}
                >
                  <AppIcon name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8 }}>
                {paymentOptions.map((opt) => {
                  const isSel = paymentMode === opt.label;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.pickerItemCard, isSel && styles.pickerItemCardSelected]}
                      onPress={() => {
                        setPaymentMode(opt.label);
                        setShowPaymentPicker(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerItemName, isSel && styles.pickerItemNameSelected]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.pickerItemDesc}>{opt.sub}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSel && styles.radioCircleActive]}>
                        {isSel && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* ═══════════════════════════════════════════════════════════
            SUCCESS CONFIRMATION MODAL (CLEAN LUXURY IN-APP DIALOG)
        ═══════════════════════════════════════════════════════════ */}
        <Modal
          visible={!!successData}
          transparent
          animationType="fade"
          onRequestClose={() => {
            const data = successData;
            setSuccessData(null);
            resetForm();
            onSuccess(data);
          }}
        >
          <View style={styles.pickerBackdrop}>
            <View style={styles.successModalCard}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <AppIcon name="checkmark" size={24} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.successTitle}>Member Added Successfully</Text>
              <Text style={styles.successSub}>
                Gym member has been registered and assigned to active roster.
              </Text>

              {/* Summary Details Card */}
              <View style={styles.successDetailsBox}>
                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Member Name</Text>
                  <Text style={styles.successDetailVal}>{successData?.name}</Text>
                </View>

                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Mobile Number</Text>
                  <Text style={styles.successDetailVal}>+91 {successData?.phone}</Text>
                </View>

                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Membership Plan</Text>
                  <Text style={[styles.successDetailVal, { color: '#4F46E5', fontWeight: '800' }]}>
                    {successData?.plan}
                  </Text>
                </View>

                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Amount Collected</Text>
                  <Text style={[styles.successDetailVal, { color: '#16A34A', fontWeight: '900' }]}>
                    ₹{(successData?.amountPaid || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={[styles.successDetailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.successDetailLabel}>Workout Shift</Text>
                  <Text style={styles.successDetailVal}>
                    {successData?.shift?.includes('Morning') ? 'Morning Batch' : 'Evening Batch'}
                  </Text>
                </View>
              </View>

              {/* Done Button */}
              <TouchableOpacity
                style={styles.successDoneBtn}
                onPress={() => {
                  const data = successData;
                  setSuccessData(null);
                  resetForm();
                  onSuccess(data);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.successDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenterWrap: {
    alignItems: 'center',
  },
  appBarTitle: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  appBarSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
  },

  // Mobile Form Cards
  mobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: moderateScale(14),
  },
  cardHeaderIconBox: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },

  // Form Fields
  formGroup: {
    marginBottom: moderateScale(12),
  },
  formLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
    marginBottom: moderateScale(6),
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    minHeight: moderateScale(44),
  },
  textInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: moderateScale(8),
  },
  phonePrefixBox: {
    paddingRight: moderateScale(8),
    marginRight: moderateScale(8),
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
  },
  phonePrefixText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#4F46E5',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(12),
  },

  // Gender Segmented Row
  genderRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  genderPill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  genderPillText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  genderPillTextActive: {
    color: '#4F46E5',
  },

  // Touch Dropdown Triggers
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
  },
  dropdownTriggerVal: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownTriggerSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  dropdownChevronBox: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Sticky Bottom Bar
  stickyBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: wp(4),
    paddingTop: moderateScale(10),
    paddingBottom: Platform.OS === 'android' ? moderateScale(22) : moderateScale(14),
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomSummaryLeft: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  bottomSummaryLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  bottomSummaryPrice: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#4F46E5',
    lineHeight: fontScale(22),
  },
  bottomSummaryPlan: {
    fontSize: fontScale(10.5),
    color: '#0F172A',
    fontWeight: '600',
  },
  enrollActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(14),
    gap: 6,
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  enrollActionBtnText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal Sheet Picker Elements
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  pickerSheet: {
    width: '100%',
    maxWidth: moderateScale(380),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(18),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  pickerSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerSheetTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerSheetSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  pickerCloseBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  pickerItemCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  pickerItemName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerItemNameSelected: {
    color: '#4F46E5',
  },
  pickerItemDesc: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
  },
  pickerItemPrice: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerItemDuration: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '600',
  },
  popularPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  popularPillText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#D97706',
  },
  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: '#4F46E5',
  },
  radioInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#4F46E5',
  },
  emptyPickerWrap: {
    paddingVertical: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPickerText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Success Modal Dialog Styles
  successModalCard: {
    width: '100%',
    maxWidth: moderateScale(360),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(22),
    paddingBottom: moderateScale(20),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  successIconOuter: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  successIconInner: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  successTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  successSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: moderateScale(16),
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(18),
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  successDetailLabel: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '600',
  },
  successDetailVal: {
    fontSize: fontScale(12),
    color: '#0F172A',
    fontWeight: '700',
  },
  successDoneBtn: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: moderateScale(13),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  successDoneBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
