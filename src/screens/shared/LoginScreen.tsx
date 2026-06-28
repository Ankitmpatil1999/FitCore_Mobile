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
  Dimensions,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import { useAppContext } from '../../context/AppContext';
import { USERS, VENDOR_STORES, MEMBERS, VendorCategory, User, Member, VendorStore } from '../../data/mockData';

const passwordIcon = require('../../assets/Icons/Password.png');
const hideIcon = require('../../assets/Icons/hide.png');
const showIcon = require('../../assets/Icons/show.png');
const alertIcon = require('../../assets/Icons/Aleart.png');
const bgVideo = require('../../assets/A_cinematic_luxury_fitness_club_named_FITCORE._The_video_begins_outside_a_stunning_modern_glass-fron_seed2324777742.mp4');

type Role = 'owner' | 'member' | 'vendor';
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
  const [license, setLicense] = useState('');
  
  // Control states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Focus states
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

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
    setLicense('');
    setMode(newMode);
  };

  const handleSubmit = () => {
    setError('');
    setSuccess(false);

    if (mode === 'forgot') {
      if (!mobileNumber) {
        setError('Mobile number is required.');
        return;
      }
      if (mobileNumber.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccess(true);
        Alert.alert('Success', 'Recovery SMS sent successfully!');
        setTimeout(() => {
          setSuccess(false);
          handleModeChange('login');
        }, 1000);
      }, 1500);
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Full Name is required.');
        return;
      }
      if (!mobileNumber) {
        setError('Mobile number is required.');
        return;
      }
      if (mobileNumber.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!password) {
        setError('Password is required.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      // Vendor validations
      if (signupRole === 'vendor') {
        if (!storeName.trim()) {
          setError('Store Name is required.');
          return;
        }
        if (!gstNumber.trim()) {
          setError('GST Number is required.');
          return;
        }
        if (!email.trim()) {
          setError('Email is required.');
          return;
        }
        if (!address.trim()) {
          setError('Address is required.');
          return;
        }
        if (!city.trim()) {
          setError('City is required.');
          return;
        }
        if (!stateName.trim()) {
          setError('State is required.');
          return;
        }
        if (!pincode.trim()) {
          setError('Pincode is required.');
          return;
        }
        if (!upiId.trim()) {
          setError('UPI ID is required.');
          return;
        }
        if (!bankAccount.trim()) {
          setError('Bank Account Number is required.');
          return;
        }
        if (!ifsc.trim()) {
          setError('Bank IFSC Code is required.');
          return;
        }
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);

        // Check if number already registered
        const existingUser = USERS.find(u => u.phone === mobileNumber);
        if (existingUser) {
          setError('Mobile number is already registered.');
          return;
        }

        const newUser: User = {
          id: `${signupRole}_${mobileNumber}`,
          name: name,
          phone: mobileNumber,
          email: email || `${name.toLowerCase().replace(' ', '')}@gmail.com`,
          password: password,
          role: signupRole,
          gymId: signupRole === 'vendor' ? '' : 'gym1',
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
        };

        if (signupRole === 'member') {
          const newMember: Member = {
            id: `m_${mobileNumber}`,
            userId: `${signupRole}_${mobileNumber}`,
            gymId: 'gym1',
            name: name,
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
            storeName: storeName,
            ownerName: name,
            category: category,
            gstNumber: gstNumber,
            phone: mobileNumber,
            email: email,
            address: address,
            city: city,
            state: stateName,
            pincode: pincode,
            upiId: upiId,
            bankAccount: bankAccount,
            ifsc: ifsc,
            status: 'pending', // Awaiting Admin Approval
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
        }

        USERS.push(newUser);

        // Try to log in
        const result = login(mobileNumber, password);
        if (result.success) {
          setSuccess(true);
          if (signupRole === 'vendor') {
            Alert.alert(
              'Registration Successful',
              'Your vendor store has been registered! It is currently pending admin approval. You can simulate approval from your store profile page.',
              [{ text: 'Continue' }]
            );
          }
        } else {
          setError(result.error ?? 'Registration failed.');
        }
      }, 1000);
      return;
    }

    // Login Mode Validation
    if (!mobileNumber) {
      setError('Mobile number is required.');
      return;
    }
    if (mobileNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Specific Admin Credentials check
    if (mobileNumber === '8530292487') {
      if (password !== 'Hello@123') {
        setError('Incorrect password for Admin account.');
        return;
      }
    }

    // Specific Vendor login credentials check
    if (mobileNumber === '9326093115') {
      if (password !== 'Hello@123') {
        setError('Incorrect password for Vendor account.');
        return;
      }
    }

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Background Video */}
      <Video
        source={bgVideo}
        style={StyleSheet.absoluteFill}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={1.0}
      />

      {/* Dark overlay tint to make glass card and text readable */}
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.loginCard}>
          {/* Brand Header */}
          <View style={styles.loginHeader}>
            <Text style={styles.brandTitle}>
              {mode === 'login' ? 'FITCORE' : mode === 'forgot' ? 'RESET PASSWORD' : 'CREATE ACCOUNT'}
            </Text>
            <Text style={styles.brandTagline}>
              {mode === 'login' 
                ? 'Enter mobile number to sign in' 
                : mode === 'forgot' 
                ? 'Enter mobile number to recover account' 
                : 'Join FITCORE today'}
            </Text>
          </View>

          {/* Form Alerts */}
          {error ? (
            <View style={styles.errorAlert}>
              <Image source={alertIcon} style={styles.alertIconImg} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successAlert}>
              <Text style={styles.successText}>Success</Text>
            </View>
          ) : null}

          {/* Signup Role Selector */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Register as</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    signupRole === 'member' && styles.roleOptionActiveMember
                  ]}
                  onPress={() => setSignupRole('member')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleOptionText}>Member</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    signupRole === 'owner' && styles.roleOptionActiveOwner
                  ]}
                  onPress={() => setSignupRole('owner')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleOptionText}>Owner</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    signupRole === 'vendor' && styles.roleOptionActiveVendor
                  ]}
                  onPress={() => setSignupRole('vendor')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleOptionText}>Vendor</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Signup Name Input */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Full Name</Text>
              </View>
              <View style={[
                styles.inputWrapper,
                isNameFocused && styles.inputWrapperFocused
              ]}>
                <TextInput
                  style={styles.formInput}
                  placeholder="John Doe"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!(isLoading || success)}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </View>
            </View>
          )}

          {/* Mobile Number Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Mobile Number</Text>
            </View>
            <View style={[
              styles.inputWrapper,
              isMobileFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!(isLoading || success)}
                onFocus={() => setIsMobileFocused(true)}
                onBlur={() => setIsMobileFocused(false)}
              />
            </View>
          </View>

          {/* Password Input (Login & Signup Only) */}
          {mode !== 'forgot' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                {mode === 'login' && (
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    style={styles.forgotLink}
                    onPress={() => handleModeChange('forgot')}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[
                styles.inputWrapper,
                isPasswordFocused && styles.inputWrapperFocused
              ]}>
                <Image source={passwordIcon} style={styles.inputIconImg} />
                <TextInput
                  style={styles.formInput}
                  placeholder="••••••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!(isLoading || success)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Image source={showPassword ? hideIcon : showIcon} style={styles.eyeIconImg} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Confirm Password Input (Signup Only) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Confirm Password</Text>
              </View>
              <View style={[
                styles.inputWrapper,
                isConfirmPasswordFocused && styles.inputWrapperFocused
              ]}>
                <Image source={passwordIcon} style={styles.inputIconImg} />
                <TextInput
                  style={styles.formInput}
                  placeholder="••••••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!(isLoading || success)}
                  onFocus={() => setIsConfirmPasswordFocused(true)}
                  onBlur={() => setIsConfirmPasswordFocused(false)}
                />
              </View>
            </View>
          )}

          {/* Vendor Specific Registration Fields */}
          {mode === 'signup' && signupRole === 'vendor' && (
            <View style={{ marginTop: 10, gap: 12 }}>
              <Text style={styles.sectionHeader}>Store Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Name *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. MuscleZone Pune"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={storeName}
                    onChangeText={setStoreName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Category *</Text>
                <View style={styles.roleContainer}>
                  {(['supplement_store', 'nutrition_shop', 'equipment_dealer'] as const).map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.roleOption,
                        category === cat && styles.roleOptionActiveMember,
                        { paddingVertical: 8 }
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.roleOptionText, { fontSize: 11 }]}>
                        {cat === 'supplement_store' ? 'Supplement' : cat === 'nutrition_shop' ? 'Nutrition' : 'Equipment'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>GST Number *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 27AABCS1429B1Z0"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={gstNumber}
                    onChangeText={setGstNumber}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. support@store.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business License Number</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. LIC-9283921-MUM"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={license}
                    onChangeText={setLicense}
                  />
                </View>
              </View>

              <Text style={styles.sectionHeader}>Address Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Shop 12, MG Road"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>City *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Pune"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>State *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. MH"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={stateName}
                      onChangeText={setStateName}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pincode *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 411001"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.sectionHeader}>Financial Settlements</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>UPI ID for Payouts *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. storename@upi"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank Account Number *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 91827364521"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={bankAccount}
                    onChangeText={setBankAccount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IFSC Code *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. HDFC0001234"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={ifsc}
                    onChangeText={setIfsc}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[styles.btnPrimary, (isLoading || success) && styles.btnPrimaryDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={isLoading || success}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {mode === 'login' 
                  ? (success ? 'Redirecting...' : (mobileNumber === '9326093115' ? 'Access Vendor Portal →' : mobileNumber === '8530292487' ? 'Access Gym Owner Portal →' : 'Access Member Portal →')) 
                  : mode === 'forgot' 
                  ? 'Send Recovery Link →' 
                  : 'Register Now →'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch Screen Mode Navigation Footer */}
          <TouchableOpacity 
            onPress={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}
            style={styles.switchModeLink}
            activeOpacity={0.7}
          >
            <Text style={styles.switchModeText}>
              {mode === 'login' 
                ? 'New to FITCORE? Create an account' 
                : mode === 'forgot' 
                ? '← Back to login' 
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successText: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  alertIconImg: {
    width: 16,
    height: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  forgotLink: {
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputIconImg: {
    width: 18,
    height: 18,
    marginRight: 10,
    tintColor: '#ffffff',
    opacity: 0.8,
  },
  formInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIconImg: {
    width: 18,
    height: 18,
    tintColor: '#ffffff',
    opacity: 0.8,
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  btnPrimaryDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  switchModeLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  roleOptionActiveMember: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3b82f6',
  },
  roleOptionActiveOwner: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3b82f6',
  },
  roleOptionActiveVendor: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3b82f6',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 18,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
