import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { LightColors } from '../../theme';
import {
  getVendorWallet, getVendorTransactions, VENDOR_STORES,
  VendorStore, VendorTransaction, VendorWallet as WalletType,
  KycDocument, KycDocType, KycStatus,
} from '../../data/mockData';

const CAT_LABELS: Record<string, string> = {
  supplement_store: 'Supplement Store 💊',
  nutrition_shop: 'Nutrition Shop 🥗',
  equipment_dealer: 'Equipment Dealer 🏋️',
  accessories_store: 'Gym Accessories 🎒',
  sports_nutrition: 'Sports Nutrition 🥛',
};

const KYC_CONFIG: Record<KycDocType, { icon: string; title: string; subtitle: string; hasNumber: boolean; placeholder: string }> = {
  aadhaar:          { icon: '🪪', title: 'Aadhaar Card', subtitle: '12-digit unique identity number', hasNumber: true, placeholder: 'xxxx xxxx xxxx' },
  pan:              { icon: '📄', title: 'PAN Card', subtitle: '10-character income tax identifier', hasNumber: true, placeholder: 'ABCDE1234F' },
  electricity_bill: { icon: '⚡', title: 'Electricity Bill', subtitle: 'Recent bill (within 3 months)', hasNumber: false, placeholder: '' },
  shop_license:     { icon: '🏪', title: 'Shop License', subtitle: 'Valid shop & establishment license', hasNumber: true, placeholder: 'e.g. MH/SHOP/2024/XXXX' },
};

const KYC_STATUS_CFG: Record<KycStatus, { label: string; color: string; bg: string; icon: string }> = {
  not_uploaded: { label: 'Not Uploaded', color: LightColors.textMuted, bg: LightColors.bgElevated, icon: '📤' },
  pending:      { label: 'Under Review', color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
  verified:     { label: 'Verified',     color: '#10B981', bg: '#ECFDF5', icon: '✅' },
  rejected:     { label: 'Rejected',     color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

const SHOP_EMOJI_OPTIONS = ['🏪', '🏬', '💊', '🥗', '🏋️', '🎒', '🥛', '💪', '⚡', '🌟'];

export default function VendorProfileScreen() {
  const { currentVendor, logout } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const [store, setStore] = useState<VendorStore | null>(currentVendor);
  const [wallet, setWallet] = useState<WalletType | undefined>(getVendorWallet(vendorId));
  const [transactions, setTransactions] = useState<VendorTransaction[]>(getVendorTransactions(vendorId));

  // Delivery settings
  const [freeDelAbove, setFreeDelAbove] = useState(store?.freeDeliveryAbove.toString() ?? '999');
  const [delCharges, setDelCharges] = useState(store?.deliveryCharges.toString() ?? '49');

  // Shop image
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [shopImage, setShopImage] = useState(store?.shopImage ?? '🏪');

  // Tagline editing
  const [editTagline, setEditTagline] = useState(false);
  const [taglineText, setTaglineText] = useState(store?.tagline ?? '');

  // KYC state
  const [kycDocs, setKycDocs] = useState<KycDocument[]>(
    store?.kycDocuments ?? [
      { type: 'aadhaar', label: 'Aadhaar Card', number: '', status: 'not_uploaded', uploadedAt: '' },
      { type: 'pan', label: 'PAN Card', number: '', status: 'not_uploaded', uploadedAt: '' },
      { type: 'electricity_bill', label: 'Electricity Bill', number: '', status: 'not_uploaded', uploadedAt: '' },
      { type: 'shop_license', label: 'Shop License', number: '', status: 'not_uploaded', uploadedAt: '' },
    ]
  );
  const [showKycModal, setShowKycModal] = useState(false);
  const [editingKyc, setEditingKyc] = useState<KycDocument | null>(null);
  const [kycNumber, setKycNumber] = useState('');

  const handleSimulateApproval = () => {
    if (!store) return;
    const updatedStore = { ...store, status: 'approved' as const };
    setStore(updatedStore);
    const idx = VENDOR_STORES.findIndex(s => s.id === store.id);
    if (idx !== -1) VENDOR_STORES[idx].status = 'approved';
    Alert.alert('Demo Mode Success', 'Vendor store approved!');
  };

  const handleRequestPayout = () => {
    if (!wallet || wallet.availableBalance <= 0) {
      Alert.alert('Insufficient Balance', 'No available balance to withdraw.');
      return;
    }
    const withdrawAmt = wallet.availableBalance;
    Alert.alert(
      'Request Payout',
      `Transfer ₹${withdrawAmt.toLocaleString('en-IN')} to your bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            const updatedWallet = { ...wallet, availableBalance: 0, totalWithdrawn: wallet.totalWithdrawn + withdrawAmt, lastWithdrawalDate: new Date().toISOString().split('T')[0] };
            setWallet(updatedWallet);
            const newTx: VendorTransaction = {
              id: `VT-${Date.now().toString().slice(-4)}`,
              vendorId,
              type: 'withdrawal',
              amount: withdrawAmt,
              description: `Payout to bank account ****${store?.bankAccount.slice(-4)}`,
              date: new Date().toISOString().split('T')[0],
              status: 'completed',
            };
            setTransactions(prev => [newTx, ...prev]);
            Alert.alert('Transfer Initiated', 'Payout completed successfully!');
          },
        },
      ]
    );
  };

  const handleSaveDelivery = () => {
    if (!store) return;
    const updatedStore = { ...store, freeDeliveryAbove: parseFloat(freeDelAbove) || 0, deliveryCharges: parseFloat(delCharges) || 0 };
    setStore(updatedStore);
    const idx = VENDOR_STORES.findIndex(s => s.id === store.id);
    if (idx !== -1) { VENDOR_STORES[idx].freeDeliveryAbove = parseFloat(freeDelAbove) || 0; VENDOR_STORES[idx].deliveryCharges = parseFloat(delCharges) || 0; }
    Alert.alert('Saved', 'Delivery preferences updated!');
  };

  const handleSaveShopImage = (emoji: string) => {
    setShopImage(emoji);
    setShowImagePicker(false);
    if (store) {
      const updatedStore = { ...store, shopImage: emoji };
      setStore(updatedStore);
      const idx = VENDOR_STORES.findIndex(s => s.id === store.id);
      if (idx !== -1) VENDOR_STORES[idx].shopImage = emoji;
    }
    Alert.alert('Updated', 'Shop image updated!');
  };

  const handleSaveTagline = () => {
    if (!store) return;
    const updatedStore = { ...store, tagline: taglineText };
    setStore(updatedStore);
    const idx = VENDOR_STORES.findIndex(s => s.id === store.id);
    if (idx !== -1) VENDOR_STORES[idx].tagline = taglineText;
    setEditTagline(false);
    Alert.alert('Saved', 'Store tagline updated!');
  };

  const handleOpenKycEdit = (doc: KycDocument) => {
    setEditingKyc(doc);
    setKycNumber(doc.number);
    setShowKycModal(true);
  };

  const handleSubmitKyc = () => {
    if (!editingKyc) return;
    const cfg = KYC_CONFIG[editingKyc.type];
    if (cfg.hasNumber && !kycNumber.trim()) {
      Alert.alert('Required', `Please enter the ${cfg.title} number.`);
      return;
    }
    const updated = kycDocs.map(d =>
      d.type === editingKyc.type
        ? { ...d, number: kycNumber.trim(), status: 'pending' as KycStatus, uploadedAt: new Date().toISOString().split('T')[0] }
        : d
    );
    setKycDocs(updated);
    if (store) {
      const idx = VENDOR_STORES.findIndex(s => s.id === store.id);
      if (idx !== -1) VENDOR_STORES[idx].kycDocuments = updated;
    }
    setShowKycModal(false);
    Alert.alert('Submitted', `${cfg.title} submitted for verification. You will be notified within 24-48 hours.`);
  };

  const kycVerifiedCount = kycDocs.filter(d => d.status === 'verified').length;
  const kycProgress = (kycVerifiedCount / kycDocs.length) * 100;

  if (!store) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No Store Context Found</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isApproved = store.status === 'approved';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSub}>Store Settings</Text>
              <Text style={styles.headerTitle}>⚙️ {store.storeName}</Text>
            </View>
            <TouchableOpacity style={styles.headerLogout} onPress={logout}>
              <Text style={styles.logoutIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── SHOP IMAGE & BRAND ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🖼️ Shop Image & Branding</Text>
            <View style={styles.brandingRow}>
              <TouchableOpacity style={styles.shopImageContainer} onPress={() => setShowImagePicker(true)} activeOpacity={0.85}>
                <Text style={styles.shopImageEmoji}>{shopImage}</Text>
                <View style={styles.shopImageEditBadge}>
                  <Text style={styles.shopImageEditText}>✏️</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.brandingInfo}>
                <Text style={styles.storeNameBrand}>{store.storeName}</Text>
                <Text style={styles.brandCategory}>{CAT_LABELS[store.category] ?? store.category}</Text>
                {!editTagline ? (
                  <TouchableOpacity onPress={() => setEditTagline(true)} activeOpacity={0.8}>
                    <Text style={styles.taglineText}>"{store.tagline}" <Text style={{ color: LightColors.accentViolet, fontSize: 11 }}>✏️ edit</Text></Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.taglineEditRow}>
                    <TextInput
                      style={styles.taglineInput}
                      value={taglineText}
                      onChangeText={setTaglineText}
                      placeholder="Store tagline..."
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity style={styles.taglineSaveBtn} onPress={handleSaveTagline}>
                      <Text style={styles.taglineSaveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Store status */}
            <View style={[styles.statusBanner, {
              backgroundColor: isApproved ? LightColors.successBg : store.status === 'pending' ? LightColors.warningBg : LightColors.dangerBg,
              borderColor: isApproved ? LightColors.success : store.status === 'pending' ? LightColors.warning : LightColors.danger,
            }]}>
              <Text style={{ fontSize: 18 }}>{isApproved ? '✅' : store.status === 'pending' ? '⏳' : '❌'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, { color: isApproved ? LightColors.success : store.status === 'pending' ? LightColors.warning : LightColors.danger }]}>
                  Store: {store.status.toUpperCase()}
                </Text>
                <Text style={styles.statusDesc}>
                  {isApproved ? 'Your store is live & accepting orders' : store.status === 'pending' ? 'Awaiting admin verification' : 'Store suspended'}
                </Text>
              </View>
              {!isApproved && store.status === 'pending' && (
                <TouchableOpacity style={styles.approveBtnSim} onPress={handleSimulateApproval}>
                  <Text style={styles.approveBtnSimText}>Approve (Demo)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── KYC DOCUMENTS ── */}
          <View style={styles.sectionCard}>
            <View style={styles.kycHeader}>
              <Text style={styles.sectionTitle}>🪪 KYC Verification</Text>
              <View style={styles.kycProgressBadge}>
                <Text style={styles.kycProgressText}>{kycVerifiedCount}/{kycDocs.length} Verified</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.kycProgressTrack}>
              <View style={[styles.kycProgressFill, { width: `${kycProgress}%` }]} />
            </View>
            <Text style={styles.kycProgressLabel}>
              {kycProgress === 100 ? '🎉 All documents verified!' : `${Math.round(kycProgress)}% complete — submit remaining docs to go fully verified`}
            </Text>

            {kycDocs.map(doc => {
              const cfg = KYC_CONFIG[doc.type];
              const statusCfg = KYC_STATUS_CFG[doc.status];
              return (
                <View key={doc.type} style={styles.kycDocRow}>
                  <View style={styles.kycDocLeft}>
                    <View style={styles.kycDocIconBox}>
                      <Text style={styles.kycDocIcon}>{cfg.icon}</Text>
                    </View>
                    <View style={styles.kycDocInfo}>
                      <Text style={styles.kycDocTitle}>{cfg.title}</Text>
                      <Text style={styles.kycDocSubtitle}>{cfg.subtitle}</Text>
                      {doc.number ? <Text style={styles.kycDocNumber}>{doc.number}</Text> : null}
                      {doc.uploadedAt ? <Text style={styles.kycDocDate}>Submitted: {doc.uploadedAt}</Text> : null}
                    </View>
                  </View>
                  <View style={styles.kycDocRight}>
                    <View style={[styles.kycStatusBadge, { backgroundColor: statusCfg.bg }]}>
                      <Text style={[styles.kycStatusText, { color: statusCfg.color }]}>
                        {statusCfg.icon} {statusCfg.label}
                      </Text>
                    </View>
                    {doc.status !== 'verified' && (
                      <TouchableOpacity
                        style={styles.kycUploadBtn}
                        onPress={() => handleOpenKycEdit(doc)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.kycUploadBtnText}>
                          {doc.status === 'not_uploaded' ? '📤 Upload' : doc.status === 'rejected' ? '🔄 Re-upload' : '👁️ View'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── WALLET & PAYOUTS ── */}
          {wallet && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💰 Wallet & Payouts</Text>
              <View style={styles.walletStats}>
                <View style={styles.walletRow}>
                  <View style={styles.walletCol}>
                    <Text style={styles.walletLabel}>Available Balance</Text>
                    <Text style={styles.walletValAccent}>₹{wallet.availableBalance.toLocaleString('en-IN')}</Text>
                  </View>
                  <TouchableOpacity style={styles.payoutBtn} onPress={handleRequestPayout} activeOpacity={0.85}>
                    <Text style={styles.payoutBtnText}>Payout 🚀</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.walletDivider} />

                <View style={styles.walletGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Total Earnings</Text>
                    <Text style={styles.gridVal}>₹{wallet.totalEarnings.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Pending Payout</Text>
                    <Text style={styles.gridVal}>₹{wallet.pendingSettlement.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Total Withdrawn</Text>
                    <Text style={styles.gridVal}>₹{wallet.totalWithdrawn.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                {wallet.lastWithdrawalDate && (
                  <Text style={styles.walletDateText}>Last payout: {wallet.lastWithdrawalDate}</Text>
                )}
              </View>
            </View>
          )}

          {/* ── RECENT TRANSACTIONS ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📊 Recent Transactions</Text>
            {transactions.length === 0 ? (
              <Text style={styles.noTxText}>No transactions yet.</Text>
            ) : (
              transactions.slice(0, 5).map((tx) => {
                const isDebit = tx.type === 'withdrawal' || tx.type === 'refund';
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc}>{tx.description}</Text>
                      <Text style={styles.txDate}>{tx.date} · {tx.status.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.txAmt, { color: isDebit ? LightColors.danger : LightColors.success }]}>
                      {isDebit ? '-' : '+'} ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* ── DELIVERY PREFERENCES ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🚚 Delivery Preferences</Text>
            <View style={styles.deliveryFields}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Standard Shipping Charge (₹)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType="numeric"
                  value={delCharges}
                  onChangeText={setDelCharges}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Free Shipping Order Value (₹)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType="numeric"
                  value={freeDelAbove}
                  onChangeText={setFreeDelAbove}
                />
              </View>
              <TouchableOpacity style={styles.saveDelBtn} onPress={handleSaveDelivery} activeOpacity={0.85}>
                <Text style={styles.saveDelBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── STORE DETAILS ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏢 Store Details</Text>
            {[
              { l: 'Store Name', v: store.storeName },
              { l: 'Owner Name', v: store.ownerName },
              { l: 'GSTIN', v: store.gstNumber || 'N/A' },
              { l: 'Phone', v: `📞 ${store.phone}` },
              { l: 'Email', v: `✉️ ${store.email}` },
              { l: 'Address', v: store.address },
              { l: 'City / State', v: `${store.city}, ${store.state} - ${store.pincode}` },
            ].map(row => (
              <View key={row.l} style={styles.rowField}>
                <Text style={styles.rowLabel}>{row.l}</Text>
                <Text style={styles.rowValue}>{row.v}</Text>
              </View>
            ))}
          </View>

          {/* ── BANKING DETAILS ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏦 Settlement Bank Account</Text>
            {[
              { l: 'UPI Address (VPA)', v: store.upiId || wallet?.upiId || 'N/A' },
              { l: 'Bank Account Number', v: store.bankAccount },
              { l: 'Bank IFSC Code', v: store.ifsc },
              { l: 'Settlement Speed', v: 'Instant (UPI) / T+1 (Bank)' },
            ].map(row => (
              <View key={row.l} style={styles.rowField}>
                <Text style={styles.rowLabel}>{row.l}</Text>
                <Text style={styles.rowValue}>{row.v}</Text>
              </View>
            ))}
          </View>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
            <Text style={styles.logoutBtnText}>🚪 Logout from Store</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── SHOP IMAGE PICKER MODAL ── */}
      <Modal visible={showImagePicker} transparent animationType="fade" onRequestClose={() => setShowImagePicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Choose Shop Image</Text>
            <Text style={styles.pickerSubtitle}>Select an icon that represents your store</Text>
            <View style={styles.emojiGrid}>
              {SHOP_EMOJI_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiOption, shopImage === emoji && styles.emojiOptionSelected]}
                  onPress={() => handleSaveShopImage(emoji)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setShowImagePicker(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── KYC UPLOAD MODAL ── */}
      <Modal visible={showKycModal} transparent animationType="slide" onRequestClose={() => setShowKycModal(false)}>
        <View style={styles.kycModalOverlay}>
          <View style={styles.kycModalBox}>
            {editingKyc && (() => {
              const cfg = KYC_CONFIG[editingKyc.type];
              const statusCfg = KYC_STATUS_CFG[editingKyc.status];
              return (
                <>
                  <View style={styles.kycModalHeader}>
                    <Text style={styles.kycModalIcon}>{cfg.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.kycModalTitle}>{cfg.title}</Text>
                      <Text style={styles.kycModalSubtitle}>{cfg.subtitle}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowKycModal(false)}>
                      <Text style={styles.kycModalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {editingKyc.status !== 'not_uploaded' && (
                    <View style={[styles.kycCurrentStatus, { backgroundColor: statusCfg.bg }]}>
                      <Text style={[styles.kycCurrentStatusText, { color: statusCfg.color }]}>
                        {statusCfg.icon} Current Status: {statusCfg.label}
                      </Text>
                    </View>
                  )}

                  {cfg.hasNumber && (
                    <>
                      <Text style={styles.kycInputLabel}>{cfg.title} Number</Text>
                      <TextInput
                        style={styles.kycInput}
                        placeholder={cfg.placeholder}
                        placeholderTextColor="#94A3B8"
                        value={kycNumber}
                        onChangeText={setKycNumber}
                        autoCapitalize="characters"
                      />
                    </>
                  )}

                  <View style={styles.kycUploadArea}>
                    <Text style={styles.kycUploadAreaIcon}>📸</Text>
                    <Text style={styles.kycUploadAreaTitle}>Upload Document</Text>
                    <Text style={styles.kycUploadAreaDesc}>Take a clear photo of your {cfg.title}. Ensure all text is readable.</Text>
                    <TouchableOpacity
                      style={styles.kycPickFileBtn}
                      onPress={() => Alert.alert('Demo Mode', 'File picker is simulated in demo. Tap Submit to proceed.')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.kycPickFileBtnText}>📎 Select Document</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.kycModalActions}>
                    <TouchableOpacity style={styles.kycCancelBtn} onPress={() => setShowKycModal(false)}>
                      <Text style={styles.kycCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.kycSubmitBtn} onPress={handleSubmitKyc} activeOpacity={0.85}>
                      <Text style={styles.kycSubmitBtnText}>📤 Submit for Verification</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LightColors.bgSurface },
  root: { flex: 1, backgroundColor: LightColors.bgBase },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  errorText: { fontSize: 16, fontWeight: '700', color: LightColors.textMuted },
  header: { backgroundColor: LightColors.bgSurface, borderBottomWidth: 1, borderBottomColor: LightColors.border },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerLeft: {},
  headerSub: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LightColors.textPrimary },
  headerLogout: { width: 36, height: 36, borderRadius: 18, backgroundColor: LightColors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  logoutIcon: { fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center' },
  sectionCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: LightColors.border, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Branding
  brandingRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  shopImageContainer: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: `${LightColors.accentViolet}12`,
    borderWidth: 2, borderColor: LightColors.accentViolet,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  shopImageEmoji: { fontSize: 40 },
  shopImageEditBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: LightColors.accentViolet,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: LightColors.bgSurface,
  },
  shopImageEditText: { fontSize: 10 },
  brandingInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  storeNameBrand: { fontSize: 16, fontWeight: '800', color: LightColors.textPrimary },
  brandCategory: { fontSize: 11, color: LightColors.accentViolet, fontWeight: '700' },
  taglineText: { fontSize: 12, color: LightColors.textSecondary, fontStyle: 'italic' },
  taglineEditRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  taglineInput: {
    flex: 1, backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: LightColors.textPrimary,
  },
  taglineSaveBtn: { backgroundColor: LightColors.accentViolet, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  taglineSaveBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4, borderRadius: 10, padding: 12, borderWidth: 1,
  },
  statusTitle: { fontSize: 13, fontWeight: '800' },
  statusDesc: { fontSize: 11, color: LightColors.textSecondary, marginTop: 2 },
  approveBtnSim: { backgroundColor: LightColors.warning, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  approveBtnSimText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  // KYC
  kycHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  kycProgressBadge: { backgroundColor: LightColors.bgElevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  kycProgressText: { fontSize: 11, fontWeight: '700', color: LightColors.textSecondary },
  kycProgressTrack: { height: 6, borderRadius: 3, backgroundColor: LightColors.bgElevated, marginBottom: 6, overflow: 'hidden' },
  kycProgressFill: { height: 6, borderRadius: 3, backgroundColor: LightColors.success },
  kycProgressLabel: { fontSize: 11, color: LightColors.textMuted, marginBottom: 14 },
  kycDocRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: LightColors.border,
  },
  kycDocLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  kycDocIconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: LightColors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  kycDocIcon: { fontSize: 20 },
  kycDocInfo: { flex: 1, gap: 2 },
  kycDocTitle: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary },
  kycDocSubtitle: { fontSize: 10, color: LightColors.textMuted },
  kycDocNumber: { fontSize: 11, fontWeight: '700', color: LightColors.accentViolet, marginTop: 2 },
  kycDocDate: { fontSize: 10, color: LightColors.textMuted },
  kycDocRight: { alignItems: 'flex-end', gap: 8, marginLeft: 10 },
  kycStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  kycStatusText: { fontSize: 10, fontWeight: '700' },
  kycUploadBtn: {
    backgroundColor: `${LightColors.accentViolet}15`,
    borderWidth: 1, borderColor: LightColors.accentViolet,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  kycUploadBtnText: { fontSize: 11, fontWeight: '700', color: LightColors.accentViolet },
  // Wallet
  walletStats: { gap: 12 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletCol: {},
  walletLabel: { fontSize: 12, color: LightColors.textMuted, fontWeight: '600', marginBottom: 4 },
  walletValAccent: { fontSize: 28, fontWeight: '800', color: LightColors.success },
  payoutBtn: { backgroundColor: LightColors.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  payoutBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  walletDivider: { height: 1, backgroundColor: LightColors.border },
  walletGrid: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1, backgroundColor: LightColors.bgElevated, borderRadius: 10, padding: 10, gap: 4 },
  gridLabel: { fontSize: 9, color: LightColors.textMuted, fontWeight: '700' },
  gridVal: { fontSize: 13, fontWeight: '800', color: LightColors.textPrimary },
  walletDateText: { fontSize: 10, color: LightColors.textMuted, fontStyle: 'italic', alignSelf: 'flex-end' },
  // Transactions
  noTxText: { fontSize: 12, color: LightColors.textMuted, fontStyle: 'italic' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LightColors.border },
  txDesc: { fontSize: 13, fontWeight: '700', color: LightColors.textSecondary },
  txDate: { fontSize: 11, color: LightColors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: '800' },
  // Delivery
  deliveryFields: { gap: 12 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, color: LightColors.textSecondary, fontWeight: '600', flex: 1 },
  fieldInput: {
    backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 80,
    fontSize: 13, color: LightColors.textPrimary, textAlign: 'center',
  },
  saveDelBtn: { backgroundColor: LightColors.accentViolet, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  saveDelBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  // Store & Bank details
  rowField: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LightColors.border },
  rowLabel: { fontSize: 13, color: LightColors.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 13, color: LightColors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 },
  // Logout
  logoutBtn: { backgroundColor: LightColors.dangerBg, borderWidth: 1, borderColor: LightColors.danger, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  logoutBtnText: { color: LightColors.danger, fontSize: 14, fontWeight: '700' },
  // Shop image picker modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  pickerBox: { backgroundColor: LightColors.bgSurface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary, textAlign: 'center', marginBottom: 4 },
  pickerSubtitle: { fontSize: 12, color: LightColors.textMuted, textAlign: 'center', marginBottom: 20 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 20 },
  emojiOption: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: LightColors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  emojiOptionSelected: { borderColor: LightColors.accentViolet, backgroundColor: `${LightColors.accentViolet}15` },
  emojiOptionText: { fontSize: 28 },
  pickerCancelBtn: { alignItems: 'center', paddingVertical: 12 },
  pickerCancelText: { fontSize: 14, color: LightColors.textMuted, fontWeight: '600' },
  // KYC modal
  kycModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kycModalBox: {
    backgroundColor: LightColors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  kycModalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  kycModalIcon: { fontSize: 32 },
  kycModalTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary },
  kycModalSubtitle: { fontSize: 11, color: LightColors.textMuted, marginTop: 2 },
  kycModalClose: { fontSize: 20, color: LightColors.textSecondary, fontWeight: '700' },
  kycCurrentStatus: { borderRadius: 10, padding: 10, marginBottom: 14, alignItems: 'center' },
  kycCurrentStatusText: { fontSize: 13, fontWeight: '700' },
  kycInputLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary, marginBottom: 6, marginTop: 8 },
  kycInput: {
    backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: LightColors.textPrimary, marginBottom: 16,
  },
  kycUploadArea: {
    backgroundColor: LightColors.bgElevated, borderRadius: 14, padding: 20,
    alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: LightColors.border,
    borderStyle: 'dashed', marginBottom: 20,
  },
  kycUploadAreaIcon: { fontSize: 36 },
  kycUploadAreaTitle: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary },
  kycUploadAreaDesc: { fontSize: 12, color: LightColors.textMuted, textAlign: 'center', lineHeight: 18 },
  kycPickFileBtn: {
    backgroundColor: `${LightColors.accentViolet}15`, borderWidth: 1, borderColor: LightColors.accentViolet,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 6,
  },
  kycPickFileBtnText: { fontSize: 13, fontWeight: '700', color: LightColors.accentViolet },
  kycModalActions: { flexDirection: 'row', gap: 12 },
  kycCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: LightColors.bgElevated },
  kycCancelBtnText: { fontSize: 14, fontWeight: '700', color: LightColors.textMuted },
  kycSubmitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: LightColors.accentViolet },
  kycSubmitBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
