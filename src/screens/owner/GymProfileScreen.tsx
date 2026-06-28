import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Shadows } from '../../theme';
import { GYMS, FACILITIES, Gym } from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';



const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic', price: '₹999/month', features: ['Up to 100 members', 'Basic reports', 'QR check-in'] },
  { id: 'standard', name: 'Standard', price: '₹2,499/month', features: ['Up to 500 members', 'Advanced analytics', 'QR + NFC check-in', 'SMS notifications'] },
  { id: 'premium', name: 'Premium', price: '₹4,999/month', features: ['Unlimited members', 'Full analytics suite', 'All check-in modes', 'Priority support', 'E-commerce store'] },
];

export default function GymProfileScreen() {
  const { logout, currentGym } = useAppContext();
  const gym = currentGym || GYMS[0];

  const [gymName, setGymName] = useState(gym.name);
  const [tagline, setTagline] = useState(gym.tagline);
  const [address, setAddress] = useState(gym.address);
  const [phone, setPhone] = useState(gym.phone);
  const [email, setEmail] = useState(gym.email);
  const [openTime, setOpenTime] = useState(gym.openTime);
  const [closeTime, setCloseTime] = useState(gym.closeTime);
  const [isOpen, setIsOpen] = useState(gym.isOpen);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    gym.facilities.map((f: any) => (typeof f === 'string' ? f : f.id)),
  );
  const [isEditing, setIsEditing] = useState(false);

  const toggleFacility = (fId: string) => {
    setSelectedFacilities(prev =>
      prev.includes(fId) ? prev.filter(f => f !== fId) : [...prev, fId],
    );
  };

  const handleSave = () => {
    Alert.alert('Saved', 'Gym profile has been updated!');
    setIsEditing(false);
  };

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === gym.subscriptionPlan)!;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Settings</Text>
              <Text style={styles.headerTitle}>Gym Profile 🏢</Text>
            </View>
            <TouchableOpacity
              style={[styles.editBtn, isEditing && { backgroundColor: LightColors.success }]}
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.editBtnText}>{isEditing ? '✅ Save' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Gym identity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gym Identity</Text>

            <Text style={styles.fieldLabel}>Gym Name</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={gymName} onChangeText={setGymName} />
            ) : (
              <Text style={styles.fieldValue}>{gymName}</Text>
            )}

            <Text style={styles.fieldLabel}>Tagline</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={tagline} onChangeText={setTagline} />
            ) : (
              <Text style={styles.fieldValue}>{tagline}</Text>
            )}

            {/* Rating chip */}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <Text key={i} style={{ fontSize: 20, color: i <= Math.floor(gym.rating) ? '#F59E0B' : '#E2E8F0' }}>★</Text>
              ))}
              <Text style={styles.ratingText}>{gym.rating} / 5.0</Text>
            </View>
          </View>

          {/* Contact & Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Hours</Text>

            {[
              { label: 'Address', val: address, set: setAddress },
              { label: 'Phone', val: phone, set: setPhone },
              { label: 'Email', val: email, set: setEmail },
              { label: 'Opening Time', val: openTime, set: setOpenTime },
              { label: 'Closing Time', val: closeTime, set: setCloseTime },
            ].map(f => (
              <View key={f.label}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                {isEditing ? (
                  <TextInput style={styles.input} value={f.val} onChangeText={f.set} />
                ) : (
                  <Text style={styles.fieldValue}>{f.val}</Text>
                )}
              </View>
            ))}

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.fieldLabel}>Currently Open</Text>
                <Text style={styles.fieldValue}>{isOpen ? '🟢 Open' : '🔴 Closed'}</Text>
              </View>
              {isEditing && (
                <Switch
                  value={isOpen}
                  onValueChange={setIsOpen}
                  trackColor={{ false: LightColors.borderHover, true: `${LightColors.accentViolet}50` }}
                  thumbColor={isOpen ? LightColors.accentViolet : LightColors.bgElevated}
                />
              )}
            </View>
          </View>

          {/* Facilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities</Text>
            <View style={styles.facilitiesGrid}>
              {FACILITIES.map(f => {
                const isSelected = selectedFacilities.includes(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.facilityChip, isSelected && styles.facilityChipActive]}
                    onPress={() => isEditing && toggleFacility(f.id)}
                    activeOpacity={isEditing ? 0.7 : 1}
                  >
                    <Text style={styles.facilityIcon}>{f.icon}</Text>
                    <Text style={[styles.facilityName, isSelected && styles.facilityNameActive]}>
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isEditing && (
              <Text style={styles.editHint}>Tap facilities to toggle them on/off</Text>
            )}
          </View>

          {/* Subscription Plan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FITCore Subscription</Text>
            {SUBSCRIPTION_PLANS.map(plan => {
              const isActive = plan.id === gym.subscriptionPlan;
              return (
                <View key={plan.id} style={[styles.subPlanCard, isActive && styles.subPlanCardActive]}>
                  <View style={styles.subPlanTop}>
                    <View>
                      <Text style={styles.subPlanName}>{plan.name}</Text>
                      <Text style={styles.subPlanPrice}>{plan.price}</Text>
                    </View>
                    {isActive && (
                      <View style={styles.activePlanBadge}>
                        <Text style={styles.activePlanText}>✅ Current Plan</Text>
                      </View>
                    )}
                  </View>
                  {plan.features.map((feat, i) => (
                    <Text key={i} style={styles.subFeature}>✓ {feat}</Text>
                  ))}
                  {!isActive && (
                    <TouchableOpacity style={styles.upgradeBtn} onPress={() => Alert.alert('Upgrade', `Upgrade to ${plan.name} — contact FITCore support.`)}>
                      <Text style={styles.upgradeBtnText}>Upgrade to {plan.name}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Danger zone */}
          <View style={[styles.section, { borderColor: '#FEE2E2', borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Account</Text>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => Alert.alert('Logout', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
              ])}
              activeOpacity={0.85}
            >
              <Text style={styles.logoutBtnText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LightColors.bgSurface },
  root: { flex: 1, backgroundColor: LightColors.bgBase },
  header: {
    backgroundColor: LightColors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: LightColors.border,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: LightColors.textPrimary },
  editBtn: { backgroundColor: LightColors.accentViolet, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LightColors.accentViolet },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scroll: {
    padding: 20, paddingBottom: 100,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  section: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 20, marginBottom: 16, ...Shadows.card },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: LightColors.textMuted, textTransform: 'uppercase', marginBottom: 5, marginTop: 12 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: LightColors.textPrimary },
  input: { backgroundColor: LightColors.bgBase, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: LightColors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  ratingText: { fontSize: 13, fontWeight: '700', color: LightColors.textMuted, marginLeft: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  facilityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border },
  facilityChipActive: { backgroundColor: `${LightColors.accentViolet}15`, borderColor: LightColors.accentViolet },
  facilityIcon: { fontSize: 16 },
  facilityName: { fontSize: 12, fontWeight: '600', color: LightColors.textMuted },
  facilityNameActive: { color: LightColors.accentViolet },
  editHint: { fontSize: 11, color: LightColors.textMuted, marginTop: 10, fontStyle: 'italic' },
  subPlanCard: { backgroundColor: LightColors.bgBase, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: LightColors.border },
  subPlanCardActive: { borderColor: LightColors.accentViolet, backgroundColor: `${LightColors.accentViolet}15` },
  subPlanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  subPlanName: { fontSize: 16, fontWeight: '800', color: LightColors.textPrimary },
  subPlanPrice: { fontSize: 13, color: LightColors.accentViolet, fontWeight: '700', marginTop: 3 },
  activePlanBadge: { backgroundColor: LightColors.successBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  activePlanText: { fontSize: 11, fontWeight: '700', color: LightColors.success },
  subFeature: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500', marginBottom: 4 },
  upgradeBtn: { marginTop: 12, backgroundColor: LightColors.accentViolet, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  upgradeBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  logoutBtn: { backgroundColor: LightColors.dangerBg, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: LightColors.danger },
});
