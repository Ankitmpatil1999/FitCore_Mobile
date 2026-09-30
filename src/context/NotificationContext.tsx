import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { useAppContext } from './AppContext';
import { navigate } from '../navigation/navigationRef';

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
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bannerTimerRef = useRef<any>(null);

  // Load seen IDs cache on startup
  useEffect(() => {
    (async () => {
      try {
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
      title: banner.title || 'New Notification',
      message: banner.message || '',
      type: banner.type || 'info',
      date: banner.date || 'Just now',
      actionScreen: banner.actionScreen || 'Notifications',
      actionParams: banner.actionParams,
    };

    setActiveBanner(bannerObj);

    // Auto dismiss after 4.5 seconds
    bannerTimerRef.current = setTimeout(() => {
      setActiveBanner(null);
    }, 4500);
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

      const notifKeys = [
        'fitcore_read_notifs_all',
        `fitcore_read_notifs_${targetUserId}`,
        (currentMember as any)?.id ? `fitcore_read_notifs_${(currentMember as any).id}` : null,
        (currentMember as any)?._id ? `fitcore_read_notifs_${(currentMember as any)._id}` : null,
        (currentMember as any)?.userId ? `fitcore_read_notifs_${(currentMember as any).userId}` : null,
        currentUser?.id ? `fitcore_read_notifs_${currentUser.id}` : null,
        currentUser?.phone ? `fitcore_read_notifs_${currentUser.phone}` : null,
        (currentMember as any)?.phone ? `fitcore_read_notifs_${(currentMember as any).phone}` : null,
      ].filter(Boolean) as string[];

      const storedResults = await Promise.all(notifKeys.map(k => AsyncStorage.getItem(k).catch(() => null)));
      const allReadTimeStr = await AsyncStorage.getItem('fitcore_all_notifs_read_timestamp').catch(() => null);
      const allReadTime = allReadTimeStr ? Number(allReadTimeStr) : 0;

      const locallyReadIds = new Set<string>();
      storedResults.forEach(res => {
        if (res) {
          try {
            const arr = JSON.parse(res);
            if (Array.isArray(arr)) arr.forEach(i => locallyReadIds.add(String(i)));
          } catch (e) {}
        }
      });

      const res: any = await apiService.getNotifications(userRole, targetGymId, targetUserId);

      if (res?.success && Array.isArray(res.data)) {
        const list = res.data;
        setNotifications(list);

        let unread = 0;
        let latestNewUnread: any = null;

        for (const notif of list) {
          const nId = String(notif.id || notif._id || '');
          const createdAtTime = notif.createdAt ? new Date(notif.createdAt).getTime() : 0;
          const isRead = Boolean(
            notif.isRead ||
            notif.read ||
            locallyReadIds.has(nId) ||
            (allReadTime > 0 && createdAtTime > 0 && createdAtTime <= allReadTime)
          );

          if (!isRead) {
            unread += 1;
            // Check if this is a newly arrived unread notification we haven't seen in this session
            if (!isInitialLoadRef.current && !seenIdsRef.current.has(nId) && !latestNewUnread) {
              latestNewUnread = notif;
            }
          }
          if (nId) {
            seenIdsRef.current.add(nId);
          }
        }

        setUnreadCount(unread);

        // Save seen IDs cache to AsyncStorage
        const seenArr = Array.from(seenIdsRef.current).slice(-100);
        AsyncStorage.setItem(SEEN_NOTIFS_KEY, JSON.stringify(seenArr)).catch(() => {});

        // If a new unread notification arrived in real-time, show animated top banner!
        if (latestNewUnread && !isInitialLoadRef.current) {
          showInAppNotification({
            id: String(latestNewUnread.id || latestNewUnread._id),
            title: latestNewUnread.title || 'Gym Notification',
            message: latestNewUnread.message || latestNewUnread.body || 'You have received a new update from FitCore.',
            type: latestNewUnread.type || 'info',
            date: latestNewUnread.date || 'Just now',
            actionScreen: 'Notifications',
          });
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (e) {
      // Quiet fail if network temporarily unavailable
    } finally {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }
  }, [isLoggedIn, currentGym?.id, currentMember, currentUser, role, showInAppNotification]);

  // Initial fetch and 10s background live polling
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();
    const interval = setInterval(() => {
      refreshNotifications();
    }, 10000);

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

      setUnreadCount(prev => Math.max(0, prev - 1));
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
      await AsyncStorage.setItem('fitcore_read_notifs_all', JSON.stringify(allIds));
      await AsyncStorage.setItem('fitcore_all_notifs_read_timestamp', String(Date.now()));

      setUnreadCount(0);
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
