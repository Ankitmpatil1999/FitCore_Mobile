import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Shadows } from '../../theme';
import { PRODUCTS, Product, ProductCategory } from '../../data/mockData';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  protein: 'Protein',
  creatine: 'Creatine',
  pre_workout: 'Pre-Workout',
  mass_gainer: 'Mass Gainer',
  accessories: 'Accessories',
  apparel: 'Apparel',
  bcaa: 'BCAA',
  multivitamin: 'Multivitamin',
  fish_oil: 'Fish Oil',
  peanut_butter: 'Peanut Butter',
  oats: 'Oats',
  equipment: 'Equipment',
};

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  protein: '#6366F1',
  creatine: '#3B82F6',
  pre_workout: '#EF4444',
  mass_gainer: '#10B981',
  accessories: '#F59E0B',
  apparel: '#EC4899',
  bcaa: '#10B981',
  multivitamin: '#3B82F6',
  fish_oil: '#F59E0B',
  peanut_butter: '#EF4444',
  oats: '#6366F1',
  equipment: '#6366F1',
};

export default function ProductStoreScreen() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [addModal, setAddModal] = useState(false);

  // Form
  const [fName, setFName] = useState('');
  const [fBrand, setFBrand] = useState('');
  const [fCategory, setFCategory] = useState<ProductCategory>('protein');
  const [fMRP, setFMRP] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fStock, setFStock] = useState('');
  const [fExpiry, setFExpiry] = useState('');
  const [fSupplier, setFSupplier] = useState('');
  const [fOffer, setFOffer] = useState('');
  const [fEmoji, setFEmoji] = useState('💪');

  const resetForm = () => {
    setFName(''); setFBrand(''); setFCategory('protein'); setFMRP('');
    setFPrice(''); setFStock(''); setFExpiry(''); setFSupplier('');
    setFOffer(''); setFEmoji('💪');
  };

  const filtered = categoryFilter === 'all'
    ? products
    : products.filter(p => p.category === categoryFilter);

  const todaySold = products.reduce((s, p) => s + p.sold, 0);
  const lowStock = products.filter(p => typeof p.stock === 'number' && p.stock <= 5);
  const totalRevenue = products.reduce((s, p) => s + p.sold * p.price, 0);

  const handleAdd = () => {
    if (!fName.trim() || !fPrice) {
      Alert.alert('Required', 'Product name and price are required.');
      return;
    }
    const newProduct: Product = {
      id: `p${Date.now()}`,
      gymId: 'gym1',
      name: fName.trim(),
      brand: fBrand.trim(),
      category: fCategory,
      mrp: parseInt(fMRP, 10) || parseInt(fPrice, 10),
      price: parseInt(fPrice, 10),
      stock: parseInt(fStock, 10) || 0,
      sold: 0,
      expiryDate: fExpiry.trim() || 'N/A',
      supplier: fSupplier.trim(),
      offer: fOffer.trim(),
      emoji: fEmoji,
    };
    setProducts(prev => [...prev, newProduct]);
    Alert.alert('Added', `${fName} added to store!`);
    setAddModal(false);
    resetForm();
  };

  const removeProduct = (p: Product) => {
    Alert.alert('Remove Product', `Remove "${p.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setProducts(prev => prev.filter(x => x.id !== p.id)) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Inventory</Text>
              <Text style={styles.headerTitle}>Product Store 🛒</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>₹{(totalRevenue / 1000).toFixed(1)}K</Text>
              <Text style={styles.statLabel}>Total Sales</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{products.length}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={[styles.statCard, lowStock.length > 0 && { borderColor: '#FCD34D' }]}>
              <Text style={[styles.statVal, { color: lowStock.length > 0 ? '#F59E0B' : '#0F172A' }]}>
                {lowStock.length}
              </Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
          </View>

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <View style={styles.alertBanner}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertText}>
                {lowStock.map(p => p.name).join(', ')} running low!
              </Text>
            </View>
          )}

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            <TouchableOpacity
              style={[styles.catChip, categoryFilter === 'all' && styles.catChipActive]}
              onPress={() => setCategoryFilter('all')}
            >
              <Text style={[styles.catChipText, categoryFilter === 'all' && { color: '#FFFFFF' }]}>All</Text>
            </TouchableOpacity>
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, categoryFilter === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.catChipText, categoryFilter === cat && { color: '#FFFFFF' }]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product grid */}
          <View style={styles.productGrid}>
            {filtered.map(product => {
              const discount = product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;
              const isLow = product.stock <= 5;
              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productEmoji}>
                    <Text style={{ fontSize: 32 }}>{product.emoji}</Text>
                  </View>

                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{discount}% OFF</Text>
                    </View>
                  )}

                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
                    {discount > 0 && (
                      <Text style={styles.productMRP}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                    )}
                  </View>

                  <View style={styles.stockRow}>
                    <View style={[styles.stockPill, { backgroundColor: isLow ? '#FEF3C7' : '#ECFDF5' }]}>
                      <Text style={[styles.stockText, { color: isLow ? '#F59E0B' : '#10B981' }]}>
                        {isLow ? '⚠️' : '✅'} {product.stock} in stock
                      </Text>
                    </View>
                    <Text style={styles.soldText}>{product.sold} sold</Text>
                  </View>

                  {product.expiryDate !== 'N/A' && (
                    <Text style={styles.expiryText}>Exp: {product.expiryDate}</Text>
                  )}

                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeProduct(product)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* ADD MODAL */}
        <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => { setAddModal(false); resetForm(); }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add New Product</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { label: 'Product Name *', val: fName, set: setFName, ph: 'e.g. Whey Protein 2kg' },
                  { label: 'Brand', val: fBrand, set: setFBrand, ph: 'e.g. MuscleBlaze' },
                  { label: 'MRP (₹)', val: fMRP, set: setFMRP, ph: 'e.g. 3499', kb: 'numeric' as const },
                  { label: 'Selling Price (₹) *', val: fPrice, set: setFPrice, ph: 'e.g. 2999', kb: 'numeric' as const },
                  { label: 'Stock (units)', val: fStock, set: setFStock, ph: 'e.g. 12', kb: 'numeric' as const },
                  { label: 'Expiry Date', val: fExpiry, set: setFExpiry, ph: 'e.g. 2027-06-01' },
                  { label: 'Supplier', val: fSupplier, set: setFSupplier, ph: 'e.g. HealthKart' },
                  { label: 'Offer Label', val: fOffer, set: setFOffer, ph: 'e.g. 15% OFF' },
                  { label: 'Emoji Icon', val: fEmoji, set: setFEmoji, ph: '💪' },
                ].map(field => (
                  <View key={field.label}>
                    <Text style={styles.inputLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={field.ph}
                      placeholderTextColor="#94A3B8"
                      value={field.val}
                      onChangeText={field.set}
                      keyboardType={(field as any).kb ?? 'default'}
                    />
                  </View>
                ))}

                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.catGrid}>
                  {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catSelectBtn, fCategory === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]}
                      onPress={() => setFCategory(cat)}
                    >
                      <Text style={[styles.catSelectText, fCategory === cat && { color: '#FFFFFF' }]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddModal(false); resetForm(); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                    <Text style={styles.submitBtnText}>Add Product</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  addBtn: { backgroundColor: LightColors.accentViolet, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LightColors.accentViolet },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scroll: {
    padding: 20, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: LightColors.bgSurface, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: LightColors.border, ...Shadows.card },
  statVal: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary },
  statLabel: { fontSize: 10, color: LightColors.textMuted, fontWeight: '600', marginTop: 4 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: LightColors.warningBg, borderRadius: 12, padding: 12, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: LightColors.warning },
  alertIcon: { fontSize: 16 },
  alertText: { flex: 1, fontSize: 12, fontWeight: '600', color: LightColors.warning },
  catScroll: { marginBottom: 16 },
  catChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: LightColors.bgElevated, marginRight: 8, borderWidth: 1, borderColor: LightColors.border },
  catChipActive: { backgroundColor: LightColors.accentViolet, borderColor: LightColors.accentViolet },
  catChipText: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  productCard: { width: '47%', backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: LightColors.border, ...Shadows.card, position: 'relative' },
  productEmoji: { width: 56, height: 56, borderRadius: 28, backgroundColor: LightColors.bgElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  discountBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: LightColors.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  discountText: { fontSize: 9, fontWeight: '800', color: LightColors.success },
  productBrand: { fontSize: 10, fontWeight: '600', color: LightColors.textMuted, textTransform: 'uppercase' },
  productName: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary, marginTop: 3, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  productPrice: { fontSize: 16, fontWeight: '800', color: LightColors.accentViolet },
  productMRP: { fontSize: 11, color: LightColors.textMuted, textDecorationLine: 'line-through' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  stockPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  stockText: { fontSize: 10, fontWeight: '700' },
  soldText: { fontSize: 10, color: LightColors.textMuted, fontWeight: '600' },
  expiryText: { fontSize: 10, color: LightColors.textMuted, marginBottom: 8 },
  removeBtn: { backgroundColor: LightColors.dangerBg, borderRadius: 8, paddingVertical: 7, alignItems: 'center', marginTop: 6 },
  removeBtnText: { fontSize: 11, fontWeight: '700', color: LightColors.danger },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: LightColors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: LightColors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: LightColors.bgBase, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: LightColors.textPrimary },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catSelectBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border },
  catSelectText: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 12 },
  cancelBtn: { flex: 1, backgroundColor: LightColors.bgElevated, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: LightColors.textSecondary },
  submitBtn: { flex: 1, backgroundColor: LightColors.accentViolet, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
