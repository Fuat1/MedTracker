# Card & Button Component Usage Guide

Reference for using the Card and Button component systems in MedTracker. Both live in `src/shared/ui/` and are exported from the barrel `src/shared/ui/index.ts`.

**Design spec:** `docs/superpowers/specs/2026-03-17-card-button-components-design.md`

---

## Card Component

**Import:** `import { Card, CardBody, CardHeader, CardFooter, CardDivider } from '@/shared/ui';`

### Variants

| Variant | Appearance | When to Use |
|---|---|---|
| `elevated` | Surface bg + platform shadow | Default for most containers — settings cards, analytics cards, widget containers |
| `outline` | Border, no shadow | Lists with borders — medication schedule, bordered sections |
| `ghost` | No border/shadow, just padding | Lightweight grouping |
| `filled` | Tinted accent background | Highlighted info sections |
| `pressable` | Elevated + press animation | Tappable cards (navigates on press) |
| `gradient` | LinearGradient background | Summary/hero cards |

### Sizes

| Size | Padding | Border Radius | Use Case |
|---|---|---|---|
| `sm` | 8pt | 8 | Compact list items |
| `md` | 16pt | 12 | Default |
| `lg` | 20pt | 16 | Settings cards, analytics widgets |

### Sub-components

- `CardHeader` — `icon` + `title` + optional `action` (right-aligned)
- `CardBody` — Main content area (accepts optional `style` prop)
- `CardFooter` — Bottom row for actions/metadata
- `CardDivider` — Themed horizontal separator line

### Specialized Cards

- `StatCard` — Large value + unit + label + trend indicator
- `ListCard` — Header + repeating rows with dividers (max ~20 items)
- `CollapsibleCard` — Header + animated expand/collapse body

### Common Patterns

#### Settings page card (borderRadius: 20 override)

```tsx
<Animated.View entering={FadeInUp.duration(400)} style={styles.cardMargin}>
  <Card variant="elevated" size="lg" style={styles.cardRadius}>
    <CardBody>
      {/* Card content */}
    </CardBody>
  </Card>
</Animated.View>

// Styles
cardMargin: { marginBottom: 16 },
cardRadius: { borderRadius: 20 },
```

#### Widget container (with horizontal margin)

```tsx
<Animated.View entering={FadeInUp.delay(250).duration(500)} style={styles.cardMargin}>
  <Card variant="elevated" size="lg" style={styles.cardRadius}>
    <CardBody>
      {/* Widget content */}
    </CardBody>
  </Card>
</Animated.View>

// Styles
cardMargin: { marginHorizontal: 20, marginBottom: 16 },
cardRadius: { borderRadius: 20 },
```

#### Card with custom body padding

```tsx
<Card variant="outline" size="md">
  <CardBody style={{ padding: 0 }}>
    {/* Content handles its own padding */}
  </CardBody>
</Card>
```

### Key Rules

- Card handles its own padding, background color, and shadow — **don't duplicate** these in your styles
- Card does NOT support Reanimated `entering` prop — wrap in `<Animated.View>` for entrance animations
- Margin between cards belongs on the outer wrapper (e.g., `styles.cardMargin`), not on the Card itself
- For borderRadius larger than the size default, use `style={{ borderRadius: 20 }}`
- For FlashList items, avoid Card wrapper (adds unnecessary View nesting that hurts recycling) — use manual styling

---

## Button Component

**Import:** `import { Button, ButtonText, ButtonIcon, ButtonSpinner, ButtonGroup } from '@/shared/ui';`

### Variants

| Variant | Appearance | When to Use |
|---|---|---|
| `primary` | Filled accent bg, surface text | Main CTAs — Save, Sync, Continue |
| `secondary` | Transparent bg, accent border + text | Secondary actions — Skip, Cancel, Detect Region |
| `ghost` | Text-only, no border/bg | Tertiary/dismiss actions |
| `destructive` | Filled error bg, surface text | Delete actions |
| `icon` | Circular, transparent bg | Toolbar/close buttons |
| `fab` | Circular, accent bg, elevation shadow | Floating add button |
| `link` | Underlined text, no padding | Inline navigation ("View all") |

### Sizes

| Size | Min Height | Use Case |
|---|---|---|
| `sm` | 36pt | Secondary inline actions |
| `md` | 44pt | Default for all action buttons |
| `lg` | 52pt | Primary CTAs, FAB |

### Sub-components

- `ButtonText` — Styled text (inherits variant color + font from context)
- `ButtonIcon` — Icon element (`as` prop for icon component, `name` for icon name)
- `ButtonSpinner` — ActivityIndicator for loading state
- `ButtonGroup` — Layout container with `direction` and `spacing`

### Props

| Prop | Type | Description |
|---|---|---|
| `variant` | string | One of the 7 variants |
| `size` | `sm` / `md` / `lg` | Default: `md` |
| `onPress` | function | Press handler |
| `isLoading` | boolean | Shows spinner, disables interaction |
| `isDisabled` | boolean | Disabled state (50% opacity) |
| `accessibilityLabel` | string | Required for `icon` variant |
| `style` | ViewStyle | Override/extend positioning |

### Common Patterns

#### Primary CTA with icon

```tsx
<Button variant="primary" size="md" onPress={handleSave} isLoading={saving}>
  <ButtonIcon as={Icon} name="checkmark" />
  <ButtonText>{t('common.save')}</ButtonText>
</Button>
```

#### Button group (side-by-side)

```tsx
<ButtonGroup direction="row" spacing="lg">
  <Button variant="secondary" size="md" onPress={onSkip} style={{ flex: 1 }}>
    <ButtonText>{t('skip')}</ButtonText>
  </Button>
  <Button variant="primary" size="md" onPress={onContinue} style={{ flex: 2 }}>
    <ButtonText>{t('continue')}</ButtonText>
    <ButtonIcon as={Icon} name="arrow-forward" />
  </Button>
</ButtonGroup>
```

#### FAB (floating action button)

```tsx
<Button variant="fab" size="lg" onPress={onAdd} style={styles.fab}
  accessibilityLabel={t('addItem')}>
  <ButtonIcon as={Icon} name="add" />
</Button>

// Styles — only positioning, Button handles appearance
fab: { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60 },
```

#### Secondary button with icon

```tsx
<Button variant="secondary" size="md" onPress={onDetect}>
  <ButtonIcon as={Icon} name="earth-outline" />
  <ButtonText>{t('detectRegion')}</ButtonText>
</Button>
```

### Key Rules

- Button handles its own background, border, padding, border-radius, shadow, press animation — **don't duplicate** these
- Use `ButtonText` for text (inherits correct color/font from variant context) — don't use raw `<Text>`
- Use `ButtonIcon` for icons (inherits correct size/color) — don't pass `size` prop (it's derived from button size)
- For FABs, the `style` prop is only for positioning (`position`, `bottom`, `right`, `width`, `height`)
- `isLoading` automatically replaces content with spinner and disables interaction
- All buttons have built-in Reanimated press scale animation

---

## Migration Checklist

When building new pages/widgets, verify:

- [ ] No manual `View` containers with `borderRadius` + `padding` + `shadowOffset` + `elevation` — use `<Card>`
- [ ] No manual `Pressable`/`TouchableOpacity` with button-like styling — use `<Button>`
- [ ] Card entrance animations use `<Animated.View entering={...}>` wrapping `<Card>`
- [ ] Button text uses `<ButtonText>` sub-component, not raw `<Text>`
- [ ] Button icons use `<ButtonIcon as={Icon} name="..." />`, not inline `<Icon>` inside Button
