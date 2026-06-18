import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import {
  getVendorProductsByStore, VENDOR_PRODUCTS, VendorProduct, ProductCategory,
} from '../../data/mockData';

const CAT_ICONS: Record<string, string> = {
  protein: '💪', creatine: '⚗️', pre_workout: '🔥', mass_gainer: '🏋️',
  bcaa: '💊', multivitamin: '🌿', fish_oil: '🐟', peanut_butter: '🥜',
  oats: '🥣', accessories: '🥤', equipment: '🏋', apparel: '👕',
};

const CAT_COLORS: Record<string, string> = {
  protein: '#8B5CF6', creatine: '#3B82F6', pre_workout: '#EF4444', mass_gainer: '#10B981',
  bcaa: '#EC4899', multivitamin: '#0EA5E9', fish_oil: '#14B8A6', peanut_butter: '#F59E0B',
  oats: '#78716C', accessories: '#F97316', equipment: '#6366F1', apparel: '#DB2777',
};

export default function VendorProductsScreen() {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const [products, setProducts] = useState<VendorProduct[]>(getVendorProductsByStore(vendorId));
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | ProductCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<VendorProduct | null>(null);

  // New product form state
  const [nName, setNName] = useState('');
  const [nBrand, setNBrand] = useState('');
  const [nCategory, setNCategory] = useState<ProductCategory>('protein');
  const [nMrp, setNMrp] = useState('');
  const [nPrice, setNPrice] = useState('');
  const [nStock, setNStock] = useState('');
  const [nWeight, setNWeight] = useState('');
  const [nExpiry, setNExpiry] = useState('');

  const categories = [...new Set(products.map(p => p.category))] as ProductCategory[];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSaveProduct = () => {
    if (!nName || !nBrand || !nPrice || !nStock) {
      Alert.alert('Required', 'Name, Brand, Price and Stock are required.');
      return;
    }

    const disc = nMrp && nPrice
      ? Math.round(((parseFloat(nMrp) - parseFloat(nPrice)) / parseFloat(nMrp)) * 100)
      : 0;

    const newProduct: VendorProduct = {
      id: `vp${Date.now()}`,
      vendorId,
      name: nName,
      brand: nBrand,
      category: nCategory,
      description: '',
      ingredients: '',
      nutritionFacts: '',
      weight: nWeight || 'N/A',
      flavours: [],
      images: [CAT_ICONS[nCategory] ?? '📦'],
      mrp: parseFloat(nMrp) || parseFloat(nPrice),
      price: parseFloat(nPrice),
      discount: disc,
      stock: parseInt(nStock, 10),
      lowStockThreshold: 5,
      expiryDate: nExpiry || 'N/A',
      rating: 0,
      reviews: 0,
      sold: 0,
      isActive: true,
      tags: [],
      offer: disc > 0 ? `${disc}% OFF` : '',
    };

    setProducts(prev => [newProduct, ...prev]);
    VENDOR_PRODUCTS.push(newProduct);
    Alert.alert('Success', `${nName} has been added to your catalogue!`);
    setShowAddModal(false);
    setNName(''); setNBrand(''); setNMrp(''); setNPrice('');
    setNStock(''); setNWeight(''); setNExpiry('');
  };

  const handleToggleActive = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, isActive: !p.isActive } : p,
    ));
  };

  const handleDelete = (productId: string, name: string) => {
    Alert.alert('Delete Product', `Remove "${name}" from your catalogue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setProducts(prev => prev.filter(p => p.id !== productId)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Catalogue Management</Text>
            <Text style={styles.headerTitle}>Products 📦</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catChip, catFilter === 'all' && styles.catChipActive]}
            onPress={() => setCatFilter('all')}
          >
            <Text style={[styles.catChipText, catFilter === 'all' && { color: '#FFFFFF' }]}>All ({products.length})</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, catFilter === cat && { backgroundColor: CAT_COLORS[cat] ?? '#7C3AED', borderColor: CAT_COLORS[cat] ?? '#7C3AED' }]}
              onPress={() => setCatFilter(cat)}
            >
              <Text style={{ fontSize: 12 }}>{CAT_ICONS[cat] ?? '📦'}</Text>
              <Text style={[styles.catChipText, catFilter === cat && { color: '#FFFFFF' }]}>
                {cat.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>{filtered.length} products</Text>

          {filtered.map(product => {
            const catColor = CAT_COLORS[product.category] ?? '#7C3AED';
            const isLowStock = product.stock <= product.lowStockThreshold;
            return (
              <View key={product.id} style={[styles.productCard, !product.isActive && { opacity: 0.6 }]}>
                <View style={styles.productLeft}>
                  <View style={[styles.productEmoji, { backgroundColor: catColor + '18' }]}>
                    <Text style={{ fontSize: 26 }}>{product.images[0]}</Text>
                  </View>
                </View>

                <View style={styles.productInfo}>
                  <View style={styles.productTopRow}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    {product.tags.includes('bestseller') && (
                      <View style={styles.bestsellerBadge}>
                        <Text style={styles.bestsellerText}>⭐ Best</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productBrand}>{product.brand} · {product.weight}</Text>

                  <View style={styles.productPriceRow}>
                    <Text style={[styles.productPrice, { color: catColor }]}>₹{product.price.toLocaleString('en-IN')}</Text>
                    {product.mrp > product.price && (
                      <Text style={styles.productMrp}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                    )}
                    {product.discount > 0 && (
                      <View style={styles.discChip}>
                        <Text style={styles.discText}>{product.discount}% OFF</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.productMetaRow}>
                    <View style={[styles.stockPill, { backgroundColor: isLowStock ? '#FEF3C7' : '#ECFDF5' }]}>
                      <Text style={[styles.stockText, { color: isLowStock ? '#D97706' : '#10B981' }]}>
                        {isLowStock ? '⚠️' : '✅'} {product.stock} in stock
                      </Text>
                    </View>
                    <Text style={styles.soldText}>Sold: {product.sold}</Text>
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingText}>⭐ {product.rating}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: product.isActive ? '#ECFDF5' : '#FEE2E2' }]}
                    onPress={() => handleToggleActive(product.id)}
                  >
                    <Text style={{ fontSize: 14 }}>{product.isActive ? '🟢' : '🔴'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleDelete(product.id, product.name)}
                  >
                    <Text style={{ fontSize: 14 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── ADD PRODUCT MODAL ── */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Category picker */}
            <Text style={styles.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {(Object.keys(CAT_ICONS) as ProductCategory[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, nCategory === cat && { backgroundColor: CAT_COLORS[cat] ?? '#7C3AED', borderColor: CAT_COLORS[cat] ?? '#7C3AED' }]}
                  onPress={() => setNCategory(cat)}
                >
                  <Text style={{ fontSize: 14 }}>{CAT_ICONS[cat]}</Text>
                  <Text style={[styles.catChipText, nCategory === cat && { color: '#FFFFFF' }]}>{cat.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {[
              { label: 'Product Name *', val: nName, set: setNName, ph: 'e.g. Whey Protein 2kg' },
              { label: 'Brand *', val: nBrand, set: setNBrand, ph: 'e.g. MuscleBlaze' },
              { label: 'Weight / Size', val: nWeight, set: setNWeight, ph: 'e.g. 2 kg, 300 g' },
              { label: 'MRP (₹)', val: nMrp, set: setNMrp, ph: 'e.g. 3499', numeric: true },
              { label: 'Selling Price (₹) *', val: nPrice, set: setNPrice, ph: 'e.g. 2799', numeric: true },
              { label: 'Stock Quantity *', val: nStock, set: setNStock, ph: 'e.g. 20', numeric: true },
              { label: 'Expiry Date', val: nExpiry, set: setNExpiry, ph: 'e.g. 2027-06-01' },
            ].map(f => (
              <View key={f.label}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.ph}
                  placeholderTextColor="#94A3B8"
                  value={f.val}
                  onChangeText={f.set}
                  keyboardType={(f as any).numeric ? 'numeric' : 'default'}
                />
              </View>
            ))}

            {nMrp && nPrice && parseFloat(nMrp) > parseFloat(nPrice) && (
              <View style={styles.discPreview}>
                <Text style={styles.discPreviewText}>
                  💰 Discount: {Math.round(((parseFloat(nMrp) - parseFloat(nPrice)) / parseFloat(nMrp)) * 100)}% OFF
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>📦 Save Product</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7C3AED' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#7C3AED', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  catScroll: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F8FAFC', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  catChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  catChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  scroll: { padding: 16, paddingBottom: 40 },
  countLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 12 },
  productCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  productLeft: {},
  productEmoji: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, gap: 5 },
  productTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productName: { flex: 1, fontSize: 14, fontWeight: '800', color: '#0F172A' },
  bestsellerBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  bestsellerText: { fontSize: 9, fontWeight: '700', color: '#D97706' },
  productBrand: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productPrice: { fontSize: 15, fontWeight: '800' },
  productMrp: { fontSize: 11, color: '#94A3B8', textDecorationLine: 'line-through' },
  discChip: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  discText: { fontSize: 9, fontWeight: '700', color: '#10B981' },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stockPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  stockText: { fontSize: 10, fontWeight: '700' },
  soldText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  ratingPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  ratingText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  productActions: { justifyContent: 'center', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // Modal
  modalRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#7C3AED' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  modalClose: { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },
  modalScroll: { padding: 20, paddingBottom: 40 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  discPreview: { backgroundColor: '#ECFDF5', borderRadius: 10, padding: 12, marginTop: 8 },
  discPreviewText: { fontSize: 13, fontWeight: '700', color: '#10B981', textAlign: 'center' },
  saveBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
