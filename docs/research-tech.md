# MedTracker — Accessibility & Regulatory Mode Requirements

> **Purpose:** Technical requirements for implementing four regulatory display modes in MedTracker (React Native, NativeWind, Zustand, FSD architecture).
> **Compliance targets:** IEC 62366-1, European Accessibility Act (EAA), EN 301 549, WCAG 2.1 AA+

---

## ARCHITECTURE REQUIREMENTS

### AR-001: Theme Store (Zustand)
- Create a global Zustand store at `shared/store/useThemeStore.ts`
- Store must expose: `activeMode: 'light' | 'dark' | 'highContrast' | 'senior'`
- Store must expose: `setMode(mode)` action
- Persist selected mode to AsyncStorage with key `@medtracker/theme-mode`
- On app launch, hydrate mode from AsyncStorage; default to `'light'` if unset

### AR-002: Design Token Architecture
- Create a token map file at `shared/config/themeTokens.ts`
- Export a `ThemeTokens` type and a `THEME_TOKENS: Record<ThemeMode, ThemeTokens>` constant
- Tokens must include: `colors`, `typography`, `spacing`, `elevation`, `borders`, `touchTargets`, `haptics`
- All UI components must read tokens from the store — no hardcoded color/size values

### AR-003: NativeWind Integration
- Map design tokens to NativeWind/Tailwind CSS variables
- Use `nativewind`'s `vars()` or a custom provider to inject active token set into the style tree
- Components must use semantic class names (e.g., `bg-surface`, `text-primary`) mapped to current token values

### AR-004: Mode Toggle UI
- Add a mode selector to `AppSettingsPage`
- Display all four modes with preview thumbnails or descriptive labels
- Switching modes must apply instantly without app restart

---

## MODE 1: LIGHT MODE (Default)

### LM-001: Background Colors
- Root background: `#F5F5F5` or `#F8F9FA` (soft off-white)
- **FORBIDDEN:** Pure white `#FFFFFF` as root background
- Card/component backgrounds: `#FFFFFF` (allowed on cards only, not root)

### LM-002: Typography Colors
- Primary text: `#1A1A1A` or `#2D2D2D` (deep saturated dark gray)
- **FORBIDDEN:** Pure black `#000000` for any text
- Secondary text: `#6B7280` or equivalent mid-gray
- WCAG minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (≥18pt)

### LM-003: Component Elevation
- Cards (`TodayScheduleCard`, `LatestReadingCard`): subtle box shadow (e.g., `shadow-sm` or `elevation: 2`)
- Use localized background color shifts and opacity variation to denote z-axis interactivity

### LM-004: Call-to-Action Colors
- Primary CTA (`SaveButton`): calming medical blue (e.g., `#2563EB`) or reassuring green
- CTA must have minimum 3:1 contrast ratio against its parent card surface

### LM-005: Data Visualization Palette
- `BPTrendChart` and `WeatherCorrelationCard`: use darker saturated tones
- Systolic line: deep blue `#003B49`
- Diastolic line: forest green `#007A78`
- Auxiliary data: charcoal gray `#374151`

### LM-006: Haptic Feedback
- Numpad keystroke: `Haptics.impactAsync(ImpactFeedbackStyle.Light)` (Soft Tap)
- Save action: double-pulse success pattern `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- No haptic on passive navigation

---

## MODE 2: DARK MODE

### DM-001: Background Colors
- Root background: `#121212` (dark gray)
- **FORBIDDEN:** Pure black `#000000` as any surface color
- Card surfaces: `#1E1E1E` (slightly elevated from root)
- Secondary surfaces: `#2C2C2C`

### DM-002: Typography Opacity Paradigm
- Primary text (BP values, page headers, greetings): white `#FFFFFF` at **87% opacity** → `rgba(255, 255, 255, 0.87)`
- Secondary text (timestamps, TagChip labels): white at **60% opacity** → `rgba(255, 255, 255, 0.60)`
- Disabled/hint text (inactive fields, DateTimePicker placeholders): white at **38% opacity** → `rgba(255, 255, 255, 0.38)`
- **FORBIDDEN:** Pure white at 100% opacity for any text (causes halation effect)

### DM-003: Semantic Clinical Color Desaturation
- All semantic colors (BP classification categories) must be **desaturated 10–20%** compared to Light Mode values
- Crisis red: desaturate to pastel coral (e.g., `#F87171` → `#FCA5A5`)
- Normal green: desaturate similarly (e.g., `#22C55E` → `#86EFAC`)
- Elevated yellow: desaturate (e.g., `#EAB308` → `#FDE68A`)
- Rationale: saturated colors "burn" against dark backgrounds causing ocular fatigue

### DM-004: Elevation on Dark Surfaces
- Use subtle shadows that remain visible on `#121212` surface
- Alternatively use surface color stepping (`#1E1E1E` → `#2C2C2C` → `#3C3C3C`) for depth

### DM-005: Haptic Feedback
- Same as Light Mode (LM-006)
- Crisis modal: add `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` (Heavy/Warning Vibration)

---

## MODE 3: HIGH CONTRAST MODE

### HC-001: Remove All Subtle Visual Cues
- **Remove entirely:** drop shadows, gradients, opacity-based overlays, blur effects
- All components must sit on solid, flat backgrounds
- No transparency on any interactive element

### HC-002: Structural Borders
- All interactive components (`Numpad` fields, `TodayScheduleCard`, buttons) must have **2px–4px solid borders**
- Border color must achieve minimum 3:1 contrast against both the component background and the surrounding surface
- Use stark black borders on light backgrounds, stark white borders on dark backgrounds

### HC-003: WCAG 1.4.1 — No Color-Only Information
- **FORBIDDEN:** Using red/green/yellow as the sole indicator for BP classification
- Every color-coded element must have at least one additional non-color signifier

### HC-004: BP Classification — Redundant Encoding (Textual Prefixing)
- Every BP classification display must prepend the classification name as text:
  - Normal: `"Normal: {systolic}/{diastolic}"`
  - Elevated: `"Elevated: {systolic}/{diastolic}"`
  - Stage 1 Hypertension: `"Stage 1: {systolic}/{diastolic}"`
  - Stage 2 Hypertension: `"Stage 2: {systolic}/{diastolic}"`
  - Hypertensive Crisis: `"Crisis: {systolic}/{diastolic}"`

### HC-005: BP Classification — Redundant Encoding (Iconographic Mapping)
- Map unique geometric icons to each BP threshold:
  - Normal → Solid Circle (`●`)
  - Elevated → Upward Triangle (`▲`)
  - Stage 1 Hypertension → Diamond (`◆`)
  - Stage 2 Hypertension → Diamond with outline (`◇` or double diamond)
  - Hypertensive Crisis → **Bold Octagon** (🛑 / stop-sign shape)
- Icons must be minimum 20x20px, rendered as SVG or icon font

### HC-006: Data Visualization — Pattern Fill
- `BPTrendChart` threshold bands must use SVG pattern fills instead of (or in addition to) color:
  - Stage 1 zone: 45-degree diagonal hatch pattern
  - Stage 2 zone: dense stipple/dot pattern
  - Crisis zone: cross-hatch pattern
- Line differentiation:
  - Systolic line: heavy stroke weight (3px+), solid
  - Diastolic line: distinct dashed or dotted stroke (2px), different dash pattern
- Data point markers:
  - Systolic points: triangles
  - Diastolic points: squares

### HC-007: Link Styling
- All hyperlinks must have **permanent underlines** (not just color change)
- Applies especially to the "double-check with your doctor" disclaimer prompt
- Underline must be visible in all states (default, hover, visited)

### HC-008: Haptic Feedback
- Same as Dark Mode (DM-005), including crisis heavy vibration

---

## MODE 4: SENIOR MODE

### SM-001: Typography Scaling
- Apply a **1.4x scaling modifier** to all text sizes
- Minimum body text: **16pt** (after scaling)
- Critical BP metric values: minimum **18pt** (after scaling)
- Use `PixelRatio.getFontScale()` awareness — do not fight OS-level font scaling; compound with it

### SM-002: Letterform Legibility
- Font family: sans-serif with highly distinguishable characters
- Characters `I`, `l`, `1` and `O`, `0` must be visually distinct in chosen font
- Bold all critical data points (BP values, classification labels, medication names)
- Recommended: Inter, Nunito Sans, or Source Sans Pro

### SM-003: Touch Targets
- All interactive elements (`SaveButton`, selection arrays, `OptionChip`, nav items): minimum **56x56 pixels** touch target
- Standard 44x44px is insufficient for this mode
- Use `hitSlop` prop on React Native `Pressable`/`TouchableOpacity` if visual size differs from touch target

### SM-004: Spacing and Padding
- Minimum padding between adjacent interactive elements: **16px**
- `OptionChip` arrays: automatically expand margins between chips
- No two tappable elements may be adjacent without adequate separation

### SM-005: Cognitive Load — Navigation Simplification
- Enforce linear, sequential flow in Guided Mode (one step per screen)
- `PreMeasurementChecklist`: use clear, bite-sized language; no medical jargon
- Hide secondary/advanced functions behind explicit "More options" or "Advanced" toggle
- Reduce visible options per screen to essential actions only

### SM-006: Error Tolerance
- All destructive actions (deleting a reading via `HistoryPage`, clearing data) must show a **permanent confirmation dialog**
- Confirmation dialog must include prominent **"Undo"** or **"Cancel"** buttons
- Undo button must be at least as visually prominent as the confirm/delete button
- No swipe-to-delete without confirmation

### SM-007: Numpad Layout
- Default numpad layout: **Calculator style (7-8-9 top row)**
- Provide a toggle in `AppSettingsPage` to switch to Telephone layout (1-2-3 top row)
- Persist layout preference to AsyncStorage

### SM-008: Crisis Modal — Trimodal Alert
- **Visual:** Bold octagon hazard icon + plain language instructions (e.g., "Contact emergency services" — no clinical jargon like "hypertensive crisis")
- **Auditory:** Multi-tonal audio cue (distinct, non-startling sound via `expo-av` or similar)
- **Haptic:** Sustained heavy vibration pattern (`Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` repeated or using custom pattern)
- Push notification for caretaker: omit raw BP values for privacy; deep-link to filtered `HistoryPage` trends

### SM-009: Haptic Feedback
- Same haptic profile as High Contrast Mode (HC-008)
- Ensure haptic patterns are strong enough for users with diabetic neuropathy affecting fingertip sensitivity

---

## CROSS-CUTTING REQUIREMENTS

### XC-001: Mode Persistence
- Selected mode must persist across app restarts via AsyncStorage
- Key: `@medtracker/theme-mode`

### XC-002: Mode Transitions
- Mode switching must be instant (no loading screen, no app restart)
- All mounted components must reactively update via Zustand subscription

### XC-003: Medical Constants Integrity
- Theme mode switching must **never** alter medical threshold constants
- BP classification boundaries are immutable regardless of display mode
- Respect existing Claude Code hooks that block modifications to medical constants

### XC-004: Haptic Abstraction Layer
- Create a haptic utility at `shared/lib/haptics.ts`
- Export named functions: `hapticKeystroke()`, `hapticSave()`, `hapticCrisis()`
- Each function reads current mode from Zustand and applies the correct intensity
- Use `expo-haptics` as the underlying implementation

### XC-005: Accessibility Metadata
- All interactive elements must have `accessibilityLabel` and `accessibilityRole` set
- BP classification must include classification name in `accessibilityLabel` (not just the number)
- Mode toggle must announce mode change to screen reader via `AccessibilityInfo.announceForAccessibility()`

### XC-006: Testing Requirements
- Each mode must have snapshot tests verifying token application
- BP classification redundant encoding (text prefix + icon) must have unit tests per classification level
- Touch target sizes in Senior Mode must be verified with layout tests (minimum 56x56)
- Haptic calls must be mockable and verified per mode per action

### XC-007: PDF/Print Export Compatibility
- High Contrast Mode chart patterns (HC-006) must translate correctly to grayscale PDF export
- Verify pattern fills render in both screen and print contexts