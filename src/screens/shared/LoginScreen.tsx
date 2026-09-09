import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';
import {
  USERS, VENDOR_STORES, MEMBERS, TRAINERS, VendorCategory,
  User, Member, VendorStore, Trainer,
} from '../../data/mockData';
import { Colors, Typography, Radii, Spacing } from '../../theme';

const passwordIcon = require('../../assets/Icons/Password.png');
const hideIcon = require('../../assets/Icons/hide.png');
const showIcon = require('../../assets/Icons/show.png');
const alertIcon = require('../../assets/Icons/Aleart.png');

type Role = 'owner' | 'member' | 'vendor' | 'trainer';
type ScreenMode = 'login' | 'forgot' | 'signup';

export default function LoginScreen() {
  const { login } = useAppContext();
  const [mode, setMode] = useState<ScreenMode>('login');
  const [signupRole, setSignupRole] = useState<Role>('member');

  // Form input states
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Vendor Specific States
  const [storeName, setStoreName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [category, setCategory] = useState<VendorCategory>('supplement_store');

  // Control states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleModeChange = (newMode: ScreenMode) => {
    setError('');
    setSuccess(false);
    setName('');
    setMobileNumber('');
    setPassword('');
    setConfirmPassword('');
    setSignupRole('member');
    setStoreName('');
    setGstNumber('');
    setEmail('');
    setAddress('');
    setCity('');
    setStateName('');
    setPincode('');
    setBankAccount('');
    setIfsc('');
    setUpiId('');
    setMode(newMode);
  };

  const handleSubmit = () => {
    setError('');
    setSuccess(false);

    if (mode === 'forgot') {
      if (!mobileNumber) { setError('Mobile number is required.'); return; }
      if (mobileNumber.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccess(true);
        Alert.alert('Success', 'Recovery SMS sent successfully!');
        setTimeout(() => { setSuccess(false); handleModeChange('login'); }, 1000);
      }, 1500);
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) { setError('Full Name is required.'); return; }
      if (!mobileNumber) { setError('Mobile number is required.'); return; }
      if (mobileNumber.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
      if (!password) { setError('Password is required.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

      // Vendor validations
      if (signupRole === 'vendor') {
        if (!storeName.trim()) { setError('Store Name is required.'); return; }
        if (!gstNumber.trim()) { setError('GST Number is required.'); return; }
        if (!email.trim()) { setError('Email is required.'); return; }
        if (!address.trim()) { setError('Address is required.'); return; }
        if (!city.trim()) { setError('City is required.'); return; }
        if (!stateName.trim()) { setError('State is required.'); return; }
        if (!pincode.trim()) { setError('Pincode is required.'); return; }
        if (!upiId.trim()) { setError('UPI ID is required.'); return; }
        if (!bankAccount.trim()) { setError('Bank Account Number is required.'); return; }
        if (!ifsc.trim()) { setError('Bank IFSC Code is required.'); return; }
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const existingUser = USERS.find(u => u.phone === mobileNumber);
        if (existingUser) { setError('Mobile number is already registered.'); return; }

        const newUser: User = {
          id: `${signupRole}_${mobileNumber}`,
          name,
          phone: mobileNumber,
          email: email || `${name.toLowerCase().replace(' ', '')}@gmail.com`,
          password,
          role: signupRole,
          gymId: signupRole === 'vendor' ? '' : 'g1',
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
        };

        if (signupRole === 'member') {
          const newMember: Member = {
            id: `m_${mobileNumber}`,
            userId: `${signupRole}_${mobileNumber}`,
            gymId: 'g1',
            name,
            phone: mobileNumber,
            email: email || `${name.toLowerCase().replace(' ', '')}@gmail.com`,
            avatar: name.slice(0, 2).toUpperCase(),
            age: 25,
            height: 175,
            weight: 70,
            bmi: 22.9,
            goal: 'general_fitness',
            medicalIssues: 'None',
            emergencyContact: 'Family',
            emergencyPhone: '9999999999',
            planId: 'plan1',
            status: 'active',
            joinDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            trainerId: 'trainer1',
            photo: '',
          };
          MEMBERS.push(newMember);
        } else if (signupRole === 'vendor') {
          const newStore: VendorStore = {
            id: `vs_${mobileNumber}`,
            userId: `${signupRole}_${mobileNumber}`,
            storeName,
            ownerName: name,
            category,
            gstNumber,
            phone: mobileNumber,
            email,
            address,
            city,
            state: stateName,
            pincode,
            upiId,
            bankAccount,
            ifsc,
            status: 'pending',
            avatar: storeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'VS',
            shopImage: '🏪',
            rating: 5.0,
            totalReviews: 0,
            joinDate: new Date().toISOString().split('T')[0],
            tagline: 'Premium supplements & accessories',
            description: `${storeName} is registered and pending admin approval.`,
            deliveryMethods: ['local', 'partner'],
            freeDeliveryAbove: 999,
            deliveryCharges: 49,
            kycDocuments: [
              { type: 'aadhaar', label: 'Aadhaar Card', number: '', status: 'not_uploaded', uploadedAt: '' },
              { type: 'pan', label: 'PAN Card', number: '', status: 'not_uploaded', uploadedAt: '' },
              { type: 'electricity_bill', label: 'Electricity Bill', number: '', status: 'not_uploaded', uploadedAt: '' },
              { type: 'shop_license', label: 'Shop License', number: '', status: 'not_uploaded', uploadedAt: '' },
            ],
          };
          VENDOR_STORES.push(newStore);
        } else if (signupRole === 'trainer') {
          const newTrainerObj: Trainer = {
            id: `trainer_${mobileNumber}`,
            gymId: 'g1',
            name,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TR',
            specialization: 'General Strength & Conditioning',
            experience: '2 years',
            salary: '₹25,000/month',
            timings: '6:00 AM – 11:00 AM & 5:00 PM – 9:00 PM',
            available: true,
            assignedMemberIds: [],
            certifications: 'FitCore Certified Coach',
            phone: mobileNumber,
            joinDate: new Date().toISOString().split('T')[0],
          };
          TRAINERS.push(newTrainerObj);
        }

        USERS.push(newUser);
        const result = login(mobileNumber, password);
        if (result.success) {
          setSuccess(true);
          if (signupRole === 'vendor') {
            Alert.alert('Registration Successful', 'Your vendor store has been registered! It is currently pending admin approval.', [{ text: 'Continue' }]);
          }
        } else {
          setError(result.error ?? 'Registration failed.');
        }
      }, 1000);
      return;
    }

    // Login
    if (!mobileNumber) { setError('Mobile number is required.'); return; }
    if (mobileNumber.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const result = login(mobileNumber, password);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? 'Invalid credentials.');
      }
    }, 800);
  };

  // ─── Render Input Field ───
  const renderInput = (
    label: string,
    value: string,
    setter: (v: string) => void,
    fieldKey: string,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
      secure?: boolean;
      maxLength?: number;
      icon?: any;
    }
  ) => {
    const isFocused = focusedField === fieldKey;
    const isSecure = options?.secure && !showPassword;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && !value && styles.inputContainerError,
        ]}>
          {options?.icon && (
            <Image source={options.icon} style={styles.inputIcon} />
          )}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setter}
            placeholder={options?.placeholder || label}
            placeholderTextColor={Colors.textMuted}
            keyboardType={options?.keyboardType || 'default'}
            secureTextEntry={isSecure}
            maxLength={options?.maxLength}
            onFocus={() => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
          />
          {options?.secure && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Image source={showPassword ? showIcon : hideIcon} style={styles.eyeIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ─── Role selector pill ───
  const renderRolePill = (role: Role, label: string, icon: string) => {
    const isActive = signupRole === role;
    return (
      <TouchableOpacity
        key={role}
        style={[styles.rolePill, isActive && styles.rolePillActive]}
        onPress={() => setSignupRole(role)}
        activeOpacity={0.7}
      >
        <Text style={styles.rolePillIcon}>{icon}</Text>
        <Text style={[styles.rolePillText, isActive && styles.rolePillTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // ─── RENDER ───
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.headerSection}>
            <Text style={styles.brandName}>FITCORE</Text>
            <Text style={styles.headerTitle}>
              {mode === 'login'
                ? 'Welcome Back 👋'
                : mode === 'forgot'
                ? 'Reset Password'
                : 'Create Account'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'login'
                ? 'Sign in to continue your fitness journey'
                : mode === 'forgot'
                ? 'Enter your mobile number to recover your account'
                : 'Join FitCore and start training today'}
            </Text>
          </View>

          {/* Error Alert */}
          {error ? (
            <View style={styles.errorAlert}>
              <Image source={alertIcon} style={styles.alertIconImg} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Alert */}
          {success ? (
            <View style={styles.successAlert}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>Success</Text>
            </View>
          ) : null}

          {/* ─── LOGIN FORM ─── */}
          {mode === 'login' && (
            <>
              {renderInput('Mobile Number', mobileNumber, setMobileNumber, 'mobile', {
                placeholder: 'Enter your mobile number',
                keyboardType: 'phone-pad',
                maxLength: 10,
              })}
              {renderInput('Password', password, setPassword, 'password', {
                placeholder: 'Enter your password',
                secure: true,
                icon: passwordIcon,
              })}

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => handleModeChange('forgot')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryBtnText}>LOGIN</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Switch to Signup */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => handleModeChange('signup')}>
                  <Text style={styles.switchLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─── FORGOT PASSWORD FORM ─── */}
          {mode === 'forgot' && (
            <>
              {renderInput('Mobile Number', mobileNumber, setMobileNumber, 'mobile', {
                placeholder: 'Enter registered mobile number',
                keyboardType: 'phone-pad',
                maxLength: 10,
              })}

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryBtnText}>SEND RECOVERY SMS</Text>
                )}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => handleModeChange('login')}>
                  <Text style={styles.switchLink}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─── SIGNUP FORM ─── */}
          {mode === 'signup' && (
            <>
              {/* Role Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>I am a</Text>
                <View style={styles.roleRow}>
                  {renderRolePill('member', 'Member', '🏋️')}
                  {renderRolePill('owner', 'Owner', '🏢')}
                  {renderRolePill('trainer', 'Trainer', '👨‍🏫')}
                  {renderRolePill('vendor', 'Vendor', '🛍️')}
                </View>
              </View>

              {renderInput('Full Name', name, setName, 'name', {
                placeholder: 'Enter your full name',
              })}
              {renderInput('Mobile Number', mobileNumber, setMobileNumber, 'mobile', {
                placeholder: 'Enter your mobile number',
                keyboardType: 'phone-pad',
                maxLength: 10,
              })}

              {/* Vendor-specific fields */}
              {signupRole === 'vendor' && (
                <>
                  {renderInput('Store Name', storeName, setStoreName, 'storeName', {
                    placeholder: 'Enter your store name',
                  })}
                  {renderInput('GST Number', gstNumber, setGstNumber, 'gst', {
                    placeholder: 'Enter GST number',
                  })}
                  {renderInput('Email', email, setEmail, 'email', {
                    placeholder: 'Enter email address',
                    keyboardType: 'email-address',
                  })}

                  {/* Category selector */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Store Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                      {([
                        { value: 'supplement_store', label: 'Supplements' },
                        { value: 'nutrition_shop', label: 'Nutrition' },
                        { value: 'equipment_dealer', label: 'Equipment' },
                        { value: 'accessories_store', label: 'Accessories' },
                        { value: 'sports_nutrition', label: 'Sports Nutrition' },
                      ] as { value: VendorCategory; label: string }[]).map(c => (
                        <TouchableOpacity
                          key={c.value}
                          style={[styles.categoryChip, category === c.value && styles.categoryChipActive]}
                          onPress={() => setCategory(c.value)}
                        >
                          <Text style={[styles.categoryChipText, category === c.value && styles.categoryChipTextActive]}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {renderInput('Address', address, setAddress, 'address', {
                    placeholder: 'Enter store address',
                  })}
                  {renderInput('City', city, setCity, 'city', { placeholder: 'Enter city' })}
                  {renderInput('State', stateName, setStateName, 'state', { placeholder: 'Enter state' })}
                  {renderInput('Pincode', pincode, setPincode, 'pincode', {
                    placeholder: 'Enter pincode',
                    keyboardType: 'numeric',
                    maxLength: 6,
                  })}
                  {renderInput('UPI ID', upiId, setUpiId, 'upi', {
                    placeholder: 'Enter UPI ID',
                  })}
                  {renderInput('Bank Account', bankAccount, setBankAccount, 'bank', {
                    placeholder: 'Enter bank account number',
                    keyboardType: 'numeric',
                  })}
                  {renderInput('IFSC Code', ifsc, setIfsc, 'ifsc', {
                    placeholder: 'Enter IFSC code',
                  })}
                </>
              )}

              {renderInput('Password', password, setPassword, 'password', {
                placeholder: 'Create a password',
                secure: true,
                icon: passwordIcon,
              })}
              {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', {
                placeholder: 'Confirm your password',
                secure: true,
                icon: passwordIcon,
              })}

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
                )}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => handleModeChange('login')}>
                  <Text style={styles.switchLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },

  // ── Header ──
  headerSection: {
    marginBottom: 36,
  },
  brandName: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.primaryGreen,
    letterSpacing: Typography.letterSpacingExtraWide,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: Typography.fontSize3xl,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: Typography.fontSizeMd,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // ── Alerts ──
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: Radii.md,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.2)',
  },
  alertIconImg: {
    width: 18,
    height: 18,
    tintColor: Colors.danger,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.danger,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    borderRadius: Radii.md,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(69, 212, 131, 0.2)',
  },
  successIcon: {
    fontSize: 16,
    fontWeight: Typography.fontWeightBold,
    color: Colors.success,
  },
  successText: {
    flex: 1,
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.success,
  },

  // ── Input Fields ──
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    height: 52,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: Colors.inputBorderFocus,
    backgroundColor: 'rgba(184, 242, 58, 0.03)',
  },
  inputContainerError: {
    borderColor: 'rgba(255, 92, 92, 0.4)',
  },
  inputIcon: {
    width: 18,
    height: 18,
    marginRight: 12,
    tintColor: Colors.textMuted,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizeMd,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeightMedium,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.textMuted,
  },

  // ── Forgot Password ──
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primaryGreen,
  },

  // ── Primary Button (Lime Green) ──
  primaryBtn: {
    height: 56,
    backgroundColor: Colors.primaryGreen,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
    letterSpacing: 1,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textMuted,
  },

  // ── Google Button ──
  googleBtn: {
    height: 52,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
    marginBottom: 32,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  googleText: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },

  // ── Switch Mode ──
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: Typography.fontSizeMd,
    color: Colors.textSecondary,
  },
  switchLink: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primaryGreen,
  },

  // ── Role Selector ──
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  rolePillActive: {
    backgroundColor: 'rgba(184, 242, 58, 0.10)',
    borderColor: Colors.primaryGreen,
  },
  rolePillIcon: {
    fontSize: 16,
  },
  rolePillText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  rolePillTextActive: {
    color: Colors.primaryGreen,
  },

  // ── Category Selector ──
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(184, 242, 58, 0.10)',
    borderColor: Colors.primaryGreen,
  },
  categoryChipText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.primaryGreen,
  },
});
