import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { NotificationBadgeModule } = NativeModules;

class NativeBadgeService {
  /**
   * Request POST_NOTIFICATIONS permission on Android 13+
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'FitCore Notification Permission',
            message: 'FitCore needs notification permission to alert you about check-ins, workouts, and gym notices.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  /**
   * Post Android System Heads-Up Notification and update Launcher App Badge Count
   */
  async postNotification(title: string, message: string, badgeCount: number = 1): Promise<void> {
    if (Platform.OS === 'android' && NotificationBadgeModule?.postSystemNotification) {
      try {
        await NotificationBadgeModule.postSystemNotification(title, message, badgeCount);
      } catch (e) {
        console.log('Error posting system notification:', e);
      }
    }
  }

  /**
   * Update the Launcher App Icon Badge Count (e.g. 4 on home screen icon)
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'android' && NotificationBadgeModule?.setBadgeCount) {
      try {
        await NotificationBadgeModule.setBadgeCount(count);
      } catch (e) {
        console.log('Error setting app icon badge:', e);
      }
    }
  }

  /**
   * Clear launcher badge and dismiss notifications
   */
  async clearBadge(): Promise<void> {
    if (Platform.OS === 'android' && NotificationBadgeModule?.clearBadge) {
      try {
        await NotificationBadgeModule.clearBadge();
      } catch (e) {
        console.log('Error clearing badge:', e);
      }
    }
  }
}

export const nativeBadgeService = new NativeBadgeService();
export default nativeBadgeService;
