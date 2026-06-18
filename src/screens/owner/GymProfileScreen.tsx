import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadows } from '../../theme';
import { GYMS, FACILITIES, Gym } from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';

const GYM_ID = 'gym1';

const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic', price: '₹999/month', features: ['Up to 100 members', 'Basic reports', 'QR check-in'] },
  { id: 'standard', name: 'Standard', price: '₹2,499/month', features: ['Up to 500 members', 'Advanced analytics', 'QR + NFC check-in', 'SMS notifications'] },
  { id: 'premium', name: 'Premium', price: '₹4,999/month', features: ['Unlimited members', 'Full analytics suite', 'All check-in modes', 'Priority support', 'E-commerce store'] },
];

export default function GymProfileScreen() {
  const { logout } = useAppContext();
  const gym = GYMS.find(g => g.id === GYM_ID)!;

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
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.root}>

        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Settings</Text>
            <Text style={styles.headerTitle}>Gym Profile 🏢</Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, isEditing && { backgroundColor: '#10B981' }]}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnText}>{isEditing ? '✅ Save' : '✏️ Edit'}</Text>
          </TouchableOpacity>
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
                  trackColor={{ false: '#CBD5E1', true: '#C4B5FD' }}
                  thumbColor={isOpen ? '#8B5CF6' : '#F8FAFC'}
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
  safeArea: { flex: 1, backgroundColor: '#7C3AED' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#7C3AED', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 40 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, ...Shadows.card },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 5, marginTop: 12 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginLeft: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  facilityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  facilityChipActive: { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' },
  facilityIcon: { fontSize: 16 },
  facilityName: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  facilityNameActive: { color: '#8B5CF6' },
  editHint: { fontSize: 11, color: '#94A3B8', marginTop: 10, fontStyle: 'italic' },
  subPlanCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  subPlanCardActive: { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
  subPlanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  subPlanName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  subPlanPrice: { fontSize: 13, color: '#8B5CF6', fontWeight: '700', marginTop: 3 },
  activePlanBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  activePlanText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  subFeature: { fontSize: 12, color: '#475569', fontWeight: '500', marginBottom: 4 },
  upgradeBtn: { marginTop: 12, backgroundColor: '#8B5CF6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  upgradeBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  logoutBtn: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
