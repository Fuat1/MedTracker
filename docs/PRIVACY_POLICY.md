# Privacy Policy

**Effective Date:** March 2026

MedTracker ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your information is collected, used, and protected when you use the MedTracker mobile application.

## 1. Offline-First Approach
MedTracker is built on an **offline-first** architecture. The core application does not require an internet connection to function. 
All your blood pressure readings, medication schedules, notes, weight logs, and custom tags are encrypted using SQLCipher and stored **strictly locally** on your device.

## 2. Information We Collect
Because MedTracker is an offline application, we do not require you to create an account, nor do we collect any personally identifiable information remotely.
All data you input remains under your direct control:
- **Health Data:** Blood pressure readings (systolic, diastolic), pulse, weight, medication logs.
- **Profile Data:** Date of birth, gender, height (only stored locally for BMI calculation).
- **Notes & Tags:** Any additional context you provide to your readings.

## 3. Permissions Used
To provide necessary functionality, MedTracker may request the following permissions:
- **Local Notifications:** Used strictly for delivering medication reminders (`POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`).
- **Device Storage:** Used only when you explicitly export a PDF report to save it to your device (`WRITE_EXTERNAL_STORAGE`).
- **Health Platform Sync (Optional):** MedTracker can integrate with Apple Health (iOS) or Health Connect (Android). We request `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` (or their Android equivalents) **only** if you initiate health sync from the App Settings.

## 4. Cloud Sync and Data Sharing
We do not upload or share your data with any remote servers, analytics providers, or third-party advertising networks.
If you choose to use the upcoming **Cloud Sync** feature to back up your data to Google Drive or iCloud, the data will be securely synced through your personal cloud provider account, subjected to their respective privacy terms.

## 5. Contact
If you have questions about this privacy policy or our privacy practices, please contact the developer via standard support channels.
