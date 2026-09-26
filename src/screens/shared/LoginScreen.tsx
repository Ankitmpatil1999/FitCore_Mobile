import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

const bgVideo = require('../../assets/A_cinematic_luxury_fitness_club_named_FITCORE._The_video_begins_outside_a_stunning_modern_glass-fron_seed2324777742.mp4');
const passwordIcon = require('../../assets/Icons/Password.png');
const hideIcon = require('../../assets/Icons/hide.png');
const showIcon = require('../../assets/Icons/show.png');
const alertIcon = require('../../assets/Icons/Aleart.png');
const logoIcon = require('../../assets/Icone.png');

type ScreenMode = 'login' | 'first_time_otp' | 'forgot_otp';
type LoginStep = 'enter_phone' | 'enter_password';
type OtpStep = 'enter_phone' | 'enter_otp' | 'set_password';

export default function LoginScreen() {
  const { login } = useAppContext();
  const { width: windowWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const [mode, setMode] = useState<ScreenMode>('login');
  const [loginStep, setLoginStep] = useState<LoginStep>('enter_phone');
  const [otpStep, setOtpStep] = useState<OtpStep>('enter_phone');

  // Input states
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // User meta from phone check
  const [discoveredUserName, setDiscoveredUserName] = useState('');

  // Control states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Keyboard dynamic height for unlimited manual scroll room
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Timer states for Resend OTP
  const [resendTimer, setResendTimer] = useState(0);

  // Listen to keyboard show/hide to expand scroll area
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates?.height || 260;
        setKeyboardHeight(height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-fill saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const [savedPhone, savedPass, savedRemember] = await Promise.all([
          AsyncStorage.getItem('user_phone'),
          AsyncStorage.getItem('user_password'),
          AsyncStorage.getItem('user_remember_me'),
        ]);

        if (savedPhone) {
          setMobileNumber(savedPhone);
        }
        if (savedPass && savedRemember !== 'false') {
          setPassword(savedPass);
        }
        if (savedRemember !== null) {
          setRememberMe(savedRemember === 'true');
        }
      } catch (e) {
        // silently handled
      }
    };
    loadSavedCredentials();
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const resetAllFields = () => {
    setError('');
    setSuccessMessage('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpStep('enter_phone');
    setLoginStep('enter_phone');
    setDiscoveredUserName('');
  };

  const handleModeChange = (newMode: ScreenMode) => {
    resetAllFields();
    setMode(newMode);
  };

  // Helper for focused field
  const handleFieldFocus = (field: string) => {
    setFocusedField(field);
  };

  // ─── SMART PHONE CHECK ───
  const handleCheckPhone = async () => {
    setError('');
    const cleanPhone = mobileNumber.trim().replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiService.checkPhone(cleanPhone);
      if (!res.success) {
        setError(res.error || 'Unable to check number. Please try again.');
        return;
      }
      if (res.data?.status === 'not_found') {
        setError('This mobile number is not registered. Please contact your gym administrator.');
        return;
      }
      if (res.data?.userName) {
        setDiscoveredUserName(res.data.userName);
      }
      if (res.data?.status === 'needs_otp') {
        setMode('first_time_otp');
        setOtpStep('enter_otp');
        await handleSendOtp('first_time_otp', cleanPhone);
      } else {
        setLoginStep('enter_password');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── LOGIN SUBMIT ───
  const handleLogin = async () => {
    setError('');
    setSuccessMessage('');

    const cleanPhone = mobileNumber.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('user_phone', cleanPhone);
        await AsyncStorage.setItem('user_password', password);
        await AsyncStorage.setItem('user_remember_me', 'true');
      } else {
        await AsyncStorage.removeItem('user_password');
        await AsyncStorage.setItem('user_remember_me', 'false');
      }

      const res = await login(cleanPhone, password);
      if (!res.success) {
        setError(res.error || 'Invalid mobile number or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP 1: SEND OTP ───
  const handleSendOtp = async (overrideMode?: ScreenMode, overridePhone?: string) => {
    setError('');
    setSuccessMessage('');

    const targetMode = overrideMode || mode;
    const rawTargetPhone = overridePhone || mobileNumber;
    const cleanPhone = rawTargetPhone.trim().replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      let res: any;
      if (targetMode === 'first_time_otp') {
        res = await apiService.sendFirstTimeOtp(cleanPhone);
      } else {
        res = await apiService.forgotPassword(cleanPhone);
      }

      if (res.success) {
        if (res.userName) {
          setDiscoveredUserName(res.userName);
        }
        setSuccessMessage(`Verification code sent to +91 ${cleanPhone}`);
        setOtpStep('enter_otp');
        setResendTimer(60);
      } else {
        setError(res.error || res.message || 'Failed to send OTP. Check if number is registered.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while sending OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP 2: VERIFY OTP ───
  const handleVerifyOtp = async () => {
    setError('');
    setSuccessMessage('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the verification code received on your phone.');
      return;
    }

    const cleanPhone = mobileNumber.trim().replace(/[^0-9]/g, '').slice(-10);
    setIsLoading(true);

    try {
      const res = await apiService.verifyOtp(cleanPhone, cleanOtp);
      if (res.success) {
        setSuccessMessage('Code verified! Set your password now.');
        setOtpStep('set_password');
      } else {
        setError(res.error || res.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP 3: SET PASSWORD & AUTO LOGIN ───
  const handleSetPasswordAndLogin = async () => {
    setError('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const cleanPhone = mobileNumber.trim().replace(/[^0-9]/g, '').slice(-10);
    const cleanOtp = otpCode.trim();

    setIsLoading(true);
    try {
      let res: any;
      if (mode === 'first_time_otp') {
        res = await apiService.setupFirstTimePassword(cleanPhone, cleanOtp, newPassword);
      } else {
        res = await apiService.resetPassword(cleanPhone, cleanOtp, newPassword);
      }

      if (res.success) {
        await AsyncStorage.setItem('user_phone', cleanPhone);
        await AsyncStorage.setItem('user_password', newPassword);
        await AsyncStorage.setItem('user_remember_me', 'true');

        setPassword(newPassword);
        setSuccessMessage('Password saved! Logging in...');

        setTimeout(async () => {
          const loginRes = await login(cleanPhone, newPassword);
          if (!loginRes.success) {
            handleModeChange('login');
            Alert.alert('Success', 'Password saved! Please sign in with your new password.');
          }
        }, 800);
      } else {
        setError(res.error || res.message || 'Failed to set password.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Video */}
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

      {/* Cinematic Gradient Tint Overlay */}
      <View style={styles.videoOverlay} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          bounces={true}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          <View style={[styles.innerWrapper, { width: Math.min(windowWidth - 36, 420) }]}>
            {/* Top Brand Header */}
            <View style={styles.topBrand}>
              <View style={styles.logoCircle}>
                <Image source={logoIcon} style={styles.brandLogo} />
              </View>
              <Text style={styles.brandName}>FITCORE</Text>
              <Text style={styles.brandTagline}>ELITE FITNESS & CLUB</Text>
            </View>

            {/* Clean Glassmorphic Main Card */}
            <View style={styles.mainCard}>
              {/* Error Alert */}
              {error ? (
                <View style={styles.errorAlert}>
                  <Image source={alertIcon} style={styles.alertIconImg} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Success Alert */}
              {successMessage ? (
                <View style={styles.successAlert}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* ═════════════════════════════════════════════════════════ */}
              {/* 1. NORMAL LOGIN FLOW                                      */}
              {/* ═════════════════════════════════════════════════════════ */}
              {mode === 'login' && (
                <>
                  {/* ── STEP 1: Enter Mobile Number ── */}
                  {loginStep === 'enter_phone' && (
                    <View style={styles.formContainer}>
                      <Text style={styles.cardHeading}>Sign In</Text>
                      <Text style={styles.cardSubheading}>
                        Enter your mobile number to access your membership.
                      </Text>

                      {/* Phone Input with +91 Prefix */}
                      <View
                        style={[
                          styles.phoneInputRow,
                          focusedField === 'phone' && styles.inputFocused,
                        ]}
                      >
                        <View style={styles.countryCodeBadge}>
                          <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                        </View>
                        <View style={styles.phoneDivider} />
                        <TextInput
                          style={styles.phoneTextInput}
                          value={mobileNumber}
                          onChangeText={setMobileNumber}
                          placeholder="Mobile number"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          keyboardType="phone-pad"
                          maxLength={10}
                          onFocus={() => handleFieldFocus('phone')}
                          onBlur={() => setFocusedField(null)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleCheckPhone}
                        />
                      </View>

                      {/* Submit Button */}
                      <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleCheckPhone}
                        disabled={isLoading}
                        activeOpacity={0.88}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#0b0f19" size="small" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Continue  →</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ── STEP 2: Password (Returning Member) ── */}
                  {loginStep === 'enter_password' && (
                    <View style={styles.formContainer}>
                      {/* User Greeting Header */}
                      <View style={styles.userChip}>
                        <View style={styles.userAvatarBadge}>
                          <Text style={styles.userAvatarText}>
                            {(discoveredUserName || 'U').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userGreetingName} numberOfLines={1}>
                            {discoveredUserName || 'Member'}
                          </Text>
                          <Text style={styles.userGreetingPhone}>+91 {mobileNumber}</Text>
                        </View>
                      </View>

                      {/* Password Input */}
                      <View
                        style={[
                          styles.simpleInputRow,
                          focusedField === 'password' && styles.inputFocused,
                        ]}
                      >
                        <Image source={passwordIcon} style={styles.fieldIcon} />
                        <TextInput
                          style={styles.simpleTextInput}
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Enter your password"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          secureTextEntry={!showPassword}
                          onFocus={() => handleFieldFocus('password')}
                          onBlur={() => setFocusedField(null)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeBtn}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={showPassword ? showIcon : hideIcon}
                            style={styles.eyeIcon}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Remember Me & Forgot Password */}
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.checkboxTouch}
                          onPress={() => setRememberMe(!rememberMe)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              rememberMe && styles.checkboxActive,
                            ]}
                          >
                            {rememberMe && <Text style={styles.checkboxCheck}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Remember Me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleModeChange('forgot_otp')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.forgotLink}>Forgot Password?</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Sign In Button */}
                      <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.88}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#0b0f19" size="small" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Sign In</Text>
                        )}
                      </TouchableOpacity>

                      {/* Change Number Option */}
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => {
                          setLoginStep('enter_phone');
                          setError('');
                          setPassword('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.secondaryLinkText}>
                          ← Use a different mobile number
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {/* ═════════════════════════════════════════════════════════ */}
              {/* 2. FIRST-TIME OTP & PASSWORD SETUP FLOW                   */}
              {/* ═════════════════════════════════════════════════════════ */}
              {(mode === 'first_time_otp' || mode === 'forgot_otp') && (
                <View style={styles.formContainer}>
                  {/* Minimal Step Indicator */}
                  <View style={styles.stepperRow}>
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View
                      style={[
                        styles.stepBar,
                        (otpStep === 'enter_otp' || otpStep === 'set_password') &&
                          styles.stepBarActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.stepDot,
                        (otpStep === 'enter_otp' || otpStep === 'set_password') &&
                          styles.stepDotActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.stepBar,
                        otpStep === 'set_password' && styles.stepBarActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.stepDot,
                        otpStep === 'set_password' && styles.stepDotActive,
                      ]}
                    />
                  </View>

                  {/* ── STEP 1: PHONE ── */}
                  {otpStep === 'enter_phone' && (
                    <>
                      <Text style={styles.cardHeading}>
                        {mode === 'first_time_otp' ? 'Activate Account' : 'Reset Password'}
                      </Text>
                      <Text style={styles.cardSubheading}>
                        Enter your mobile number to receive a 6-digit verification code.
                      </Text>

                      <View
                        style={[
                          styles.phoneInputRow,
                          focusedField === 'otp_phone' && styles.inputFocused,
                        ]}
                      >
                        <View style={styles.countryCodeBadge}>
                          <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                        </View>
                        <View style={styles.phoneDivider} />
                        <TextInput
                          style={styles.phoneTextInput}
                          value={mobileNumber}
                          onChangeText={setMobileNumber}
                          placeholder="Mobile number"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          keyboardType="phone-pad"
                          maxLength={10}
                          onFocus={() => handleFieldFocus('otp_phone')}
                          onBlur={() => setFocusedField(null)}
                          returnKeyType="done"
                          onSubmitEditing={() => handleSendOtp()}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={() => handleSendOtp()}
                        disabled={isLoading}
                        activeOpacity={0.88}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#0b0f19" size="small" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Send Code  →</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* ── STEP 2: ENTER OTP ── */}
                  {otpStep === 'enter_otp' && (
                    <>
                      <Text style={styles.cardHeading}>Enter Verification Code</Text>
                      <Text style={styles.cardSubheading}>
                        Sent to{' '}
                        <Text style={{ color: '#f59e0b', fontWeight: '700' }}>
                          +91 {mobileNumber}
                        </Text>
                      </Text>

                      <View
                        style={[
                          styles.simpleInputRow,
                          focusedField === 'otpCode' && styles.inputFocused,
                        ]}
                      >
                        <TextInput
                          style={[styles.simpleTextInput, styles.otpCenterInput]}
                          value={otpCode}
                          onChangeText={setOtpCode}
                          placeholder="• • • • • •"
                          placeholderTextColor="rgba(255, 255, 255, 0.3)"
                          keyboardType="numeric"
                          maxLength={6}
                          onFocus={() => handleFieldFocus('otpCode')}
                          onBlur={() => setFocusedField(null)}
                          returnKeyType="done"
                          onSubmitEditing={handleVerifyOtp}
                        />
                      </View>

                      <View style={styles.resendTimerRow}>
                        {resendTimer > 0 ? (
                          <Text style={styles.resendTimerText}>
                            Resend code in {resendTimer}s
                          </Text>
                        ) : (
                          <TouchableOpacity onPress={() => handleSendOtp()} disabled={isLoading}>
                            <Text style={styles.resendActiveText}>Resend Code</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setOtpStep('enter_phone')}>
                          <Text style={styles.changeNumberText}>Change Number</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleVerifyOtp}
                        disabled={isLoading}
                        activeOpacity={0.88}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#0b0f19" size="small" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* ── STEP 3: SET PASSWORD ── */}
                  {otpStep === 'set_password' && (
                    <>
                      <Text style={styles.cardHeading}>Create Password</Text>
                      <Text style={styles.cardSubheading}>
                        Create a secure password (min 6 chars) for future logins.
                      </Text>

                      <View
                        style={[
                          styles.simpleInputRow,
                          focusedField === 'newPass' && styles.inputFocused,
                        ]}
                      >
                        <Image source={passwordIcon} style={styles.fieldIcon} />
                        <TextInput
                          style={styles.simpleTextInput}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="New Password (min 6 chars)"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          secureTextEntry={!showNewPassword}
                          onFocus={() => handleFieldFocus('newPass')}
                          onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          style={styles.eyeBtn}
                        >
                          <Image
                            source={showNewPassword ? showIcon : hideIcon}
                            style={styles.eyeIcon}
                          />
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.simpleInputRow,
                          focusedField === 'confirmPass' && styles.inputFocused,
                        ]}
                      >
                        <Image source={passwordIcon} style={styles.fieldIcon} />
                        <TextInput
                          style={styles.simpleTextInput}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Confirm Password"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          secureTextEntry={!showConfirmPassword}
                          onFocus={() => handleFieldFocus('confirmPass')}
                          onBlur={() => setFocusedField(null)}
                          returnKeyType="done"
                          onSubmitEditing={handleSetPasswordAndLogin}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeBtn}
                        >
                          <Image
                            source={showConfirmPassword ? showIcon : hideIcon}
                            style={styles.eyeIcon}
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleSetPasswordAndLogin}
                        disabled={isLoading}
                        activeOpacity={0.88}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#0b0f19" size="small" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Save & Enter App</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Back to Login link */}
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => handleModeChange('login')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryLinkText}>← Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0d18',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.72)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 40 : 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerWrapper: {
    alignItems: 'center',
    width: '100%',
  },

  // ── Brand Header ──
  topBrand: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
  },
  brandTagline: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 2,
    marginTop: 2,
  },

  // ── Main Glassmorphic Card ──
  mainCard: {
    width: '100%',
    backgroundColor: 'rgba(17, 24, 39, 0.80)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 12,
  },
  formContainer: {
    width: '100%',
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  cardSubheading: {
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 18,
  },

  // ── Unified Phone Input Row ──
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    height: 50,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  countryCodeBadge: {
    paddingRight: 8,
  },
  countryCodeText: {
    color: '#e2e8f0',
    fontSize: 13.5,
    fontWeight: '700',
  },
  phoneDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 10,
  },
  phoneTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '600',
    paddingVertical: 0,
    letterSpacing: 0.5,
  },

  // ── Simple Input Row ──
  simpleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    height: 50,
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  simpleTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14.5,
    paddingVertical: 0,
  },
  otpCenterInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '800',
    color: '#f59e0b',
  },
  inputFocused: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  fieldIcon: {
    width: 17,
    height: 17,
    tintColor: '#94a3b8',
    marginRight: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    width: 19,
    height: 19,
    tintColor: '#94a3b8',
  },

  // ── User Chip Header in Password Step ──
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 13,
    padding: 11,
    marginBottom: 16,
  },
  userAvatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#0b0f19',
    fontSize: 13,
    fontWeight: '900',
  },
  userGreetingName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  userGreetingPhone: {
    color: '#cbd5e1',
    fontSize: 11.5,
    marginTop: 2,
  },

  // ── Actions Row ──
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: -2,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748b',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
  },
  checkboxActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  checkboxCheck: {
    color: '#0b0f19',
    fontSize: 10,
    fontWeight: '900',
    marginTop: -2,
  },
  checkboxLabel: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '500',
  },
  forgotLink: {
    color: '#f59e0b',
    fontSize: 11.5,
    fontWeight: '600',
  },

  // ── Primary Button ──
  primaryButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 13,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#0b0f19',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Secondary Links ──
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryLinkText: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '600',
  },

  // ── Minimal Stepper Row ──
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#f59e0b',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  stepBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 7,
  },
  stepBarActive: {
    backgroundColor: '#f59e0b',
  },

  // ── Resend Row ──
  resendTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  resendTimerText: {
    color: '#64748b',
    fontSize: 11.5,
  },
  resendActiveText: {
    color: '#f59e0b',
    fontSize: 11.5,
    fontWeight: '700',
  },
  changeNumberText: {
    color: '#94a3b8',
    fontSize: 11.5,
  },

  // ── Alerts ──
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 11,
    padding: 10,
    marginBottom: 14,
  },
  alertIconImg: {
    width: 15,
    height: 15,
    tintColor: '#ef4444',
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    color: '#fca5a5',
    fontSize: 11.5,
    lineHeight: 15,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 11,
    padding: 10,
    marginBottom: 14,
  },
  successIcon: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
  },
  successText: {
    flex: 1,
    color: '#a7f3d0',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
