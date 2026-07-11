# Pahela Kadam - Platform Scaling & Engineering Guide

This guide details the folder organization, design tokens system, HTML component compilation workflow, performance optimizations, and design principles that govern the development of **Pahela Kadam**.

---

## 1. Directory Architecture

The workspace is organized into modular directories to maintain separation of concerns:

```
├── index.html                   # Root index containing client redirect to pages/landing.html
├── SCALING_GUIDE.md             # Developer guidelines & architectural specifications
├── assets/
│   ├── images/                  # Separated image repositories for lazy loading
│   │   ├── hero/ | children/ | campaigns/ | founder/ | gallery/ | partners/ | therapy/ | events/ | backgrounds/ | logos/
│   ├── icons/                   # SVG files and trust-badge graphics
│   └── fonts/                   # Clean local font assets (optional)
├── css/
│   ├── variables.css            # Centralized Design Tokens (colors, spacing, elevations)
│   ├── reset.css                # Base normalization and keyboard focus styles
│   ├── typography.css           # Fluid type sizing and story readability configurations
│   ├── layout.css               # Grid structures, flex systems, and vertical sections
│   ├── utilities.css            # Scrim text overlays, aspect ratios, display helpers
│   ├── components.css           # Core components (buttons, cards, interactive widgets)
│   ├── animations.css           # Scroll viewport entries, hovers, and reduced-motion block
│   └── responsive.css           # Breakpoint media adapters and tablet/mobile modifications
├── js/
│   ├── component-loader.js      # Client-side HTML component template compiler
│   ├── animations.js            # Viewport observers and stagger-index assigners
│   └── app.js                   # Application bootstrap and component event controllers
├── components/
│   ├── navbar.html | footer.html | hero.html | impact-card.html | campaign-card.html | story-card.html ...
└── pages/
    ├── landing.html | about.html | founder-story.html | campaigns.html | donate.html ...
```

---

## 2. Component Compilation Cycle

To preserve performance and keep standard static hosting requirements without the overhead of heavy SPA frameworks (React/Vue), we use a raw asynchronous Component Loader (`js/component-loader.js`).

### How to Create & Register a Component:
1.  **Define the Template**: Create a raw HTML snippet inside the `components/` directory (e.g., `components/campaign-card.html`).
2.  **Declare in Page Layout**: Place a placeholder element with the `data-component` attribute in your target routes (e.g., `<div data-component="campaign-card"></div>`).
3.  **Implement Logic (Optional)**: If the component requires JavaScript interactions (like custom input validations or selector tracking), register its initialization lifecycle in `js/app.js`:
    ```javascript
    window.ComponentLoaderInstance.register('my-component-name', (element) => {
      // Your component initialization logic and event handlers
      const btn = element.querySelector('.btn-trigger');
      btn.addEventListener('click', () => { ... });
    });
    ```
4.  The system automatically fetches, injects, and registers the component on DOM load.

---

## 3. Styling & Token Conventions

### A. The 8px Spacing Grid
Avoid using arbitrary pixel values for padding, margin, or layout gaps. Always use the predefined variables in `css/variables.css`:
*   `var(--space-2)`: 8px (Inner elements, labels)
*   `var(--space-4)`: 16px (Card padding, small elements gap)
*   `var(--space-5)`: 24px (Standard list gap, standard card margins)
*   `var(--space-8)`: 48px (Between main subsections)
*   `var(--space-12)`: 96px (Breathing room for layout segments)

### B. Fluid Typography
All header elements are responsive out of the box using mathematical `clamp()` formulas:
```css
/* Example clamp values built in variables.css */
--text-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
--text-4xl: clamp(2.25rem, 1.85rem + 1.6vw, 3rem);
```
Never override font sizes with hardcoded pixel counts. Instead, apply helper classes (e.g., `.text-story` for readable stories or `.text-gradient-hope` for primary callouts).

### C. Contrast & Colors
*   **Trust Navy**: Use `var(--primary)` and its variants for text grids and dark sections.
*   **Hope Orange**: Use `var(--accent)` for primary contribution CTAs and milestone counts.
*   **Green Verified**: Use `var(--success)` for audited financial metrics, progress trackers, and certification badges.

---

## 4. Performance & Accessibility Guardrails (WCAG AA Compliance)

1.  **Prevent Layout Shifts (CLS)**: Always specify `aspect-ratio` utility classes (`.aspect-video`, `.aspect-square`) on image wrappers so browsers allocate space before images load.
2.  **Image Optimization**: Always lazy-load images using `<img loading="lazy" ...>`. Store visual outputs as modern formats (`.webp`, `.avif`).
3.  **Accessible Outlines**: Do not hide default browser keyboard focus indicators. We enforce a high-visibility offset ring globally:
    ```css
    :focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 4px;
    }
    ```
4.  **Reduced Motion**: Respect user preferences. The `css/animations.css` includes automated overrides that instantly nullify translations and fade steps:
    ```css
    @media (prefers-reduced-motion: reduce) {
      .reveal, .reveal-scale, .hover-lift {
        transition: none !important;
        transform: none !important;
        opacity: 1 !important;
      }
    }
    ```

---

## 5. Storytelling & Donation-First Principles

When editing or adding pages to the Pahela Kadam platform, ask this question first: **"How does this section inspire a user to support a child?"**
*   **Do not create text-heavy brochure pages.** Introduce real-world transformation stories immediately.
*   **Always couple stories with clear CTAs.** An informational paragraph about speech therapy should be immediately followed by: *"Sponsor a therapy session (₹1,500)"* linked directly to the donation portal.
*   **Audit with Trust indicators.** Whenever financial numbers or metrics are shown, display a verification tag (e.g., audited annual report links or 80G tax benefit reminders).
