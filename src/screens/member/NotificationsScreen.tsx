import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { NOTIFICATIONS, Notification } from '../../data/mockData';

const TYPE_CFG: Record<string, { icon: string; color: string; bg: string }> = {
  payment:  { icon: '💰', color: '#8B5CF6', bg: '#EDE9FE' },
  member:   { icon: '👤', color: '#0EA5E9', bg: '#E0F2FE' },
  stock:    { icon: '📦', color: '#F59E0B', bg: '#FEF3C7' },
  expiry:   { icon: '⏰', color: '#EF4444', bg: '#FEE2E2' },
  general:  { icon: '📢', color: '#10B981', bg: '#ECFDF5' },
};

type FilterTab = 'all' | 'unread' | 'payment' | 'expiry' | 'general';

export default function NotificationsScreen() {
  const { currentMember, currentUser } = useAppContext();

  // Get notifications relevant to this member (role = 'all' or 'member' with matching memberId)
  const memberNotifs = NOTIFICATIONS.filter(n =>
    n.targetRole === 'all' ||
    (n.targetRole === 'member' && (!n.memberId || n.memberId === currentMember?.id))
  );

  const [notifs, setNotifs] = useState<Notification[]>(memberNotifs);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const filtered = notifs.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAll = () => {
    Alert.alert('Clear Notifications', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => setNotifs([]) },
    ]);
  };

  const gymAnnouncements: Notification[] = [
    {
      id: 'ann1', gymId: 'gym1', type: 'general',
      title: '🎉 New Batch Starting!',
      message: 'Morning Zumba batch starts June 22. Register at front desk. Limited spots available!',
      date: '2026-06-18', isRead: false, targetRole: 'all',
    },
    {
      id: 'ann2', gymId: 'gym1', type: 'general',
      title: '🏋️ New Equipment Arrived',
      message: 'Cable crossover machine and Smith machine have been installed. Available from today!',
      date: '2026-06-17', isRead: true, targetRole: 'all',
    },
    {
      id: 'ann3', gymId: 'gym1', type: 'expiry',
      title: '🎁 Refer & Earn Offer',
      message: 'Refer a friend and both of you get 1 month FREE! Valid till June 30.',
      date: '2026-06-15', isRead: false, targetRole: 'all',
    },
    {
      id: 'ann4', gymId: 'gym1', type: 'payment',
      title: '💳 Payment Reminder',
      message: 'Your upcoming membership renewal is due in 30 days. Renew early for 10% off.',
      date: '2026-06-14', isRead: true, targetRole: 'member',
    },
  ];

  const allNotifs = [...notifs, ...gymAnnouncements.filter(a => !notifs.some(n => n.id === a.id))];

  const filteredFinal = allNotifs.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const totalUnread = allNotifs.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
      <View style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>FitCore Gym</Text>
              <Text style={styles.headerTitle}>Notifications 🔔</Text>
            </View>
            {totalUnread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{totalUnread} new</Text>
              </View>
            )}
          </View>
        </View>

        {/* ACTION ROW */}
        <View style={styles.actionRowContainer}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={markAllRead} activeOpacity={0.7}>
              <Text style={styles.actionBtnText}>✅ Mark all read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={clearAll} activeOpacity={0.7}>
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>🗑️ Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FILTER TABS */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
            {([
              { key: 'all', label: '📋 All' },
              { key: 'unread', label: `🔴 Unread (${totalUnread})` },
              { key: 'expiry', label: '⏰ Expiry' },
              { key: 'payment', label: '💰 Payments' },
              { key: 'general', label: '📢 General' },
            ] as { key: FilterTab; label: string }[]).map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, activeTab === tab.key && styles.filterChipActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, activeTab === tab.key && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* NOTIFICATIONS LIST */}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filteredFinal.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 52, marginBottom: 16 }}>🔔</Text>
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySubtitle}>No notifications in this category.</Text>
            </View>
          ) : (
            filteredFinal.map((notif, idx) => {
              const cfg = TYPE_CFG[notif.type] ?? TYPE_CFG.general;
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.notifCard, !notif.isRead && styles.notifCardUnread]}
                  onPress={() => markRead(notif.id)}
                  activeOpacity={0.85}
                >
                  {/* Unread indicator */}
                  {!notif.isRead && <View style={styles.unreadDot} />}

                  {/* Icon */}
                  <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                      <Text style={[styles.notifTitle, !notif.isRead && { color: '#0F172A', fontWeight: '800' }]}>
                        {notif.title}
                      </Text>
                      <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.typePillText, { color: cfg.color }]}>
                          {notif.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.notifMessage} numberOfLines={3}>
                      {notif.message}
                    </Text>
                    <Text style={styles.notifDate}>{notif.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* GYM CONTACT CARD */}
          <View style={styles.gymCard}>
            <Text style={styles.gymCardTitle}>📞 Contact Your Gym</Text>
            <Text style={styles.gymCardSub}>For queries, membership changes, or complaints:</Text>
            <View style={styles.gymCardRow}>
              <Text style={styles.gymCardLabel}>Phone</Text>
              <Text style={styles.gymCardVal}>+91 85302 92487</Text>
            </View>
            <View style={styles.gymCardRow}>
              <Text style={styles.gymCardLabel}>WhatsApp</Text>
              <Text style={styles.gymCardVal}>+91 85302 92487</Text>
            </View>
            <View style={styles.gymCardRow}>
              <Text style={styles.gymCardLabel}>Email</Text>
              <Text style={styles.gymCardVal}>fitcore.elite@gym.in</Text>
            </View>
            <View style={styles.gymCardRow}>
              <Text style={styles.gymCardLabel}>Timing</Text>
              <Text style={styles.gymCardVal}>5 AM – 11 PM (Mon–Sat)</Text>
            </View>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0EA5E9' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0EA5E9',
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  unreadBadge: {
    backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 2, borderColor: '#FFFFFF',
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  actionRowContainer: {
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  actionRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  actionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#F8FAFC',
  },
  actionBtnDanger: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  tabsContainer: {
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  tabsScroll: {
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  tabsContent: {
    paddingVertical: 10, paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },
  scroll: {
    padding: 16, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  notifCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12,
    flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#E2E8F0',
    position: 'relative', overflow: 'hidden',
  },
  notifCardUnread: {
    borderColor: '#BAE6FD', borderLeftWidth: 4, borderLeftColor: '#0EA5E9',
  },
  unreadDot: {
    position: 'absolute', top: 12, right: 12, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#EF4444',
  },
  notifIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#334155', flex: 1, marginRight: 8 },
  typePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  typePillText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  notifMessage: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  notifDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 6 },
  gymCard: {
    backgroundColor: '#0F172A', borderRadius: 16, padding: 18, marginTop: 8,
    gap: 10,
  },
  gymCardTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  gymCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  gymCardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gymCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  gymCardVal: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
});
