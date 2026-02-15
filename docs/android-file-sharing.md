# Android File Sharing Best Practices

## Problem: File URI Exposure on Android 7.0+

Starting with Android 7.0 (API level 24), apps cannot expose `file://` URIs outside the app boundary. Attempting to do so throws `FileUriExposedException`.

**Error example:**
```
file:///path/to/file.pdf exposed beyond app through Intent.getData()
```

## Solution: FileProvider with Content URIs

Android requires using **FileProvider** to share files, which converts `file://` URIs to `content://` URIs that can be safely shared with other apps.

## Implementation for MedTracker

### 1. FileProvider Configuration

**File:** `android/app/src/main/AndroidManifest.xml`

```xml
<provider
  android:name="androidx.core.content.FileProvider"
  android:authorities="${applicationId}.fileprovider"
  android:exported="false"
  android:grantUriPermissions="true">
  <meta-data
    android:name="android.support.FILE_PROVIDER_PATHS"
    android:resource="@xml/file_paths" />
</provider>
```

**Key points:**
- `android:authorities` uses `${applicationId}.fileprovider` to avoid conflicts
- `android:exported="false"` - security requirement (FileProvider should never be exported)
- `android:grantUriPermissions="true"` - allows temporary URI permissions

### 2. File Paths Configuration

**File:** `android/app/src/main/res/xml/file_paths.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Documents directory for PDF reports -->
    <files-path name="documents" path="Documents/" />

    <!-- Cache directory for temporary file sharing -->
    <cache-path name="cache" path="." />

    <!-- External files directory (app-specific storage) -->
    <external-files-path name="external_files" path="." />
</paths>
```

**Path types:**
- `<files-path>`: `Context.getFilesDir()` - internal app storage
- `<cache-path>`: `Context.getCacheDir()` - cache directory
- `<external-files-path>`: `Context.getExternalFilesDir()` - external app-specific storage

### 3. react-native-share Platform-Specific Usage

**File:** `src/features/export-pdf/lib/use-export-pdf.ts`

```typescript
import { Platform } from 'react-native';
import Share from 'react-native-share';

if (Platform.OS === 'android') {
  // Android: Use absolute path WITHOUT file:// prefix
  // react-native-share handles FileProvider conversion internally
  await Share.open({
    url: filePath,  // e.g., "/storage/emulated/0/..."
    type: 'application/pdf',
    failOnCancel: false,
  });
} else {
  // iOS: Requires file:// URI scheme
  await Share.open({
    url: `file://${filePath}`,
    type: 'application/pdf',
    failOnCancel: false,
  });
}
```

**Critical differences:**
- **Android**: Pass raw file path - library adds `file://` and converts to `content://`
- **iOS**: Manually add `file://` prefix
- Always set `failOnCancel: false` to prevent errors when users dismiss share dialog

## Common Pitfalls

### ❌ Don't: Use file:// on Android

```typescript
// WRONG - Causes FileUriExposedException
await Share.open({ url: `file://${filePath}` });
```

### ❌ Don't: Forget FileProvider configuration

Without FileProvider in AndroidManifest.xml, file sharing will fail on Android 7.0+.

### ❌ Don't: Export FileProvider

```xml
<!-- WRONG - Security vulnerability -->
<provider android:exported="true" ... />
```

### ✅ Do: Use Platform-specific paths

```typescript
// CORRECT
const shareUrl = Platform.OS === 'android' ? filePath : `file://${filePath}`;
```

### ✅ Do: Handle share dismissal gracefully

```typescript
try {
  await Share.open({ url: shareUrl, failOnCancel: false });
} catch (error) {
  if (error?.message?.includes('User did not share')) {
    return; // User cancelled - not an error
  }
  // Handle actual errors
}
```

## Testing Checklist

- [ ] PDF exports successfully on Android 7.0+ (API 24)
- [ ] Share dialog appears with app options (PDF readers, email, messaging)
- [ ] Dismissing share dialog doesn't crash app
- [ ] PDF opens in selected app correctly
- [ ] Works on both internal and external storage paths

## References

- [Android FileProvider Documentation](https://developer.android.com/reference/androidx/core/content/FileProvider)
- [react-native-share Android Issues](https://github.com/react-native-share/react-native-share/issues/526)
- [React Native Share PDF Best Practices](https://medium.com/ing-blog/react-native-share-pdf-d83dc8b1dc8a)

## Related Files

- `android/app/src/main/AndroidManifest.xml` - FileProvider configuration
- `android/app/src/main/res/xml/file_paths.xml` - Shareable directory definitions
- `src/features/export-pdf/lib/use-export-pdf.ts` - PDF export implementation
- `src/shared/api/pdf-client.ts` - PDF generation

**Last Updated:** 2026-02-15
