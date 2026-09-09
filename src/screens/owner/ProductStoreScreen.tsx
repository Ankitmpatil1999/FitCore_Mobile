import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { PRODUCTS, Product, ProductCategory } from '../../data/mockData';

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

export default function ProductStoreScreen({ navigation }: any) {
  const { currentGym } = useAppContext();
  const gymId = currentGym?.id || 'g1';

  const [products, setProducts] = useState<Product[]>(() =>
    PRODUCTS.filter((p) => p.gymId === gymId || !p.gymId || p.gymId === 'gym1')
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [addModal, setAddModal] = useState(false);

  // Form
  const [fName, setFName] = useState('');
  const [fBrand, setFBrand] = useState('');
  const [fCategory, setFCategory] = useState<ProductCategory>('protein');
  const [fPrice, setFPrice] = useState('');
  const [fStock, setFStock] = useState('');

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

  const resetForm = () => {
    setFName('');
    setFBrand('');
    setFPrice('');
    setFStock('');
  };

  const handleAdd = () => {
    if (!fName.trim() || !fPrice) {
      Alert.alert('Required', 'Product name and price are required.');
      return;
    }
    const newProduct: Product = {
      id: `p${Date.now()}`,
      gymId: gymId,
      name: fName.trim(),
      brand: fBrand.trim() || 'FitCore Pro',
      category: fCategory,
      mrp: parseInt(fPrice, 10) * 1.25,
      price: parseInt(fPrice, 10),
      stock: parseInt(fStock, 10) || 10,
      sold: 0,
      expiryDate: '2027-12-31',
      supplier: 'FitCore Direct',
      offer: 'In Stock',
      emoji: '⚡',
    };
    setProducts((prev) => [...prev, newProduct]);
    Alert.alert('✓ Added', `${fName} added to inventory!`);
    setAddModal(false);
    resetForm();
  };

  const filtered = categoryFilter === 'all'
    ? products
    : products.filter((p) => p.category === categoryFilter);

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
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Product Store & Inventory</Text>
            <Text style={styles.headerSub}>{products.length} Items Listed</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)} activeOpacity={0.85}>
            <Icon name="add" size={moderateScale(18)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── CATEGORY FILTER ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={{ paddingHorizontal: wp(5), gap: moderateScale(8) }}
          >
            {(['all', 'protein', 'creatine', 'pre_workout', 'accessories', 'apparel'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, categoryFilter === cat && styles.categoryPillActive]}
                onPress={() => setCategoryFilter(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryPillText, categoryFilter === cat && styles.categoryPillTextActive]}>
                  {cat === 'all' ? 'All Items' : cat.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── PRODUCT CARDS ── */}
          <View style={styles.grid}>
            {filtered.map((item) => (
              <AnimatedPressable key={item.id} style={styles.productCard}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emojiText}>{item.emoji || '⚡'}</Text>
                </View>

                <Text style={styles.brandText}>{item.brand}</Text>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceVal}>₹{item.price.toLocaleString()}</Text>
                  <View
                    style={[
                      styles.stockBadge,
                      { backgroundColor: item.stock > 5 ? 'rgba(0, 196, 140, 0.10)' : 'rgba(255, 77, 109, 0.10)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockText,
                        { color: item.stock > 5 ? '#00C48C' : '#FF4D6D' },
                      ]}
                    >
                      {item.stock} left
                    </Text>
                  </View>
                </View>
              </AnimatedPressable>
            ))}
          </View>

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ADD PRODUCT MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Product to Store</Text>
                <TouchableOpacity onPress={() => setAddModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fName}
                  onChangeText={setFName}
                  placeholder="e.g. Gold Standard 100% Whey"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fBrand}
                  onChangeText={setFBrand}
                  placeholder="e.g. Optimum Nutrition"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fPrice}
                  onChangeText={setFPrice}
                  placeholder="e.g. 2999"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Initial Stock Units *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fStock}
                  onChangeText={setFStock}
                  placeholder="e.g. 15"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAdd}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>CONFIRM PRODUCT</Text>
              </TouchableOpacity>
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
    fontSize: fontScale(18),
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
  addBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingTop: hp(0.5),
  },

  categoryScroll: {
    maxHeight: moderateScale(42),
    marginBottom: hp(1.5),
  },
  categoryPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  categoryPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  categoryPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(5),
    justifyContent: 'space-between',
  },
  productCard: {
    width: (wp(90) - moderateScale(12)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  emojiContainer: {
    width: '100%',
    height: moderateScale(80),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  emojiText: {
    fontSize: fontScale(36),
  },
  brandText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#6C5CE7',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    marginBottom: 8,
    minHeight: moderateScale(34),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceVal: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  stockBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  stockText: {
    fontSize: fontScale(9),
    fontWeight: '700',
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
  },
  inputGroup: {
    marginBottom: hp(1.8),
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
});
