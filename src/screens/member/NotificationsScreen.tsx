import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: "Today's workout is ready!",
    body: 'Push Day — 6 exercises, 45 min. Start now!',
    time: '2 min ago', read: false, icon: 'barbell', color: Colors.primaryGreen,
  },
  {
    id: '2',
    title: 'Membership expires soon',
    body: 'Your Premium plan expires in 23 days. Renew now to continue.',
    time: '1 hour ago', read: false, icon: 'alert-circle', color: Colors.warning,
  },
  {
    id: '3',
    title: 'Payment successful',
    body: '₹2,999 membership payment received successfully.',
    time: '3 hours ago', read: true, icon: 'checkmark-circle', color: Colors.success,
  },
  {
    id: '4',
    title: 'Trainer session reminder',
    body: 'You have a session with Rahul at 6:00 PM today.',
    time: 'Yesterday', read: true, icon: 'person', color: Colors.info,
  },
  {
    id: '5',
    title: 'Gym announcement',
    body: 'New group classes starting this month! Check the schedule.',
    time: 'Yesterday', read: true, icon: 'megaphone', color: '#C084FC',
  },
  {
    id: '6',
    title: 'Workout streak! 🔥',
    body: 'You completed 7 days of continuous workouts. Keep going!',
    time: '2 days ago', read: true, icon: 'flame', color: '#FF5C5C',
  },
  {
    id: '7',
    title: 'Invoice generated',
    body: 'Your August invoice is ready for download.',
    time: '3 days ago', read: true, icon: 'document', color: Colors.info,
  },
];

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgBase} />
      <View style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Image
              source={leftArrowIcon}
              style={{ width: 16, height: 16, tintColor: Colors.textPrimary }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
              <Text style={styles.markAllText}>Mark all</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>

        {/* Notification List */}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="notifications-off-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map(notif => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
                activeOpacity={0.8}
                onPress={() => {
                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                }}
              >
                <View style={[styles.notifIcon, { backgroundColor: notif.color + '15' }]}>
                  <Icon name={notif.icon} size={20} color={notif.color} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifBody}>{notif.body}</Text>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>
                {!notif.read && <View style={styles.notifDot} />}
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgBase },
  root: { flex: 1, backgroundColor: Colors.bgBase },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: Typography.fontSizeXl,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: Colors.danger,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: Typography.fontWeightBold,
    color: '#FFFFFF',
  },
  markAllText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primaryGreen,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 8,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(184, 242, 58, 0.04)',
    borderColor: 'rgba(184, 242, 58, 0.12)',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  notifBody: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightRegular,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: Typography.fontSizeXs,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textMuted,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryGreen,
    marginTop: 4,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: Typography.fontSizeXl,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.fontSizeMd,
    color: Colors.textSecondary,
  },
});
