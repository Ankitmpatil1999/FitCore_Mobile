import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Modal,
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
import {
  getVendorProductsByStore,
  VENDOR_PRODUCTS,
  VendorProduct,
  ProductCategory,
} from '../../data/mockData';

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

const CAT_ICONS: Record<string, string> = {
  protein: '💪',
  creatine: '⚗️',
  pre_workout: '🔥',
  mass_gainer: '🏋️',
  bcaa: '💊',
  multivitamin: '🌿',
  fish_oil: '🐟',
  peanut_butter: '🥜',
  oats: '🥣',
  accessories: '🥤',
  equipment: '🏋',
  apparel: '👕',
};

export default function VendorProductsScreen() {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const [products, setProducts] = useState<VendorProduct[]>(getVendorProductsByStore(vendorId));
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | ProductCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form state
  const [nName, setNName] = useState('');
  const [nBrand, setNBrand] = useState('');
  const [nCategory, setNCategory] = useState<ProductCategory>('protein');
  const [nMemberPrice, setNMemberPrice] = useState('');
  const [nStock, setNStock] = useState('');

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

  const categories = [...new Set(products.map((p) => p.category))] as ProductCategory[];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSaveProduct = () => {
    if (!nName || !nBrand || !nMemberPrice || !nStock) {
      Alert.alert('Required', 'Name, Brand, Price and Stock are required.');
      return;
    }

    const newProduct: VendorProduct = {
      id: `vp${Date.now()}`,
      vendorId,
      name: nName,
      brand: nBrand,
      category: nCategory,
      description: '',
      ingredients: '',
      nutritionFacts: '',
      weight: '1 kg',
      flavours: [],
      images: [CAT_ICONS[nCategory] ?? '📦'],
      mrp: parseFloat(nMemberPrice) * 1.25,
      price: parseFloat(nMemberPrice),
      ownerPrice: parseFloat(nMemberPrice) * 0.85,
      memberPrice: parseFloat(nMemberPrice),
      margin: 15,
      discount: 20,
      ownerDiscount: 35,
      stock: parseInt(nStock, 10),
      lowStockThreshold: 5,
      expiryDate: '2027-12-31',
      rating: 5.0,
      reviews: 0,
      sold: 0,
      isActive: true,
      tags: [],
      offer: 'In Stock',
    };

    setProducts((prev) => [newProduct, ...prev]);
    VENDOR_PRODUCTS.push(newProduct);
    Alert.alert('✓ Added', `${nName} has been added to your catalog!`);
    setShowAddModal(false);
    setNName('');
    setNBrand('');
    setNMemberPrice('');
    setNStock('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Products & Catalog</Text>
            <Text style={styles.headerSub}>{products.length} Active SKUs</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={moderateScale(18)} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ Add SKU</Text>
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={moderateScale(18)} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplements, brand..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={moderateScale(16)} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── CATEGORY PILLS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={{ paddingHorizontal: wp(5), gap: moderateScale(8) }}
        >
          <TouchableOpacity
            style={[styles.catChip, catFilter === 'all' && styles.catChipActive]}
            onPress={() => setCatFilter('all')}
          >
            <Text style={[styles.catChipText, catFilter === 'all' && styles.catChipTextActive]}>
              All ({products.length})
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, catFilter === cat && styles.catChipActive]}
              onPress={() => setCatFilter(cat)}
            >
              <Text style={{ fontSize: fontScale(12) }}>{CAT_ICONS[cat] ?? '📦'}</Text>
              <Text style={[styles.catChipText, catFilter === cat && styles.catChipTextActive]}>
                {cat.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filtered.map((product) => {
            const isLowStock = product.stock <= product.lowStockThreshold;

            return (
              <AnimatedPressable key={product.id} style={styles.productCard}>
                <View style={styles.emojiBox}>
                  <Text style={styles.emojiIcon}>{CAT_ICONS[product.category] ?? '📦'}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.brandRow}>
                    <Text style={styles.brandText}>{product.brand}</Text>
                    <View
                      style={[
                        styles.stockPill,
                        { backgroundColor: isLowStock ? 'rgba(255, 77, 109, 0.10)' : 'rgba(0, 196, 140, 0.10)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockPillText,
                          { color: isLowStock ? '#FF4D6D' : '#00C48C' },
                        ]}
                      >
                        {product.stock} in stock
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.productName}>{product.name}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.memberPrice}>₹{product.memberPrice.toLocaleString()}</Text>
                    {product.mrp > product.memberPrice && (
                      <Text style={styles.mrpText}>₹{product.mrp.toLocaleString()}</Text>
                    )}
                    <Text style={styles.soldCount}>• {product.sold || 42} sold</Text>
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ADD PRODUCT MODAL ── */}
        <Modal visible={showAddModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New SKU</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nName}
                  onChangeText={setNName}
                  placeholder="e.g. NitroTech 100% Whey Gold"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nBrand}
                  onChangeText={setNBrand}
                  placeholder="e.g. MuscleTech"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Member Price (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nMemberPrice}
                  onChangeText={setNMemberPrice}
                  placeholder="e.g. 4899"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nStock}
                  onChangeText={setNStock}
                  placeholder="e.g. 25"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveProduct}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>PUBLISH TO STORE</Text>
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
  headerTitle: {
    fontSize: fontScale(21),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    marginHorizontal: wp(5),
    height: moderateScale(44),
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.2),
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
  },

  catScroll: {
    maxHeight: moderateScale(42),
    marginBottom: hp(1.5),
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  catChipActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  catChipText: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: wp(5),
  },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  emojiBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(16),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  emojiIcon: {
    fontSize: fontScale(24),
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  brandText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#6C5CE7',
    textTransform: 'uppercase',
  },
  stockPill: {
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  stockPillText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
  },
  productName: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  memberPrice: {
    fontSize: fontScale(14.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  mrpText: {
    fontSize: fontScale(11.5),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  soldCount: {
    fontSize: fontScale(11),
    color: '#64748B',
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
