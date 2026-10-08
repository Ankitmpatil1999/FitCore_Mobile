package com.fitcore

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*

class NotificationBadgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val CHANNEL_ID = "fitcore_notifications_channel"
        const val CHANNEL_NAME = "FitCore Gym Updates"
        const val CHANNEL_DESC = "Real-time alerts, check-ins, workouts and dues notifications"
        const val NOTIFICATION_ID = 1001
    }

    init {
        createNotificationChannel()
    }

    override fun getName(): String = "NotificationBadgeModule"

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESC
                setShowBadge(true)
                enableVibration(true)
                enableLights(true)
            }
            val notificationManager =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    @ReactMethod
    fun postSystemNotification(
        title: String,
        message: String,
        badgeCount: Int,
        promise: Promise
    ) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(
                        reactContext,
                        Manifest.permission.POST_NOTIFICATIONS
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    reactContext.currentActivity?.let { activity ->
                        ActivityCompat.requestPermissions(
                            activity,
                            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                            101
                        )
                    }
                }
            }

            val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)
            val pendingIntent = if (launchIntent != null) {
                PendingIntent.getActivity(
                    reactContext,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
            } else null

            val iconResId = reactContext.resources.getIdentifier("ic_launcher", "mipmap", reactContext.packageName)
            val effectiveIcon = if (iconResId != 0) iconResId else android.R.drawable.ic_dialog_info

            val builder = NotificationCompat.Builder(reactContext, CHANNEL_ID)
                .setSmallIcon(effectiveIcon)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setShowWhen(true)
                .setNumber(badgeCount)

            if (pendingIntent != null) {
                builder.setContentIntent(pendingIntent)
            }

            val managerCompat = NotificationManagerCompat.from(reactContext)
            managerCompat.notify(NOTIFICATION_ID, builder.build())

            // Broadcast badge count for OEM Launchers (Samsung, Xiaomi, etc.)
            updateOemBadgeCount(badgeCount)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("POST_NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setBadgeCount(count: Int, promise: Promise) {
        try {
            updateOemBadgeCount(count)

            if (count <= 0) {
                val manager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                manager.cancel(NOTIFICATION_ID)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_BADGE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearBadge(promise: Promise) {
        try {
            updateOemBadgeCount(0)
            val manager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.cancel(NOTIFICATION_ID)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_BADGE_ERROR", e.message, e)
        }
    }

    private fun updateOemBadgeCount(count: Int) {
        try {
            val packageName = reactContext.packageName
            val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
            val componentName = launchIntent?.component?.className ?: return

            // Samsung / LG
            val intent = Intent("android.intent.action.BADGE_COUNT_UPDATE").apply {
                putExtra("badge_count", count)
                putExtra("badge_count_package_name", packageName)
                putExtra("badge_count_class_name", componentName)
            }
            reactContext.sendBroadcast(intent)

            // Xiaomi MIUI
            val miuiIntent = Intent("miui.intent.action.APPLICATION_MESSAGE_UPDATE").apply {
                putExtra("message_count", count)
                putExtra("message_badge_package_name", packageName)
                putExtra("message_badge_class_name", componentName)
            }
            reactContext.sendBroadcast(miuiIntent)

            // Sony
            val sonyIntent = Intent("com.sonyericsson.home.action.UPDATE_BADGE").apply {
                putExtra("com.sonyericsson.home.intent.extra.badge.PACKAGE_NAME", packageName)
                putExtra("com.sonyericsson.home.intent.extra.badge.ACTIVITY_NAME", componentName)
                putExtra("com.sonyericsson.home.intent.extra.badge.MESSAGE", if (count > 0) count.toString() else null)
                putExtra("com.sonyericsson.home.intent.extra.badge.SHOW_MESSAGE", count > 0)
            }
            reactContext.sendBroadcast(sonyIntent)

            // HTC
            val htcIntent = Intent("com.htc.launcher.action.UPDATE_SHORTCUT").apply {
                putExtra("packagename", packageName)
                putExtra("count", count)
            }
            reactContext.sendBroadcast(htcIntent)
        } catch (e: Exception) {
            // Ignore broadcast failure on non-supported launchers
        }
    }
}
