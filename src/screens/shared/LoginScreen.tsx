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
import Video from 'react-native-video';
import { useAppContext } from '../../context/AppContext';
import {
  USERS, VENDOR_STORES, MEMBERS, TRAINERS, VendorCategory,
  User, Member, VendorStore, Trainer,
} from '../../data/mockData';
import { Colors, Typography, Radii, Spacing } from '../../theme';

const bgVideo = require('../../assets/A_cinematic_luxury_fitness_club_named_FITCORE._The_video_begins_outside_a_stunning_modern_glass-fron_seed2324777742.mp4');
const passwordIcon = require('../../assets/Icons/Password.png');
const hideIcon = require('../../assets/Icons/hide.png');
const showIcon = require('../../assets/Icons/show.png');
const alertIcon = require('../../assets/Icons/Aleart.png');
const logoIcon = require('../../assets/Icone.png');

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

  const handleSubmit = async () => {
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
      if (!name) { setError('Full name is required.'); return; }
      if (!mobileNumber || mobileNumber.length < 10) { setError('Valid 10-digit mobile number is required.'); return; }
      if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

      if (signupRole === 'vendor') {
        if (!storeName) { setError('Store name is required.'); return; }
        if (!gstNumber) { setError('GST number is required.'); return; }
        if (!city) { setError('City is required.'); return; }
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccess(true);
        Alert.alert('Registration Successful', 'Your account has been created. Please sign in.');
        setTimeout(() => { setSuccess(false); handleModeChange('login'); }, 1000);
      }, 1500);
      return;
    }

    // Login mode
    console.log('🔘 [LOGIN BUTTON PRESSED]', { mobileNumber, passwordLength: password.length });
    if (!mobileNumber) { setError('Mobile number is required.'); return; }
    if (mobileNumber.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setIsLoading(true);
    try {
      console.log('🚀 [CALLING APP CONTEXT LOGIN] with:', mobileNumber);
      const res = await login(mobileNumber, password);
      console.log('📥 [LOGIN RESULT RECEIVED]:', res);
      if (!res.success) {
        setError(res.error || 'Invalid mobile number or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // ─── Reusable Text Input ───
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    fieldKey: string,
    options: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
      secure?: boolean;
      maxLength?: number;
      icon?: any;
    } = {}
  ) => {
    const isFocused = focusedField === fieldKey;
    const isSecure = options.secure && !showPassword;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
          ]}
        >
          {options.icon && (
            <Image source={options.icon} style={styles.inputIcon} />
          )}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={options.placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            keyboardType={options.keyboardType || 'default'}
            secureTextEntry={isSecure}
            maxLength={options.maxLength}
            onFocus={() => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
          />
          {options.secure && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Image
                source={showPassword ? showIcon : hideIcon}
                style={styles.eyeIcon}
              />
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Cinematic Background Video */}
      <Video
        source={bgVideo}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        rate={1.0}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="obey"
      />

      {/* Dark Blur Tint Overlay */}
      <View style={styles.videoOverlay} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Glassmorphic Transparent Card */}
          <View style={styles.glassCard}>
            {/* Brand Logo & Header */}
            <View style={styles.headerSection}>
              <View style={styles.logoWrapper}>
                <Image source={logoIcon} style={styles.logoImg} />
              </View>
              <Text style={styles.brandTitle}>FitCore</Text>
              <View style={styles.secureBadge}>
                <View style={styles.secureDot} />
                <Text style={styles.secureBadgeText}>SMART ECOSYSTEM PORTAL</Text>
              </View>
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
                {renderInput('Mobile Number / Identifier', mobileNumber, setMobileNumber, 'mobile', {
                  placeholder: 'e.g. 9876543210 (10 Digits)',
                  keyboardType: 'phone-pad',
                  maxLength: 10,
                })}

                {renderInput('Account Password', password, setPassword, 'password', {
                  placeholder: '••••••••',
                  secure: true,
                  icon: passwordIcon,
                })}

                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => handleModeChange('forgot')}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <Text style={styles.primaryBtnText}>SIGN IN TO FITCORE</Text>
                  )}
                </TouchableOpacity>



                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => handleModeChange('signup')}>
                    <Text style={styles.switchLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}


            {/* ─── FORGOT PASSWORD ─── */}
            {mode === 'forgot' && (
              <>
                {renderInput('Registered Mobile Number', mobileNumber, setMobileNumber, 'mobile', {
                  placeholder: 'Enter 10-digit mobile number',
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
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <Text style={styles.primaryBtnText}>SEND RECOVERY CODE</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>Remember password? </Text>
                  <TouchableOpacity onPress={() => handleModeChange('login')}>
                    <Text style={styles.switchLink}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ─── SIGNUP FORM ─── */}
            {mode === 'signup' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Your Role</Text>
                  <View style={styles.roleRow}>
                    {renderRolePill('member', 'Athlete', '🏋️')}
                    {renderRolePill('trainer', 'Trainer', '⚡')}
                    {renderRolePill('vendor', 'Store Partner', '🏬')}
                  </View>
                </View>

                {renderInput('Full Name', name, setName, 'name', {
                  placeholder: 'e.g. John Doe',
                })}
                {renderInput('Mobile Number', mobileNumber, setMobileNumber, 'mobile', {
                  placeholder: '10-digit phone number',
                  keyboardType: 'phone-pad',
                  maxLength: 10,
                })}

                {signupRole === 'vendor' && (
                  <>
                    {renderInput('Store / Business Name', storeName, setStoreName, 'store', {
                      placeholder: 'e.g. MuscleZone Nutrition',
                    })}
                    {renderInput('GST Number', gstNumber, setGstNumber, 'gst', {
                      placeholder: '22AAAAA0000A1Z5',
                    })}
                    {renderInput('City / Region', city, setCity, 'city', {
                      placeholder: 'e.g. Mumbai',
                    })}
                  </>
                )}

                {renderInput('Password', password, setPassword, 'password', {
                  placeholder: 'Create a password',
                  secure: true,
                  icon: passwordIcon,
                })}
                {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', {
                  placeholder: 'Confirm password',
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
                    <ActivityIndicator color="#0f172a" />
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
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0d1a',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 13, 26, 0.65)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 30,
    minHeight: '100%',
    justifyContent: 'center',
  },

  // ── Glassmorphic Transparent Card (Matches Web Design) ──
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
  },

  // ── Header & Branding ──
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logoImg: {
    width: 58,
    height: 58,
    borderRadius: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    textAlign: 'center',
  },

  // ── Alerts ──
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  alertIconImg: {
    width: 16,
    height: 16,
    tintColor: '#fca5a5',
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#fca5a5',
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  successIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6ee7b7',
  },
  successText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6ee7b7',
  },

  // ── Form Inputs ──
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    height: 50,
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  inputIcon: {
    width: 16,
    height: 16,
    marginRight: 10,
    tintColor: 'rgba(255, 255, 255, 0.6)',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    width: 18,
    height: 18,
    tintColor: 'rgba(255, 255, 255, 0.7)',
  },

  // ── Forgot Password ──
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#38bdf8',
  },

  // ── Primary Action Button ──
  primaryBtn: {
    height: 52,
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },

  // ── Switch Mode Footer ──
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  switchText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
  },

  // ── Role Selector ──
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rolePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  rolePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  rolePillIcon: {
    fontSize: 14,
  },
  rolePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  rolePillTextActive: {
    color: '#38bdf8',
  },
});
