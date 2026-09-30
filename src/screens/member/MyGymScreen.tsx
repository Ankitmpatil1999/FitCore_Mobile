import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import { FACILITIES } from '../../data/mockData';
import { apiService } from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

export default function MyGymScreen() {
  const { currentGym, currentMember, currentUser } = useAppContext();
  const [liveGym, setLiveGym] = useState<any>(currentGym);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  const gymId = currentGym?.id || liveGym?.id;

  useEffect(() => {
    async function loadGymAndTrainers() {
      try {
        const userId = currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone;
        if (userId) {
          const res: any = await apiService.getMemberProfile(userId);
          if (res.success && res.data?.gym) {
            setLiveGym(res.data.gym);
          }
        }
      } catch (err) {
        console.log('Using cached gym info');
      }

      if (gymId) {
        try {
          setLoadingTrainers(true);
          const tRes: any = await apiService.getOwnerTrainers(gymId);
          if (tRes?.success && Array.isArray(tRes.data)) {
            setTrainers(tRes.data);
          }
        } catch (e) {
          console.log('Error loading trainers for gym:', e);
        } finally {
          setLoadingTrainers(false);
        }
      }
    }
    loadGymAndTrainers();
  }, [currentMember?.id, currentUser?.id, gymId]);

  const gym = liveGym || currentGym || {
    name: 'FitCore Elite Fitness Club',
    tagline: 'Transform Your Body & Mind with State-of-the-Art Facilities',
    isOpen: true,
    rating: 4.9,
    openTime: '06:00 AM',
    closeTime: '10:00 PM',
    address: 'Civil Lines',
    city: 'Nagpur',
    phone: '+91 98765 43210',
    email: 'contact@fitcore.in',
  };

  const gymFacilityIds = gym?.facilities?.map((f: any) =>
    typeof f === 'string' ? f : f.id,
  ) ?? ['fac_1', 'fac_2', 'fac_3', 'fac_4'];

  const gymFacilities = FACILITIES.filter(f => gymFacilityIds.includes(f.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#6C5CE7" />
      <View style={styles.root}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Active Franchise</Text>
              <Text style={styles.headerTitle}>{gym.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: gym.isOpen ? '#ECFDF5' : '#FEE2E2' }]}>
              <View style={[styles.statusDot, { backgroundColor: gym.isOpen ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusText, { color: gym.isOpen ? '#10B981' : '#EF4444' }]}>
                {gym.isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Rating & Tagline */}
          <View style={styles.gymInfoCard}>
            <Text style={styles.gymTagline}>"{gym.tagline}"</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <Icon
                  key={i}
                  name="star"
                  size={moderateScale(16)}
                  color={i <= Math.floor(gym.rating || 5) ? '#F59E0B' : '#E2E8F0'}
                />
              ))}
              <Text style={styles.ratingText}>{gym.rating || 4.9} · Premium Facility</Text>
            </View>
            <View style={styles.hoursRow}>
              <Icon name="time-outline" size={moderateScale(14)} color="#64748B" />
              <Text style={styles.gymHours}>{gym.openTime || '06:00 AM'} – {gym.closeTime || '10:00 PM'}</Text>
            </View>
          </View>

          {/* Facilities */}
          <Text style={styles.sectionTitle}>Facilities & Amenities</Text>
          <View style={styles.facilitiesGrid}>
            {gymFacilities.map(f => (
              <View key={f.id} style={styles.facilityChip}>
                <Icon name="checkmark-circle" size={moderateScale(16)} color="#6C5CE7" />
                <Text style={styles.facilityName}>{f.name}</Text>
              </View>
            ))}
            {gymFacilities.length === 0 && (
              <Text style={styles.noFacilities}>Facilities info not available</Text>
            )}
          </View>

          {/* Trainers */}
          <Text style={styles.sectionTitle}>Certified Coaches & Trainers</Text>
          {loadingTrainers ? (
            <ActivityIndicator size="small" color="#6C5CE7" style={{ marginVertical: 16 }} />
          ) : trainers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="person-outline" size={moderateScale(28)} color="#94A3B8" />
              <Text style={styles.emptySub}>No coaches listed yet for this branch.</Text>
            </View>
          ) : (
            <View style={styles.trainersRow}>
              {trainers.map(trainer => (
                <View key={trainer._id || trainer.id} style={styles.trainerCard}>
                  <View style={styles.trainerAvatar}>
                    <Text style={styles.trainerAvatarText}>
                      {trainer.avatar || (trainer.name ? trainer.name.slice(0, 2).toUpperCase() : 'TR')}
                    </Text>
                  </View>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerSpec} numberOfLines={2}>
                    {trainer.specialization || trainer.specialty || 'General Fitness'}
                  </Text>
                  <Text style={styles.trainerExp}>{trainer.experience || 'Experienced'}</Text>
                  <View style={[styles.availPill, { backgroundColor: trainer.available !== false ? '#ECFDF5' : '#FEF3C7' }]}>
                    <Text style={[styles.availText, { color: trainer.available !== false ? '#10B981' : '#F59E0B' }]}>
                      {trainer.available !== false ? '● Available' : '○ Busy'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Location & Contact */}
          <Text style={styles.sectionTitle}>Location & Contact</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Icon name="location-outline" size={moderateScale(18)} color="#6C5CE7" />
              <Text style={styles.contactText}>{gym.address || 'Civil Lines'}, {gym.city || 'Nagpur'}</Text>
            </View>
            <View style={styles.contactDivider} />
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => gym.phone && Linking.openURL(`tel:${gym.phone}`)}
            >
              <Icon name="call-outline" size={moderateScale(18)} color="#00C48C" />
              <Text style={styles.contactText}>{gym.phone || '+91 98765 43210'}</Text>
            </TouchableOpacity>
            <View style={styles.contactDivider} />
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => gym.email && Linking.openURL(`mailto:${gym.email}`)}
            >
              <Icon name="mail-outline" size={moderateScale(18)} color="#38BDF8" />
              <Text style={styles.contactText}>{gym.email || 'contact@fitcore.in'}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: hp(10) }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0EA5E9' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#0EA5E9' },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: wp(5), paddingTop: hp(1.5), paddingBottom: hp(2.5),
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: fontScale(12), color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: fontScale(22), fontWeight: '800', color: '#FFFFFF' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: moderateScale(12), paddingVertical: moderateScale(7), borderRadius: moderateScale(20) },
  statusDot: { width: moderateScale(8), height: moderateScale(8), borderRadius: moderateScale(4) },
  statusText: { fontSize: fontScale(12), fontWeight: '700' },
  scroll: {
    padding: wp(5), paddingBottom: hp(5),
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  gymInfoCard: { backgroundColor: '#FFFFFF', borderRadius: moderateScale(16), padding: moderateScale(20), marginBottom: hp(2.5), borderWidth: 1, borderColor: '#E2E8F0' },
  gymTagline: { fontSize: fontScale(14.5), fontStyle: 'italic', color: '#475569', marginBottom: moderateScale(12) },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: moderateScale(10) },
  ratingText: { fontSize: fontScale(13), fontWeight: '700', color: '#94A3B8', marginLeft: 8 },
  gymHours: { fontSize: fontScale(13), fontWeight: '600', color: '#0EA5E9' },
  sectionTitle: { fontSize: fontScale(15), fontWeight: '700', color: '#0F172A', marginBottom: moderateScale(12) },
  photoScroll: { marginBottom: hp(2.5) },
  photoCard: { width: moderateScale(140), height: moderateScale(120), backgroundColor: '#EFF6FF', borderRadius: moderateScale(16), marginRight: moderateScale(12), alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#DBEAFE' },
  photoCardActive: { borderColor: '#0EA5E9', borderWidth: 2 },
  photoLabel: { fontSize: fontScale(11), fontWeight: '600', color: '#94A3B8' },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: moderateScale(10), marginBottom: hp(2.5) },
  facilityChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: moderateScale(14), paddingVertical: moderateScale(10), borderRadius: moderateScale(20), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  facilityIcon: { fontSize: fontScale(18) },
  facilityName: { fontSize: fontScale(13), fontWeight: '600', color: '#475569' },
  noFacilities: { fontSize: fontScale(13), color: '#94A3B8' },
  trainersRow: { flexDirection: 'row', gap: moderateScale(12), marginBottom: hp(2.5) },
  trainerCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: moderateScale(16), padding: moderateScale(14), alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', gap: 5 },
  trainerAvatar: { width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(26), backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  trainerAvatarText: { fontSize: fontScale(16), fontWeight: '800', color: '#8B5CF6' },
  trainerName: { fontSize: fontScale(13), fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  trainerSpec: { fontSize: fontScale(11), color: '#475569', textAlign: 'center' },
  trainerExp: { fontSize: fontScale(10), color: '#94A3B8', fontWeight: '600' },
  availPill: { paddingHorizontal: moderateScale(10), paddingVertical: moderateScale(4), borderRadius: moderateScale(20) },
  availText: { fontSize: fontScale(10), fontWeight: '700' },
  contactCard: { backgroundColor: '#FFFFFF', borderRadius: moderateScale(16), paddingHorizontal: moderateScale(20), marginBottom: hp(2), borderWidth: 1, borderColor: '#E2E8F0' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: moderateScale(14), gap: 12 },
  contactIcon: { fontSize: fontScale(18) },
  contactText: { fontSize: fontScale(13), fontWeight: '500', color: '#0F172A', flex: 1 },
  contactDivider: { height: 1, backgroundColor: '#F1F5F9' },
  mapPlaceholder: { backgroundColor: '#EFF6FF', borderRadius: moderateScale(16), height: moderateScale(120), alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#DBEAFE' },
  mapIcon: { fontSize: fontScale(36) },
  mapText: { fontSize: fontScale(13), fontWeight: '700', color: '#0EA5E9' },
  mapAddress: { fontSize: fontScale(11), color: '#94A3B8', textAlign: 'center', paddingHorizontal: 20 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: moderateScale(16), padding: moderateScale(24), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: hp(2.5) },
  emptySub: { fontSize: fontScale(12), color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: fontScale(60) },
  emptyText: { fontSize: fontScale(16), color: '#94A3B8', marginTop: 12 },
});
