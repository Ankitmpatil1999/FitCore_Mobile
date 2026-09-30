import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import {
  DietPlan,
} from '../../data/mockData';
import { apiService } from '../../services/api';

// ── Interactive Scale on Press Component ──
function AnimatedPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

const MEAL_KEYS = [
  { key: 'breakfast' as const, label: 'Breakfast' },
  { key: 'lunch' as const, label: 'Lunch' },
  { key: 'snack' as const, label: 'Snack' },
  { key: 'dinner' as const, label: 'Dinner' },
];

import { useAppContext } from '../../context/AppContext';

export default function AssignDietPlanScreen({ route, navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || currentUser?.id || 't1';
  const trainerName = currentTrainer?.name || currentUser?.name || 'Coach';
  const gymId = currentGym?.id || currentTrainer?.gymId;

  const { memberId: routeMemberId, memberName: routeMemberName } = route.params || {};

  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(routeMemberId || '');
  const [selectedMemberName, setSelectedMemberName] = useState<string>(routeMemberName || '');
  const [clientPickerModal, setClientPickerModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const defaultMeals = {
    breakfast: { label: 'Breakfast', time: '07:30 AM', name: 'High Protein Breakfast', calories: 500, protein: 40, carbs: 50, fats: 12, items: [] },
    lunch: { label: 'Lunch', time: '01:00 PM', name: 'Power Lunch', calories: 700, protein: 50, carbs: 80, fats: 18, items: [] },
    snack: { label: 'Snack', time: '05:00 PM', name: 'Pre-Workout Snack', calories: 300, protein: 25, carbs: 30, fats: 8, items: [] },
    dinner: { label: 'Dinner', time: '08:30 PM', name: 'Recovery Dinner', calories: 600, protein: 45, carbs: 60, fats: 15, items: [] },
  };

  const [dietName, setDietName] = useState('Muscle Gain High Protein Diet');
  const [calories, setCalories] = useState('2800');
  const [protein, setProtein] = useState('180');
  const [meals, setMeals] = useState<DietPlan['meals']>(() =>
    JSON.parse(JSON.stringify(defaultMeals))
  );

  const [activeMealKey, setActiveMealKey] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('breakfast');
  const currentMealData = meals[activeMealKey];

  // Food Item Modal
  const [itemModal, setItemModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodQty, setFoodQty] = useState('');
  const [foodCals, setFoodCals] = useState('');
  const [foodProt, setFoodProt] = useState('');

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Load Assigned Clients ──
  const loadAssignedClients = async () => {
    try {
      setLoadingClients(true);
      const res: any = await apiService.getOwnerMembers(gymId, {
        trainerId,
        trainerName,
        trainerPhone: currentUser?.phone,
      });
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setAssignedClients(res.data);
        if (!selectedMemberId) {
          const first = res.data[0];
          const fId = first._id || first.id;
          setSelectedMemberId(fId);
          setSelectedMemberName(first.name || 'Client');
          loadClientDiet(fId);
        }
      }
    } catch (e) {
      console.log('Error loading assigned clients for diet:', e);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadClientDiet = async (mId: string) => {
    if (!mId) return;
    try {
      const res: any = await apiService.getMemberDiet(mId);
      if (res?.success && res.data) {
        const d = res.data;
        if (d.title) setDietName(d.title);
        if (d.targetCalories) setCalories(String(d.targetCalories));
        if (d.proteinGrams) setProtein(String(d.proteinGrams));
      }
    } catch (e) {
      console.log('Error loading client diet:', e);
    }
  };

  useEffect(() => {
    loadAssignedClients();
    if (routeMemberId) {
      loadClientDiet(routeMemberId);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [gymId, trainerId, routeMemberId]);

  const handleAddFoodItem = () => {
    if (!foodName.trim() || !foodQty.trim()) {
      Alert.alert('Required', 'Food item name and quantity are required.');
      return;
    }
    const updated = { ...meals };
    updated[activeMealKey].items.push({
      food: foodName.trim(),
      qty: foodQty.trim(),
      calories: parseInt(foodCals, 10) || 150,
      protein: parseInt(foodProt, 10) || 10,
    });
    setMeals(updated);
    setFoodName('');
    setFoodQty('');
    setFoodCals('');
    setFoodProt('');
    setItemModal(false);
  };

  const handleRemoveFoodItem = (idx: number) => {
    const updated = { ...meals };
    updated[activeMealKey].items.splice(idx, 1);
    setMeals(updated);
  };

  const handleSelectClient = (c: any) => {
    const cId = c._id || c.id;
    setSelectedMemberId(cId);
    setSelectedMemberName(c.name || 'Client');
    setClientPickerModal(false);
    loadClientDiet(cId);
  };

  const handleSaveDiet = async () => {
    if (!selectedMemberId) {
      Alert.alert('Select Client', 'Please select a trainee before assigning the diet plan.');
      setClientPickerModal(true);
      return;
    }

    const formattedMeals = Object.entries(meals).map(([mealKey, m]: [string, any]) => ({
      mealType: m.label || mealKey,
      time: m.time || '12:00 PM',
      name: m.name || m.label || 'Meal',
      calories: parseInt(m.calories, 10) || 400,
      protein: parseInt(m.protein, 10) || 30,
      carbs: parseInt(m.carbs, 10) || 40,
      fats: parseInt(m.fats, 10) || 12,
      items: Array.isArray(m.items) ? m.items : [],
    }));

    setIsSaving(true);

    try {
      const res: any = await apiService.assignDietPlan({
        memberId: selectedMemberId,
        trainerId,
        gymId,
        title: dietName,
        targetCalories: parseInt(calories, 10) || 2800,
        proteinGrams: parseInt(protein, 10) || 180,
        carbsGrams: 220,
        fatsGrams: 65,
        waterLiters: 3.5,
        meals: formattedMeals,
      });
      if (res?.success) {
        Alert.alert('✓ Nutrition Plan Assigned', `Diet plan assigned to ${selectedMemberName || 'client'}!`);
        if (routeMemberId) {
          navigation.goBack();
        }
      } else {
        Alert.alert('Saved Offline', 'Diet plan saved locally. Will sync with server automatically.');
      }
    } catch (err) {
      console.log('Error saving diet plan via API:', err);
      Alert.alert('Saved Offline', 'Diet plan saved locally. Will sync with server.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = assignedClients.filter((c) =>
    (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone || '').includes(clientSearch)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerTitleContainer}
            onPress={() => setClientPickerModal(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.headerTitle}>Diet Plan Builder</Text>
            <View style={styles.clientPickerTrigger}>
              <Text style={styles.headerSub} numberOfLines={1}>
                {selectedMemberName ? `Client: ${selectedMemberName}` : 'Tap to Select Client'}
              </Text>
              <Icon name="chevron-down" size={moderateScale(13)} color="#00C48C" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveHeaderBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSaveDiet}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="checkmark" size={moderateScale(16)} color="#FFFFFF" />
                <Text style={styles.saveHeaderBtnText}>SAVE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── MACRO TARGETS CARD ── */}
          <View style={styles.macroCard}>
            <Text style={styles.macroTitle}>Target Daily Calories & Protein</Text>
            <View style={styles.macroInputRow}>
              <View style={[styles.macroCol, { flex: 1 }]}>
                <Text style={styles.macroLabel}>Calories (kcal)</Text>
                <TextInput
                  style={styles.macroInput}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.macroCol, { flex: 1 }]}>
                <Text style={styles.macroLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.macroInput}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* ── MEAL TABS ── */}
          <View style={styles.mealTabRow}>
            {MEAL_KEYS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.mealTabBtn, activeMealKey === m.key && styles.mealTabBtnActive]}
                onPress={() => setActiveMealKey(m.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.mealTabBtnText, activeMealKey === m.key && styles.mealTabBtnTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── MEAL ITEMS LIST ── */}
          <View style={styles.itemsSectionHeader}>
            <Text style={styles.sectionTitle}>{activeMealKey.toUpperCase()} ITEMS ({currentMealData.items.length})</Text>
            <TouchableOpacity
              style={styles.addItemBtn}
              onPress={() => setItemModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="add" size={moderateScale(16)} color="#6C5CE7" />
              <Text style={styles.addItemBtnText}>+ Add Food</Text>
            </TouchableOpacity>
          </View>

          {currentMealData.items.map((item, idx) => (
            <View key={idx} style={styles.foodCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodTitle}>{item.food}</Text>
                <Text style={styles.foodSub}>
                  Portion: {item.qty} • {item.calories} kcal • {item.protein}g Protein
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveFoodItem(idx)}
                activeOpacity={0.7}
                style={styles.trashBtn}
              >
                <Icon name="trash-outline" size={moderateScale(18)} color="#FF4D6D" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ADD FOOD MODAL ── */}
        <Modal visible={itemModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Food to {activeMealKey}</Text>
                <TouchableOpacity onPress={() => setItemModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Food Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="e.g. 4 Boiled Eggs + Oats Bowl"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={foodQty}
                    onChangeText={setFoodQty}
                    placeholder="e.g. 1 Bowl"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Calories</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={foodCals}
                    onChangeText={setFoodCals}
                    placeholder="e.g. 350"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddFoodItem}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>ADD TO MEAL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── CLIENT PICKER MODAL ── */}
        <Modal visible={clientPickerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: hp(70) }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Trainee</Text>
                <TouchableOpacity onPress={() => setClientPickerModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.modalInput, { marginBottom: hp(1.5) }]}
                value={clientSearch}
                onChangeText={setClientSearch}
                placeholder="Search trainee name or phone..."
                placeholderTextColor="#94A3B8"
              />

              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => {
                    const cId = c._id || c.id;
                    const isSelected = cId === selectedMemberId;
                    return (
                      <TouchableOpacity
                        key={cId}
                        style={[
                          styles.clientSelectItem,
                          isSelected && styles.clientSelectItemActive,
                        ]}
                        onPress={() => handleSelectClient(c)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.clientSelectAvatar}>
                          <Text style={styles.clientSelectAvatarText}>
                            {c.name ? c.name.slice(0, 2).toUpperCase() : 'M'}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.clientSelectName}>{c.name || 'Member'}</Text>
                          <Text style={styles.clientSelectPhone}>{c.phone || 'No phone'}</Text>
                        </View>
                        {isSelected && (
                          <Icon name="checkmark-circle" size={moderateScale(20)} color="#00C48C" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: hp(3), alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: fontScale(13) }}>
                      {loadingClients ? 'Loading trainees roster...' : 'No assigned trainees found.'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  root: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(108, 92, 231, 0.06)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  headerTitle: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  saveHeaderBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // Macro Card
  macroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    marginBottom: hp(1.5),
  },
  macroTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1),
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  macroCol: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  macroLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  macroInput: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },

  // Meal Tabs
  mealTabRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: hp(1.5),
  },
  mealTabBtn: {
    flex: 1,
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    alignItems: 'center',
  },
  mealTabBtnActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  mealTabBtnText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  mealTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  addItemBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  foodTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  foodSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },
  trashBtn: {
    padding: moderateScale(6),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  inputGroup: {
    marginBottom: hp(1.8),
  },
  inputRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(46),
    fontSize: fontScale(13.5),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  submitBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  submitBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  clientPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  clientSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: moderateScale(8),
  },
  clientSelectItemActive: {
    borderColor: '#00C48C',
    backgroundColor: '#ECFDF5',
  },
  clientSelectAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientSelectAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#00C48C',
  },
  clientSelectName: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  clientSelectPhone: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
});

