import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Typography, Spacing, Radii, Shadows } from '../../theme';

interface Props {
  onLogout?: () => void;
  route?: any;
}

export default function OwnerProfile({ onLogout, route }: Props) {
  const [gymName, setGymName] = useState('FitCore Premium Gym');
  const [gymAddress, setGymAddress] = useState('Elite Sector 4, Link Road, Mumbai');
  const [gymPhoto, setGymPhoto] = useState('📸 FitCore Cover Photo Active');
  
  const [isSaving, setIsSaving] = useState(false);

  const resolveLogout = onLogout || route?.params?.onLogout;

  const handleSaveProfile = () => {
    if (!gymName.trim()) {
      Alert.alert('Form Error', 'Gym Name cannot be empty.');
      return;
    }
    if (!gymAddress.trim()) {
      Alert.alert('Form Error', 'Gym Address cannot be empty.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Profile Saved', 'Gym profile details have been successfully updated!');
    }, 1200);
  };

  const handleEditPhoto = () => {
    Alert.alert(
      'Upload Gym Photo',
      'Choose a cover photo for your Gym profile listing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload Custom Photo',
          onPress: () => {
            setGymPhoto('🖼️ Custom Gym Photo Uploaded');
            Alert.alert('Upload Success', 'Cover photo updated.');
          },
        },
      ],
    );
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out of the Admin account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', onPress: resolveLogout, style: 'destructive' },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gym Profile Config</Text>
          <Text style={styles.subtitle}>Manage gym details visible to members</Text>
        </View>

        {/* Cover Photo Box */}
        <View style={styles.photoBox}>
          <Text style={styles.photoPlaceholderText}>{gymPhoto}</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            activeOpacity={0.8}
            onPress={handleEditPhoto}
          >
            <Text style={styles.uploadBtnText}>Edit Gym Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Form */}
        <View style={styles.formBlock}>
          <Text style={styles.inputLabel}>Gym Name</Text>
          <TextInput
            style={styles.formInput}
            value={gymName}
            onChangeText={setGymName}
            placeholder="e.g. FitCore Elite Gym"
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            editable={!isSaving}
          />

          <Text style={styles.inputLabel}>Gym Location / Address</Text>
          <TextInput
            style={[styles.formInput, styles.multilineInput]}
            value={gymAddress}
            onChangeText={setGymAddress}
            placeholder="e.g. Street Number, City Name"
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            multiline={true}
            numberOfLines={3}
            editable={!isSaving}
          />

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogoutPress}
        >
          <Text style={styles.logoutBtnText}>Sign Out Admin Account 🚪</Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LightColors.bgSurface,
  },
  root: {
    flex: 1,
    backgroundColor: LightColors.bgBase,
  },
  container: {
    padding: Spacing.xl,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: Typography.fontSize2xl,
    fontWeight: Typography.fontWeightBold,
    color: LightColors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSizeXs,
    color: LightColors.textSecondary,
    marginTop: 4,
  },
  photoBox: {
    width: '100%',
    height: 160,
    backgroundColor: `${LightColors.accentViolet}15`,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: `${LightColors.accentViolet}35`,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  photoPlaceholderText: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
    color: LightColors.accentViolet,
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: LightColors.accentViolet,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Shadows.card,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
  },
  formBlock: {
    backgroundColor: LightColors.bgSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: LightColors.border,
    padding: Spacing.xl,
    ...Shadows.card,
    marginBottom: 36,
  },
  inputLabel: {
    fontSize: Typography.fontSizeXs,
    fontWeight: Typography.fontWeightBold,
    color: LightColors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: LightColors.bgElevated,
    borderWidth: 1,
    borderColor: LightColors.border,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Typography.fontSizeSm,
    color: LightColors.textPrimary,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: LightColors.accentViolet,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...Shadows.card,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
  },
  logoutBtn: {
    backgroundColor: LightColors.dangerBg,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  logoutBtnText: {
    color: LightColors.danger,
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
  },
});
