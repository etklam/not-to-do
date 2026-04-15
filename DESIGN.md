# Design System Document

## 1. Overview & Creative North Star
**The Creative North Star: "Obsidian Precision"**

This design system is built for an uncompromising dark-mode experience. We are moving away from the "cluttered dashboard" trope of habit trackers and toward an editorial, high-performance interface. The goal is to create a space of deep focus where the user’s "Not-To-Do" list feels like a sacred contract. 

We break the "template" look through **Obsidian Precision**: a philosophy that utilizes extreme tonal shifts, expansive negative space, and aggressive typographic scales. By removing traditional borders and lines, we treat the UI as a single, fluid block of dark stone, where information is carved out through light and depth rather than partitioned by boxes.

---

## 2. Colors & Surface Architecture

### The Palette
We use a monochromatic obsidian base to allow the **Electric Violet** primary accent to command immediate attention.

- **Background & Surface:** `#0e0e0e` (Surface / Surface-Dim)
- **Primary Accent:** `primary` (#bd9dff) to `primary_dim` (#8a4cfc)
- **Success/Neutral:** `secondary` (#c38bf5)
- **The "Fail" State:** `error` (#ff6e84)

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions. 
- Use `surface_container_low` for secondary sections sitting on a `surface` background.
- Use `surface_container_highest` for interactive elements that need to "pop" from the base.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Level 0 (Base):** `surface` (#0e0e0e) for the main app background.
- **Level 1 (Sections):** `surface_container_low` (#131313) for grouping content.
- **Level 2 (Cards/Interactions):** `surface_container_high` (#201f1f) for actionable items.

### The "Glass & Gradient" Rule
To elevate the "Electric Violet" accent, do not use flat fills for large areas. Apply a subtle linear gradient from `primary` to `primary_container`. For floating overlays (e.g., a "Check-in" modal), use **Glassmorphism**: apply `surface_container_highest` at 70% opacity with a `20px` backdrop-blur to create a sense of environmental integration.

---

## 3. Typography
The typography system uses a high-contrast pairing: **Space Grotesk** for technical, bold headlines and **Manrope** for legible, functional body text.

- **Display (Space Grotesk):** Large, assertive, and tight-tracked. Use `display-lg` for current streak counts to make progress feel monumental.
- **Headlines (Space Grotesk):** Use `headline-sm` for habit titles. This font’s geometric nature reinforces the "modern/minimal" aesthetic.
- **Body & Labels (Manrope):** Use `body-md` for descriptions. Manrope provides a human touch to an otherwise cold, technical environment.
- **Hierarchy Strategy:** Create focus by using `on_surface_variant` (#adaaaa) for secondary info (like "Last checked 2h ago") and `on_surface` (#ffffff) for active content.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Instead of a shadow, place a `surface_container_lowest` card inside a `surface_container_high` section to create a "recessed" or "carved" look.

### Ambient Shadows
If an element must float (e.g., a "New Habit" FAB), use an extra-diffused shadow:
- **Shadow:** 0px 20px 40px rgba(0, 0, 0, 0.4).
- **Coloring:** Tint the shadow with a hint of `primary_dim` to simulate the violet glow reflecting off the obsidian surface.

### The Ghost Border Fallback
If contrast is required for accessibility, use a **Ghost Border**: `outline_variant` at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### Streak Cards
- **Structure:** No borders. Use `surface_container_low` background. 
- **Visuals:** Use `display-sm` for the streak number.
- **The Glow:** Apply a subtle `primary_dim` outer glow (4px blur) only when a streak is active to signify "heat."

### Check-in Buttons (Success/Fail)
- **Success:** Use `primary` background with `on_primary` text. Use `xl` (0.75rem) roundedness.
- **Fail:** Use `surface_container_highest` with an `error` colored "Ghost Border."
- **Interaction:** On press, the button should scale down slightly (0.98) and increase in surface brightness (`surface_bright`).

### GitHub-Style Heatmap
- **Empty State:** `surface_container_highest`.
- **Active State:** A gradient scale from `primary_container` (low intensity) to `primary` (high intensity).
- **Spacing:** Use `sm` (0.125rem) gaps. Forbid lines between cells; use the natural contrast of the background to define the grid.

### Input Fields
- **Style:** Underline only or "recessed" block. 
- **Active State:** The label transitions to `primary` color, and the "Ghost Border" increases to 40% opacity.

---

## 6. Do's and Don'ts

### Do:
- **Use "Active" Whitespace:** Leave significant vertical breathing room between different habits to reduce cognitive load.
- **Embrace Asymmetry:** Align the habit name to the left and the streak count to the far right to create an editorial layout feel.
- **Focus on Micro-interactions:** Use smooth, ease-in-out transitions for "Check-in" states to make the "Not-To-Do" action feel rewarding.

### Don't:
- **No Dividers:** Never use a horizontal rule `<hr>` to separate list items. Use a `16px` or `24px` spacing jump instead.
- **No Pure White:** Avoid `#ffffff` for long-form text; use `on_surface_variant` to prevent eye strain in a dark-only environment.
- **No Sharp Corners:** Avoid `none` roundedness. Even the most "brutal" elements should have at least `DEFAULT` (0.25rem) to feel premium and engineered.