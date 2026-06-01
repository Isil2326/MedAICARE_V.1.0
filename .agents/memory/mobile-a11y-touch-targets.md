---
name: Mobile a11y touch targets (selectors/chips)
description: Interactive selectors must be a full Pressable ≥44px, never onPress on a Text node
---

# Touch targets for selector chips/segments (mobile Expo app)

## Rule
Any interactive selector (filter chip, segmented choice, target/horizon toggle) must
be a **full `Pressable` with `minHeight: MIN_TOUCH_TARGET` (44px)** carrying the
`onPress` — never a non-pressable wrapper with `onPress` on an inner `<Text>`. The
shared `mobile/src/components/SelectChip.tsx` is the single component for this; reuse
it instead of hand-rolling `<View>`+`<Text onPress>` chips.

**Why:** an `onPress` on a `Text` makes only the glyphs tappable and can fall below
44px, violating the project's a11y non-negotiable (≥44px touch targets). A code
review caught several `minHeight: 36/40` chips with `Text onPress` during the Phase
8.5 UI polish.

**How to apply:** when adding/selecting filters or segmented options on any mobile
screen, use `SelectChip`. A source-level guard in `ui-constraints.test.ts` asserts
selector screens reference `SelectChip` and contain no `minHeight` < 44.
