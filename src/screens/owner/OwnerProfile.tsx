import React, { useState, useEffect } from 'react';
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
import AppIcon from '../../components/common/AppIcon';
import { LightColors, Typography, Spacing, Radii, Shadows } from '../../theme';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

interface Props {
  onLogout?: () => void;
  route?: any;
}

export default function OwnerProfile({ onLogout, route }: Props) {
  const { logout, currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || (currentUser as any)?.gymId || 'g1';

  const [gymName, setGymName] = useState(currentGym?.name || 'FitCore Premium Gym');
  const [gymAddress, setGymAddress] = useState(currentGym?.address || 'Elite Sector 4, Link Road, Mumbai');
  const [gymPhone, setGymPhone] = useState(currentGym?.phone || '9820000001');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const resolveLogout = onLogout || route?.params?.onLogout || logout;

  useEffect(() => {
    const loadGym = async () => {
      try {
        const res = await apiService.getOwnerOverview(gymId);
        const data: any = res.data;
        if (res.success && data?.gym) {
          const g = data.gym;
          if (g.name) setGymName(g.name);
          if (g.address) setGymAddress(g.address);
          if (g.phone) setGymPhone(g.phone);
        }
      } catch (e) {
        console.log('Error loading gym in OwnerProfile:', e);
      } finally {
        setLoading(false);
      }
    };
    loadGym();
  }, [gymId]);

  const handleSaveProfile = async () => {
    if (!gymName.trim()) {
      Alert.alert('Form Error', 'Gym Name cannot be empty.');
      return;
    }
    if (!gymAddress.trim()) {
      Alert.alert('Form Error', 'Gym Address cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiService.updateOwnerGymSettings({
        gymId,
        gymName: gymName.trim(),
        address: gymAddress.trim(),
        contactPhone: gymPhone.trim(),
      });
      if (res.success) {
        Alert.alert('Profile Saved', 'Gym profile details have been successfully updated in backend!');
      } else {
        Alert.alert('Error', res.error || 'Failed to update profile');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
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
          <AppIcon name="image-outline" size={32} color="#6C5CE7" />
          <Text style={[styles.photoPlaceholderText, { marginTop: 6 }]}>FitCore Gym Cover Banner</Text>
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

          <Text style={styles.inputLabel}>Contact Phone</Text>
          <TextInput
            style={styles.formInput}
            value={gymPhone}
            onChangeText={setGymPhone}
            placeholder="e.g. 9820000001"
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            keyboardType="phone-pad"
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
          <AppIcon name="log-out-outline" size={18} color="#FF4D6D" />
          <Text style={[styles.logoutBtnText, { marginLeft: 8 }]}>Sign Out Admin Account</Text>
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
    flexDirection: 'row',
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
