import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiService } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

type FilterTab = 'all' | 'workout' | 'attendance' | 'announcements';

export default function NotificationsScreen({ navigation }: any) {
  const { role, currentUser, currentMember, currentGym } = useAppContext();
  const {
    refreshNotifications: refreshGlobalNotifs,
    markAsRead: markGlobalRead,
    markAllAsRead: markAllGlobalRead,
  } = useNotifications();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const userId =
    (currentMember as any)?.id ||
    (currentMember as any)?._id ||
    (currentMember as any)?.userId ||
    currentUser?.id ||
    'default_user';
  const gymId = currentGym?.id || (currentMember as any)?.gymId || currentUser?.gymId;

  const getAllStorageKeys = useCallback(() => {
    const ids = [
      (currentMember as any)?.id,
      (currentMember as any)?._id,
      (currentMember as any)?.userId,
      currentUser?.id,
      currentUser?.phone,
      (currentMember as any)?.phone,
      'default_user',
    ]
      .filter(Boolean)
      .map(String);
    const uniqueIds = Array.from(new Set(ids));
    return [
      'fitcore_read_notifs_all',
      ...uniqueIds.map((id) => `fitcore_read_notifs_${id}`),
    ];
  }, [currentMember, currentUser]);

  const loadNotifications = useCallback(async () => {
    try {
      const keys = getAllStorageKeys();
      const storedResults = await Promise.all(
        keys.map((k) => AsyncStorage.getItem(k).catch(() => null))
      );
      const allReadTimeStr = await AsyncStorage.getItem(
        'fitcore_all_notifs_read_timestamp'
      ).catch(() => null);
      const allReadTime = allReadTimeStr ? Number(allReadTimeStr) : 0;

      const locallyReadIds = new Set<string>();
      storedResults.forEach((res) => {
        if (res) {
          try {
            const arr = JSON.parse(res);
            if (Array.isArray(arr)) arr.forEach((i) => locallyReadIds.add(String(i)));
          } catch (e) {}
        }
      });

      const res: any = await apiService.getNotifications(role || 'member', gymId, userId);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((n: any, idx: number) => {
          const notifId = String(n.id || n._id || idx);
          const createdAtTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
          const isRead = Boolean(
            n.isRead ||
              n.read ||
              locallyReadIds.has(notifId) ||
              (allReadTime > 0 && createdAtTime > 0 && createdAtTime <= allReadTime)
          );

          let iconName = 'notifications-outline';
          let iconColor = '#6C5CE7';
          let iconBg = '#F3F2FE';
          let category: FilterTab = 'announcements';

          const typeLower = String(n.type || '').toLowerCase();
          const titleLower = String(n.title || '').toLowerCase();

          if (typeLower.includes('checkin') || typeLower.includes('attendance') || titleLower.includes('check-in')) {
            iconName = 'checkmark-circle-outline';
            iconColor = '#10B981';
            iconBg = '#ECFDF5';
            category = 'attendance';
          } else if (typeLower.includes('checkout') || titleLower.includes('check-out')) {
            iconName = 'log-out-outline';
            iconColor = '#EF4444';
            iconBg = '#FEF2F2';
            category = 'attendance';
          } else if (typeLower.includes('workout') || titleLower.includes('workout') || titleLower.includes('exercise')) {
            iconName = 'barbell-outline';
            iconColor = '#6C5CE7';
            iconBg = '#F3F2FE';
            category = 'workout';
          } else if (typeLower.includes('diet') || titleLower.includes('diet') || titleLower.includes('meal') || titleLower.includes('nutrition')) {
            iconName = 'nutrition-outline';
            iconColor = '#F59E0B';
            iconBg = '#FFFBEB';
            category = 'workout';
          } else if (typeLower.includes('payment') || typeLower.includes('invoice') || titleLower.includes('payment') || titleLower.includes('invoice')) {
            iconName = 'receipt-outline';
            iconColor = '#06B6D4';
            iconBg = '#ECFEFF';
            category = 'announcements';
          } else if (typeLower.includes('renewal') || titleLower.includes('expir')) {
            iconName = 'time-outline';
            iconColor = '#F97316';
            iconBg = '#FFF7ED';
            category = 'announcements';
          }

          return {
            id: notifId,
            title: n.title,
            body: n.message || n.body,
            time: n.time || n.date || 'Recently',
            read: isRead,
            icon: iconName,
            color: iconColor,
            bg: iconBg,
            category,
          };
        });
        setNotifications(mapped);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAllStorageKeys, gymId, role, userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
    refreshGlobalNotifs();
  }, [loadNotifications, refreshGlobalNotifs]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'workout') {
      return notifications.filter((n) => n.category === 'workout');
    }
    if (activeTab === 'attendance') {
      return notifications.filter((n) => n.category === 'attendance');
    }
    if (activeTab === 'announcements') {
      return notifications.filter((n) => n.category === 'announcements');
    }
    return notifications;
  }, [notifications, activeTab]);

  const markAllRead = async () => {
    // 1. Instantly update UI state
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllGlobalRead();

    // 2. Cache all IDs and timestamp to AsyncStorage
    try {
      const allIds = notifications.map((n) => String(n.id));
      const keys = getAllStorageKeys();
      await Promise.all([
        ...keys.map((k) => AsyncStorage.setItem(k, JSON.stringify(allIds))),
        AsyncStorage.setItem('fitcore_all_notifs_read_timestamp', String(Date.now())),
      ]);
    } catch (e) {}

    // 3. Update backend
    try {
      await apiService.markAllNotificationsRead(userId, gymId);
    } catch (e) {}
  };

  const handleNotificationPress = async (notifId: string) => {
    const idStr = String(notifId);
    // 1. Instantly update UI state
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === idStr ? { ...n, read: true } : n))
    );
    markGlobalRead(idStr);

    // 2. Cache this ID
    try {
      const keys = getAllStorageKeys();
      const storedResults = await Promise.all(
        keys.map((k) => AsyncStorage.getItem(k).catch(() => null))
      );
      const existingIds = new Set<string>();
      storedResults.forEach((res) => {
        if (res) {
          try {
            const arr = JSON.parse(res);
            if (Array.isArray(arr)) arr.forEach((i) => existingIds.add(String(i)));
          } catch (e) {}
        }
      });
      existingIds.add(idStr);
      const updatedList = Array.from(existingIds);
      await Promise.all(keys.map((k) => AsyncStorage.setItem(k, JSON.stringify(updatedList))));
    } catch (e) {}

    // 3. Update backend
    try {
      await apiService.markNotificationRead(idStr, userId);
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.root}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.75}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>In-App Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.75} style={styles.markAllBtn}>
              <Icon name="checkmark-done" size={moderateScale(14)} color="#6C5CE7" />
              <Text style={styles.markAllText}>Mark all</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: moderateScale(38) }} />
          )}
        </View>

        {/* Category Filter Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {[
              { id: 'all', label: 'All' },
              { id: 'workout', label: 'Workouts & Diet' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'announcements', label: 'Announcements' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id as FilterTab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Notification List Body */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6C5CE7']}
              tintColor="#6C5CE7"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Icon name="notifications-outline" size={moderateScale(32)} color="#6C5CE7" />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>
                No notifications in this category. Live gym alerts and session updates will appear here.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
                activeOpacity={0.88}
                onPress={() => handleNotificationPress(notif.id)}
              >
                {/* Left Vector Icon Badge */}
                <View style={[styles.notifIconBox, { backgroundColor: notif.bg }]}>
                  <Icon name={notif.icon} size={moderateScale(18)} color={notif.color} />
                </View>

                {/* Content Center */}
                <View style={styles.notifContent}>
                  <View style={styles.notifHeaderRow}>
                    <Text
                      style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}
                      numberOfLines={1}
                    >
                      {notif.title}
                    </Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {notif.body}
                  </Text>
                </View>

                {/* Unread Accent Dot */}
                {!notif.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: hp(4) }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },

  // ── Header Bar ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1),
    paddingBottom: hp(1.4),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#F3F2FE',
  },
  markAllText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  // ── Category Filter Tabs ──
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
  },
  tabsRow: {
    paddingHorizontal: wp(4.5),
    gap: moderateScale(8),
  },
  tabBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  tabText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ── Scroll Content ──
  scroll: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1.8),
  },

  // ── Notification Card ──
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notifCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C7D2FE',
    borderLeftWidth: 3.5,
    borderLeftColor: '#6C5CE7',
  },
  notifIconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(3),
  },
  notifTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    marginRight: moderateScale(6),
  },
  notifTitleUnread: {
    fontWeight: '900',
    color: '#0F172A',
  },
  notifBody: {
    fontSize: fontScale(12),
    color: '#64748B',
    lineHeight: fontScale(17),
    fontWeight: '500',
  },
  notifTime: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#94A3B8',
  },
  unreadDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#6C5CE7',
    marginTop: moderateScale(4),
  },

  // ── Loading & Empty State ──
  loadingContainer: {
    paddingVertical: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(1.5),
  },
  loadingText: {
    fontSize: fontScale(13),
    color: '#64748B',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
    paddingHorizontal: wp(8),
    gap: hp(1),
  },
  emptyIconBox: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(18),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  emptyTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(18),
    fontWeight: '500',
  },
});
