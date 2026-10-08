import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { useAppContext } from './AppContext';
import { navigate } from '../navigation/navigationRef';
import nativeBadgeService from '../services/nativeBadgeService';

export interface InAppBannerData {
  id: string;
  title: string;
  message: string;
  type?: 'alert' | 'success' | 'info' | 'warning' | 'attendance' | 'workout' | 'diet' | 'payment';
  date?: string;
  actionScreen?: string;
  actionParams?: any;
}

interface NotificationContextValue {
  notifications: any[];
  unreadCount: number;
  activeBanner: InAppBannerData | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  showInAppNotification: (banner: Omit<InAppBannerData, 'id'> & { id?: string }) => void;
  dismissBanner: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const SEEN_NOTIFS_KEY = 'fitcore_seen_notif_ids_cache';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser, currentMember, currentGym, role, isLoggedIn } = useAppContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeBanner, setActiveBanner] = useState<InAppBannerData | null>(null);

  const isInitialLoadRef = useRef<boolean>(true);
  const hasTriggeredInitialBannerRef = useRef<boolean>(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bannerTimerRef = useRef<any>(null);

  // Request Android System Notification Permission & Load Seen IDs on startup
  useEffect(() => {
    (async () => {
      try {
        nativeBadgeService.requestNotificationPermission().catch(() => {});
        const stored = await AsyncStorage.getItem(SEEN_NOTIFS_KEY);
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            seenIdsRef.current = new Set(arr);
          }
        }
      } catch (e) {}
    })();
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setActiveBanner(null);
  }, []);

  const showInAppNotification = useCallback((banner: Omit<InAppBannerData, 'id'> & { id?: string }) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);

    const bannerObj: InAppBannerData = {
      id: banner.id || `banner_${Date.now()}`,
      title: banner.title || 'New Gym Notification',
      message: banner.message || '',
      type: banner.type || 'info',
      date: banner.date || 'Just now',
      actionScreen: banner.actionScreen || 'Notifications',
      actionParams: banner.actionParams,
    };

    setActiveBanner(bannerObj);

    // Auto dismiss after 5 seconds
    bannerTimerRef.current = setTimeout(() => {
      setActiveBanner(null);
    }, 5000);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const targetGymId = currentGym?.id || (currentMember as any)?.gymId || currentUser?.gymId;
      const targetUserId =
        (currentMember as any)?.id ||
        (currentMember as any)?._id ||
        (currentMember as any)?.userId ||
        currentUser?.id ||
        currentUser?.phone ||
        'default_user';

      const userRole = role || 'member';

      // Load specific user's read notification IDs
      const userReadStorageKey = `fitcore_read_notifs_${targetUserId}`;
      const userReadData = await AsyncStorage.getItem(userReadStorageKey).catch(() => null);
      const locallyReadIds = new Set<string>();

      if (userReadData) {
        try {
          const arr = JSON.parse(userReadData);
          if (Array.isArray(arr)) arr.forEach((i: any) => locallyReadIds.add(String(i)));
        } catch (e) {}
      }

      const res: any = await apiService.getNotifications(userRole, targetGymId, targetUserId);

      if (res?.success && Array.isArray(res.data)) {
        const list = res.data;
        setNotifications(list);

        let unread = 0;
        let latestUnreadNotif: any = null;

        for (const notif of list) {
          const nId = String(notif.id || notif._id || '');
          const isRead = Boolean(
            notif.isRead ||
            notif.read ||
            locallyReadIds.has(nId)
          );

          if (!isRead) {
            unread += 1;
            if (!latestUnreadNotif) {
              latestUnreadNotif = notif;
            }
          }
        }

        setUnreadCount(unread);

        // Update Android App Launcher Icon Badge Number on phone home screen!
        nativeBadgeService.setBadgeCount(unread).catch(() => {});

        // If this is app startup and there are unread notifications, trigger in-app banner & system notification!
        if (latestUnreadNotif && !hasTriggeredInitialBannerRef.current) {
          hasTriggeredInitialBannerRef.current = true;
          const notifTitle = latestUnreadNotif.title || 'Gym Notification';
          const notifBody = latestUnreadNotif.message || latestUnreadNotif.body || 'You have new unread updates from FitCore.';

          // 1. Post Android System Heads-Up Notification (Notification Tray)
          nativeBadgeService.postNotification(notifTitle, notifBody, unread).catch(() => {});

          // 2. Show In-App Luxury Banner
          setTimeout(() => {
            showInAppNotification({
              id: String(latestUnreadNotif.id || latestUnreadNotif._id),
              title: notifTitle,
              message: notifBody,
              type: latestUnreadNotif.type || 'info',
              date: latestUnreadNotif.date || 'Just now',
              actionScreen: 'Notifications',
            });
          }, 600);
        } else if (latestUnreadNotif && !isInitialLoadRef.current) {
          const nId = String(latestUnreadNotif.id || latestUnreadNotif._id);
          if (!seenIdsRef.current.has(nId)) {
            seenIdsRef.current.add(nId);
            const notifTitle = latestUnreadNotif.title || 'Gym Notification';
            const notifBody = latestUnreadNotif.message || latestUnreadNotif.body || 'You have received a new update from FitCore.';

            // Post System Notification & In-App Banner
            nativeBadgeService.postNotification(notifTitle, notifBody, unread).catch(() => {});
            showInAppNotification({
              id: nId,
              title: notifTitle,
              message: notifBody,
              type: latestUnreadNotif.type || 'info',
              date: latestUnreadNotif.date || 'Just now',
              actionScreen: 'Notifications',
            });
          }
        }

        for (const notif of list) {
          const nId = String(notif.id || notif._id || '');
          if (nId) seenIdsRef.current.add(nId);
        }

        // Save seen IDs cache
        const seenArr = Array.from(seenIdsRef.current).slice(-100);
        AsyncStorage.setItem(SEEN_NOTIFS_KEY, JSON.stringify(seenArr)).catch(() => {});
      } else {
        setNotifications([]);
        setUnreadCount(0);
        nativeBadgeService.clearBadge().catch(() => {});
      }
    } catch (e) {
      // Network fail safe
    } finally {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }
  }, [isLoggedIn, currentGym?.id, currentMember, currentUser, role, showInAppNotification]);

  // Initial fetch and 8s background live polling
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      hasTriggeredInitialBannerRef.current = false;
      nativeBadgeService.clearBadge().catch(() => {});
      return;
    }

    refreshNotifications();
    const interval = setInterval(() => {
      refreshNotifications();
    }, 8000);

    return () => clearInterval(interval);
  }, [isLoggedIn, refreshNotifications]);

  const markAsRead = async (id: string) => {
    const idStr = String(id);
    const targetUserId =
      (currentMember as any)?.id ||
      (currentMember as any)?._id ||
      (currentMember as any)?.userId ||
      currentUser?.id ||
      currentUser?.phone ||
      'default_user';

    try {
      const storageKey = `fitcore_read_notifs_${targetUserId}`;
      const existing = await AsyncStorage.getItem(storageKey);
      const parsed = existing ? JSON.parse(existing) : [];
      if (!parsed.includes(idStr)) {
        parsed.push(idStr);
        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
      }

      setUnreadCount(prev => {
        const nextCount = Math.max(0, prev - 1);
        nativeBadgeService.setBadgeCount(nextCount).catch(() => {});
        return nextCount;
      });

      setNotifications(prev =>
        prev.map(n => (String(n.id || n._id) === idStr ? { ...n, read: true, isRead: true } : n))
      );

      await apiService.markNotificationRead(idStr, targetUserId);
    } catch (e) {
      console.log('Error marking notification as read:', e);
    }
  };

  const markAllAsRead = async () => {
    const targetGymId = currentGym?.id || (currentMember as any)?.gymId || currentUser?.gymId;
    const targetUserId =
      (currentMember as any)?.id ||
      (currentMember as any)?._id ||
      (currentMember as any)?.userId ||
      currentUser?.id ||
      currentUser?.phone ||
      'default_user';

    try {
      const allIds = notifications.map(n => String(n.id || n._id));
      const storageKey = `fitcore_read_notifs_${targetUserId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(allIds));

      setUnreadCount(0);
      nativeBadgeService.clearBadge().catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));

      await apiService.markAllNotificationsRead(targetUserId, targetGymId);
    } catch (e) {
      console.log('Error marking all notifications as read:', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeBanner,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        showInAppNotification,
        dismissBanner,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
