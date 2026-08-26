# Design System: 居安择时 (HomeBuy AI) — Precision Real Estate Decision Engine

## 1. Visual Theme & Atmosphere
A restrained, analytical financial atelier. The visual atmosphere balances the rigorous precision of a private wealth dashboard with the warmth of a modern architectural studio. Surfaces are crisp and high-contrast, structured by subtle slate dividing lines and tactile elevation. 

- **Density:** Balanced Analytic (6/10) — high information density where data matters, surrounded by generous structural whitespace.
- **Variance:** Structured Asymmetric (7/10) — side-by-side comparative split views, asymmetric data metric grids, and bottom-anchored contextual drawer panels.
- **Motion:** Weighted Spring Physics (6/10) — snappy micro-interactions with physical weight (`stiffness: 120, damping: 18`), smooth bottom-sheet slide-ups, and shimmer skeleton loaders.

---

## 2. Color Palette & Functional Roles

```
Canvas & Structural Neutrals:
- Canvas Mist (#F8FAFC)        — Primary page canvas background
- Surface Pure (#FFFFFF)       — Primary card container background
- Surface Hover (#F1F5F9)      — Interactive row and secondary pill hover state
- Whisper Border (#E2E8F0)     — 1px hairline container borders and dividers
- Border Hover (#CBD5E1)       — Active/hover card border accent
- Border Focus (#059669)       — Keyboard focus-visible indicator ring

Text & Contrast Hierarchy:
- Deep Slate Ink (#0F172A)     — Primary headers, bold metrics, and critical totals (Zinc-950 depth)
- Slate Muted (#475569)        — Body text, descriptive clauses, form labels
- Dim Steel (#64748b)          — Metadata timestamps, secondary captions, unit labels

Singular Primary Accent (Controlled <80% Saturation):
- Imperial Emerald (#059669)   — Primary CTAs, active tab pills, cashflow positive yields, safe zone
- Emerald Deep (#047857)       — Active/hover state for primary buttons
- Emerald Tint (rgba(5,150,105,0.08)) — Badge backgrounds, selected card aura, highlight bands

Functional Status Indicators:
- Amber Warning (#D97706)      — Price negotiation discount opportunity, high-age property alert
- Amber Tint (rgba(217,119,6,0.1)) — Warning badge fills and discount highlight pill
- Crimson Risk (#DC2626)       — High-risk discount deduction, mortgage cliff alert
- Crimson Tint (rgba(220,38,38,0.1)) — Defect warning tags, critical debt risk flags
- Cobalt Accent (#0891B2)      — Metro proximity, parking equity, infrastructure planning
```

> **Banned Color Rules:**
> - Strictly **NO** AI purple/indigo neon glows (`#8B5CF6`, `#6366F1`)
> - Strictly **NO** pure black (`#000000`) — always use Deep Slate Ink (`#0F172A`)
> - Maximum one primary accent color (Imperial Emerald) across the entire interface

---

## 3. Typographic Architecture

- **Display & Section Headers:** `Plus Jakarta Sans` / `Geist` — Track-tight (`letter-spacing: -0.02em`), weight-driven hierarchy (`font-weight: 800`), balanced wrap (`text-wrap: balance`).
- **Body & Editorial Copy:** `Plus Jakarta Sans` / `Noto Sans SC` — Relaxed leading (`line-height: 1.65`), maximum 65 characters per line for readability.
- **Monospace & Numerical Figures:** `JetBrains Mono` / System Tabular Mono with `font-variant-numeric: tabular-nums` mandatory across all currency (万元, 元/㎡), rental yields (%), loan amortization schedules, and dates.
- **Banned Typography:** `Inter` is banned for display headings. Generic serifs (`Times New Roman`, `Georgia`) are banned. All financial comparison tables must strictly enforce tabular alignment.

---

## 4. Component Stylings & Behaviors

### 4.1 Buttons & Interactive Pills
- **Primary Action Button:** Solid Imperial Emerald fill (`#059669`), white text, `border-radius: 8px`, `padding: 10px 18px`, min-height `44px` on mobile.
- **Secondary Action Button:** Surface fill (`#F1F5F9`), hairline border (`#E2E8F0`), slate text.
- **Tactile Feedback:** Hardware-accelerated `-1px` translate on hover, `transform: scale(0.98)` on `:active`.
- **Keyboard Focus:** Mandatory `:focus-visible` with `2px solid #059669` and `2px offset`.

### 4.2 Cards & Data Containers
- **Elevation Hierarchy:** Generously rounded corners (`border-radius: 14px`), diffused soft shadow (`box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04)`), 1px crisp border (`#E2E8F0`).
- **Card Hover:** Subtle elevation lift (`box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08)`), border transitions to `#CBD5E1`.
- **Border & Corner Rule (Drop Either Radius or Left Border):** Strictly **NEVER** combine a `border-radius` with a thick colored `border-left` accent (the generic "AI card" cliché with awkward corner geometry).
  - *Option A (Default Rounded):* Keep `border-radius: 14px` with a uniform 1px `#E2E8F0` border. Use interior status badges, subtle background tints, or top tags for categorization.
  - *Option B (Sharp Accent):* If a colored left-indicator border is strictly required, remove the border radius completely (`border-radius: 0px`) to maintain sharp, intentional architectural geometry.

### 4.3 Form Inputs & Selects
- **Hierarchy:** Form label placed strictly above the control (`font-weight: 700, font-size: 0.85rem`), helper text optional, inline error container below with `aria-live="polite"`.
- **Touch Target & Sizing:** Fixed `font-size: 16px` on mobile (prevents iOS auto-zoom), minimum height `44px`, `border-radius: 8px`.
- **Focus State:** Subtle emerald glow (`box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15)`), border turns `#059669`.

### 4.4 Loaders & Empty States
- **Skeletal Loaders:** Pulsing shimmer gradients (`linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)`) matching the exact dimensions of target cards. No generic spinning wheel overlays.
- **Empty States:** Composed illustrations with clear contextual prompt text and an immediate action CTA button.

---

## 5. Layout & Responsive Principles

### 5.1 Desktop Layout (> 768px)
- **Container Sizing:** Max width `1280px` centered with `padding: 0 20px`.
- **Header:** Sticky frosted glass bar (`backdrop-filter: blur(16px) saturate(180%)`), height `70px`, pill navigation with active indicator glow.
- **Data PK Workspace:** Dual-view system:
  - Multi-card comparison with vertical metric alignment.
  - Sticky-left column comparison matrix table for horizontal inspection.

### 5.2 Mobile-First Responsive Rules (< 768px)
- **Self-Contained Card Bounds (No Viewport Blowout):** All `.container`, `.glass-card`, flex parents, and grid cells must strictly enforce `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;`.
- **Dynamic Grid Sizing (Fluid Minimums):** Never use fixed pixel minimums in auto-fit grids (e.g., `minmax(340px, 1fr)` is strictly banned). Always wrap minimums with `min(100%, ...)` (e.g., `minmax(min(100%, 140px), 1fr)`) so elements collapse smoothly on narrow (360px~390px) viewports without overflowing.
- **Isolated Table Scroll Wrappers:** Wide data tables (e.g., the 8-column break-even matrix and 9-column listing ledger) must never expand their parent card containers. They must be wrapped in a dedicated `.table-scroll-container` with `min-width: 0; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;`, allowing the table to scroll internally while the outer card remains 100% viewport width.
- **Single Column Collapse:** Multi-column grids and split parameter cards automatically collapse into 1-column stacks.
- **Bottom Sheet Drawers (Modals):** Form modals and note editors transform into bottom-anchored sheets (`border-top-left-radius: 20px`, `border-top-right-radius: 20px`, `animation: slideUpDrawer 0.28s cubic-bezier(0.16, 1, 0.3, 1)`).
- **Floating Sticky Action Pill:** Floating frosted glass widget (`bottom: 76px`, `border-radius: 9999px`) for contextual quick comparisons.
- **Bottom Navigation Bar:** Fixed `64px` height with iOS safe area padding (`env(safe-area-inset-bottom)`), minimum `48px` touch target per tab item.

---

## 6. Motion Philosophy & Micro-Interactions

- **Physics Engine:** Spring physics (`stiffness: 120, damping: 18`) over linear easing for natural weight.
- **Compositor Isolation:** Animate exclusively using GPU-accelerated `transform` and `opacity`. Never animate `top`, `left`, `width`, or `height`.
- **Reduced Motion:** Fully respectful of `@media (prefers-reduced-motion: reduce)` — instant state switches without transition jumps.

---

## 7. Anti-Patterns & Banned AI Clichés

1. **NO Rounded Card with a Colored Left-Border Accent:** Drop either the radius or the left border. A rounded card (`border-radius: 12px+`) with a thick colored left accent border (`border-left: 4px/5px/6px solid ...`) creates awkward corner intersection artifacts and screams low-taste AI template. Use clean uniform borders with badges or top highlight bars instead.
2. **NO Global `overflow-x: hidden` as a Layout Band-Aid:** Never apply `overflow-x: hidden` on `html`, `body`, or `#root` to mask wide overflowing content. This creates clipped "half-page" views on mobile by hiding the right side off-screen without fixing the root cause. All child elements must be genuinely fluid.
3. **NO Hardcoded Grid Minimums:** Never use `minmax(300px+, 1fr)` without `min(100%, ...)`.
4. **NO Emojis in Core Data:** No emojis inside formal quantitative columns or official export data (visual badge icons only).
5. **NO `Inter` Font:** Use `Plus Jakarta Sans` / `Geist` for distinctive typographic brand identity.
6. **NO Pure Black (`#000000`):** Use Deep Slate Ink (`#0F172A`).
7. **NO Purple/Cyan Neon Glows:** Keep aesthetic grounded in authentic architectural emerald and slate.
8. **NO 3-Equal-Card Monotony:** Use asymmetric split layouts, highlight badges, and weighted visual hierarchy.
9. **NO Fabricated Metrics:** Never display fake SLA percentages or AI jargon ("100% Seamless", "Next-Gen AI").
10. **NO Unanchored Floating Spinners:** All asynchronous operations must use structured layout skeleton placeholders.
