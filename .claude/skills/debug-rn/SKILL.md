# Debug React Native Skill

**Invocation**: `/debug-rn` or when user reports "app crashes", "build fails", or "metro error"

**Purpose**: Systematic troubleshooting for React Native CLI (Bare workflow) issues

## Skill Behavior

When invoked, this skill runs a diagnostic checklist to identify and fix common React Native issues.

### Phase 1: Environment Health Check

**Check Node.js version**:
```bash
node --version
```
Expected: v18+ or v20+ (React Native 0.76 requires Node 18+)

**Check npm/yarn version**:
```bash
npm --version
```

**Check React Native CLI**:
```bash
npx react-native --version
```

**Check Java (Android)**:
```bash
java -version
```
Expected: JDK 17 (required for React Native 0.76+)

**Check CocoaPods (iOS)**:
```bash
pod --version
```
Expected: 1.12+ (if on macOS)

### Phase 2: Dependency Sync

**Check for stale dependencies**:
```bash
npm outdated
```

**Check for native module mismatches**:
```bash
cd ios && pod outdated
```

**Common Fix: Clean reinstall**:
```bash
rm -rf node_modules package-lock.json
npm install
cd ios && pod install --repo-update
```

### Phase 3: Metro Bundler Issues

**Check if Metro is running**:
```bash
# Windows
netstat -ano | findstr :8081

# Mac/Linux
lsof -i :8081
```

**Kill stale Metro process (Windows)**:
```powershell
taskkill /F /IM node.exe
```

**Reset Metro cache**:
```bash
npx react-native start --reset-cache
```

### Phase 4: Android Build Failures

**Check Gradle version**:
```bash
cd android && ./gradlew --version
```

**Clean Gradle cache**:
```bash
cd android
./gradlew clean
rm -rf .gradle build app/build
```

**Check Android SDK path**:
```bash
echo $ANDROID_HOME  # Mac/Linux
echo %ANDROID_HOME% # Windows
```

**Common Gradle errors**:

**Error: "Execution failed for task ':app:mergeDebugResources'"**
- **Fix**: Duplicate resource files, check `android/app/src/main/res/`

**Error: "Installed Build Tools revision 33.0.0 is corrupted"**
- **Fix**: Reinstall Android SDK Build-Tools via Android Studio

**Error: "Could not resolve all files for configuration ':app:debugRuntimeClasspath'"**
- **Fix**: Check `android/build.gradle` repositories, ensure `google()` and `mavenCentral()` present

### Phase 5: iOS Build Failures

**Check CocoaPods installation**:
```bash
cd ios
pod install --repo-update --verbose
```

**Clean Xcode build**:
```bash
cd ios
xcodebuild clean -workspace MedTracker.xcworkspace -scheme MedTracker
```

**Delete derived data**:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

**Common iOS errors**:

**Error: "Library not found for -lPods-MedTracker"**
- **Fix**: `cd ios && pod install`, then rebuild

**Error: "Module 'React' not found"**
- **Fix**: Open `.xcworkspace` (NOT `.xcodeproj`) in Xcode

**Error: "Signing for 'MedTracker' requires a development team"**
- **Fix**: Set development team in Xcode project settings

### Phase 6: Runtime Crashes

**Check for red screen errors**:
1. Read error message carefully (component stack trace)
2. Check if it's a JS error or native crash

**Common JS errors**:

**Error: "Invariant Violation: requireNativeComponent: 'RNSVGPath' was not found"**
- **Fix**: Missing native module, run `cd ios && pod install` (iOS) or rebuild Android

**Error: "Cannot read property 'execute' of undefined" (op-sqlite)**
- **Fix**: Database not initialized, check `initDatabase()` call in `App.tsx`

**Error: "Text strings must be rendered within a <Text> component"**
- **Fix**: Wrapping issue, check JSX for stray strings outside `<Text>`

**Common Native crashes**:

**Symptom: App crashes on launch (no red screen)**
- **Check**: Native logs via `adb logcat` (Android) or Xcode console (iOS)
- **Common cause**: Missing permissions (camera, location, etc.)

**Symptom: App freezes after 10 seconds**
- **Check**: Main thread blocking (heavy computation in render)
- **Fix**: Move to background thread or use `InteractionManager.runAfterInteractions()`

### Phase 7: Database Issues (op-sqlite specific)

**Check database file exists**:
```typescript
import RNFS from 'react-native-fs';
const dbPath = `${RNFS.DocumentDirectoryPath}/medtracker.db`;
const exists = await RNFS.exists(dbPath);
console.log('DB exists:', exists);
```

**Verify SQLCipher encryption**:
```typescript
// Check if encryption key is set correctly
const db = open({
  name: 'medtracker.db',
  encryptionKey: 'test-key', // Should come from Keychain in production
});
```

**Common database errors**:

**Error: "SQLite error: file is not a database"**
- **Fix**: Corrupted database or wrong encryption key

**Error: "SQLite error: near '?': syntax error"**
- **Fix**: Check parameterized query syntax, ensure placeholders match array length

### Phase 8: Type Checking

**Run TypeScript compiler**:
```bash
npx tsc --noEmit --skipLibCheck
```

**Common type errors**:

**Error: "Property 'X' does not exist on type 'Y'"**
- **Fix**: Check interface definition, add missing property or use optional `?`

**Error: "Type 'number' is not assignable to type 'string'"**
- **Fix**: Parsing issue, use `parseInt()` or `String()`

### Phase 9: Linting Issues

**Run ESLint**:
```bash
npx eslint src/ --ext .ts,.tsx
```

**Auto-fix where possible**:
```bash
npx eslint src/ --ext .ts,.tsx --fix
```

### Phase 10: FSD Violations

**Run FSD checker agent**:
- Invoke `/fsd-checker` agent to scan for architectural violations
- Fix upward imports before proceeding

## Diagnostic Output

```markdown
# React Native Debug Report

## Environment
- Node: v20.10.0 ✅
- npm: 10.2.3 ✅
- React Native: 0.76.1 ✅
- Java: 17.0.8 ✅
- CocoaPods: 1.15.2 ✅

## Issues Found

### 🔴 CRITICAL: Metro Bundler Not Running
**Symptom**: "Metro has encountered an error"
**Root Cause**: Port 8081 occupied by stale process
**Fix**: Killed process PID 12345, restarted Metro

### 🟡 WARNING: Outdated Dependencies
**Package**: react-native-vector-icons (3.0.0 → 3.2.0)
**Fix**: Run `npm update react-native-vector-icons`

## Recommended Actions
1. Clean Gradle cache: `cd android && ./gradlew clean`
2. Reinstall CocoaPods: `cd ios && pod install`
3. Reset Metro: `npx react-native start --reset-cache`
4. Rebuild app: `npx react-native run-android`
```

## Integration with Hooks

Suggested Stop hook to catch issues early:
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit --skipLibCheck 2>&1 | head -20",
            "timeout": 30
          },
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'bp-guidelines'; then echo '{\"decision\": \"block\", \"reason\": \"🚨 Cannot modify medical constants via Bash\"}' >&2; exit 2; fi",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

## Platform-Specific Troubleshooting

### Windows-Specific Issues

**Issue: "react-native run-android" fails with "SDK location not found"**
- **Fix**: Create `android/local.properties`:
  ```
  sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
  ```

**Issue: PowerShell execution policy blocks scripts**
- **Fix**: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### macOS-Specific Issues

**Issue: "xcrun: error: unable to find utility 'simctl'"**
- **Fix**: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

**Issue: M1/M2 Mac CocoaPods architecture mismatch**
- **Fix**: `sudo arch -x86_64 gem install ffi`, then `cd ios && arch -x86_64 pod install`

## Exit Behavior

- Provide actionable fixes for each issue found
- Prioritize by severity (critical → warnings)
- Suggest next steps (rebuild, test on device, etc.)
- If no issues found, suggest checking device logs or providing more context

## References

- React Native Troubleshooting: https://reactnative.dev/docs/troubleshooting
- op-sqlite docs: https://github.com/OP-Engineering/op-sqlite
- Gradle issues: https://docs.gradle.org/current/userguide/troubleshooting_builds.html
