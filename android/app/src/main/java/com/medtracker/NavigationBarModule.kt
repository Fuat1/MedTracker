package com.medtracker

import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NavigationBarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NavigationBarModule"

    /**
     * Returns the current navigation mode:
     *   "gesture"  — fully gestural (Android 10+, navigation_mode == 2)
     *   "buttons"  — 3-button or 2-button software nav bar (mode 0 or 1)
     *   "unknown"  — could not determine (Settings.Secure unavailable)
     */
    @ReactMethod
    fun getNavigationMode(promise: Promise) {
        try {
            val mode = Settings.Secure.getInt(
                reactApplicationContext.contentResolver,
                "navigation_mode",
                0 // default = 3-button if key is missing
            )
            promise.resolve(if (mode == 2) "gesture" else "buttons")
        } catch (e: Exception) {
            promise.resolve("unknown")
        }
    }
}
