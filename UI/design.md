```markdown
# Design System Strategy: The Juris-Artisan

This design system is a bespoke framework created to bridge the gap between the rigorous authority of Moroccan law and the soul of Maghreb craftsmanship. It moves away from the "SaaS-template" aesthetic, instead adopting a **High-End Editorial** approach that feels like a premium law firm’s private chambers—airy, prestigious, and deeply intentional.

---

## 1. Creative North Star: The Modern Riad
The "Modern Riad" philosophy dictates our layout. Just as a Riad uses an open central courtyard to create breath and light while maintaining privacy through layered architecture, this system uses **Structural Serenity**. We break the rigid, boxy grid by using intentional asymmetry, generous white space (the "Sand"), and deep, authoritative anchors (the "Royal Blue"). 

The goal is to evoke trust not through density of information, but through the clarity and prestige of the presentation.

---

## 2. Color & Tonal Architecture

Our palette is a dialogue between the earth (`surface`) and the deep Mediterranean (`primary`).

### The Palette
- **Primary (`#001e40`):** Our Deep Royal Blue. Used for primary actions and authoritative headers.
- **Secondary (`#775a19`):** Our Brass Accent. Use this sparingly for "High-End" highlights, active states, or gold-standard features.
- **Surface (`#fbf9f4`):** Our Warm Sand. This is the "canvas" and should dominate the screen real estate to provide a minimalist feel.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections or containers. 
- **Sectioning:** Define boundaries exclusively through background color shifts. For example, a `surface-container-low` section should sit directly against a `surface` background.
- **Visual Soul:** To add depth, use subtle linear gradients transitioning from `primary` to `primary_container` on hero sections. This mimics the way light hits silk or polished tile.

### Glassmorphism & Overlays
For floating elements like navigation bars or modal overlays, use a "Frosted Brass" or "Frosted Sand" effect. Use the `surface` token at 80% opacity with a `24px` backdrop-blur. This ensures the Zellij patterns beneath are felt but do not distract.

---

## 3. Typography: The Editorial Authority

We use a high-contrast pairing to distinguish between "Legal Content" and "Interface Content."

- **The Serif Authority (`notoSerif`):** Used for all `display` and `headline` tokens. This evokes the feel of printed legal gazettes and prestigious certificates. 
    - *Usage:* `display-lg` (3.5rem) should be used for hero statements with tight letter-spacing to create a "Masthead" feel.
- **The Modern Professional (`manrope`):** Used for `title`, `body`, and `label` tokens. It is highly legible and provides a clean, modern counterpoint to the traditional serif.
- **Hierarchy Hint:** Always lead with a Serif Headline, but support it with a `label-md` in uppercase with wide tracking (0.1rem) to create an "archival" metadata look.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are too "tech." We achieve depth through a physical stacking metaphor.

- **The Layering Principle:** 
    1. Base: `surface`
    2. Subtle Recess: `surface-container-low` (used for background sections)
    3. The "Paper" Lift: `surface-container-lowest` (pure white, used for cards)
- **Ambient Shadows:** When a float is required (e.g., a primary CTA button), use a shadow tinted with `on-surface` (#1b1c19) at 5% opacity with a `40px` blur. It should look like a soft glow, not a drop shadow.
- **The Ghost Border:** If a form input requires a boundary for accessibility, use the `outline_variant` at **15% opacity**. It should be felt more than seen.

---

## 5. Components & Signature Patterns

### Zellij Pattern Integration
Do not use patterns as high-contrast backgrounds. Use them as subtle, large-scale watermark overlays (Opacity: 3-5%) on `surface-variant` containers. The geometry should feel like a texture in the paper, not a graphic on the page.

### Buttons
- **Primary:** `primary` background with `on_primary` text. Use `rounded-md` (0.375rem) to maintain a professional, slightly sharp edge. 
- **Secondary (The Brass Button):** `secondary_container` background with `on_secondary_container` text. Use for high-value legal actions (e.g., "Sign Document").

### Input Fields
- Avoid "box" inputs. Use a "Minimal Underline" style using the `outline` token at 30% opacity, or a solid `surface-container-high` background with no border and `rounded-sm` corners.

### Cards & Lists
- **No Dividers:** Absolutely no horizontal lines between list items. Use spacing scale `6` (2rem) to separate items.
- **Hover State:** On hover, a card should shift from `surface-container-low` to `surface-container-highest` with a soft transition (300ms ease-out).

### Navigation
- Use a high-end "Header" layout. The logo should be centered or far-left, with navigation items in `label-md` (Manrope) using `secondary` for the active state to mimic a brass inlay.

---

## 6. Do’s and Don’ts

### Do:
- **Use Intentional Asymmetry:** Let a headline sit 1/3rd of the way across the screen while the body text sits 2/3rds. It feels curated, not templated.
- **Embrace White Space:** If a section feels "empty," leave it. In this system, space equals "Premium."
- **Use the Brass (`secondary`):** Use it for icons and small accents to lead the eye to the most important call-to-action.

### Don’t:
- **Don’t use 100% Black:** Always use `on_surface` (#1b1c19) for text to keep the "Modern Moroccan" warmth.
- **Don’t use standard blue:** Avoid any blue that isn't the specific `primary` royal blue provided.
- **Don’t over-round corners:** Stick to `md` (0.375rem) for most elements. `full` roundedness is only for chips and tags, never for primary structural containers.
- **Don’t use dividers:** If you feel the need for a line, use a `1.5` (0.5rem) gap of `surface-dim` instead.```