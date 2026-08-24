# Website design

This document records the visual system and the design preferences behind the site. It is a maintenance reference, not a page of the website. The Jekyll build excludes it through `_config.yml`.

The working name for the design is **Editorial Salmon**. The site should feel like a small, opinionated publication rather than a product interface. Reading comes first. Decoration stays sparse, but the page should still have a recognizable character through its salmon canvas, cream paper, large editorial type, thin rules, and frog mark.

The canonical implementation is `assets/css/site.css`. If this document and the stylesheet disagree, check whether the stylesheet changed intentionally, then update this document.

## Design principles

- Preserve a restrained editorial character. Prefer type, spacing, rules, and proportion over cards, shadows, gradients, or ornamental UI.
- Keep long-form reading comfortable. Body text needs generous line height, a narrow measure, and strong contrast in both themes.
- Let the site feel personal. The salmon surround, frog mark, oversized titles, and occasional drop cap provide enough character without competing with the writing.
- Keep the interface quiet. Navigation and metadata use smaller sans-serif or monospace type so they remain secondary to the article.
- Use progressive enhancement. Content and navigation must work without Turbo, theme JavaScript, copy buttons, or offline support.
- Treat mobile as the same publication at a smaller size, not as a separate visual system.
- Keep pages light. Reuse the existing fonts, layouts, includes, tokens, and components before adding assets or JavaScript.

## Typography

All fonts are self-hosted as variable WOFF2 files under `assets/fonts`. Keep `font-display: swap` and the existing system fallbacks.

| Role | Typeface | Use |
| --- | --- | --- |
| Editorial | Newsreader, weights 200–800 | Body copy, headings, article titles, quotations |
| Interface | Inter, weights 100–900 | Navigation, labels, captions, buttons, tables, footer |
| Monospace | Roboto Mono, weights 100–700 | Dates, reading time, technical metadata, code |

Body copy uses Newsreader at `clamp(1.13rem, 1.06rem + 0.25vw, 1.25rem)` with a `1.65` line height. Long-form articles are capped at `66ch`. Do not widen the reading column to fill available space.

Headings use Newsreader at weight `600`, a tight `1.04` line height, and `-0.035em` letter spacing. Their fluid scale is deliberately large:

- General `h1`: `clamp(3rem, 9vw, 5.8rem)`
- Post title: `clamp(2.8rem, 8vw, 5.25rem)`
- Home title: `clamp(3.4rem, 10vw, 6.4rem)`, limited to `8ch`
- Photo-essay title: `clamp(3.5rem, 10vw, 8.5rem)`, limited to `10ch`
- `h2`: `clamp(1.8rem, 4vw, 2.65rem)`
- `h3`: `clamp(1.35rem, 3vw, 1.8rem)`

Keep the site-wide space before `h2` headings. The current default is `2.1em` above and `0.65em` below unless a component has an explicit override. This spacing is part of the reading rhythm and should not be limited only to article bodies.

Small labels use Inter in uppercase with wider tracking. Navigation stays lowercase. Dates and reading metadata use Roboto Mono in uppercase. Avoid introducing more typefaces or using sans-serif for article copy.

## Color system

Components should use semantic custom properties such as `--canvas`, `--surface`, and `--ink`. Do not place raw theme colors in component rules. Both themes need to remain complete and usable.

### Light theme

| Token | Value | Purpose |
| --- | --- | --- |
| Canvas | `#efa58f` | Salmon page surround |
| Surface | `#fff8ef` | Cream reading surface |
| Muted surface | `#f5e5d9` | Code, marks, table headers, secondary fills |
| Ink | `#241a18` | Main text and strong borders |
| Muted ink | `#6d5048` | Metadata, captions, secondary copy |
| Accent | `#9c382a` | Links, labels, drop caps, quote rules |
| Person name | `#8a315c` | Personal-name links on the About page |
| Rule | `#b97867` | Secondary dividers and borders |
| Focus | `#0c5a52` | Keyboard focus indicator |
| Media | `#ead8cb` | Image loading background |
| Selection | `rgb(156 56 42 / 28%)` | Selected text |

### Dark theme

| Token | Value | Purpose |
| --- | --- | --- |
| Canvas | `#140f0e` | Near-black page surround |
| Surface | `#211a18` | Dark brown reading surface |
| Muted surface | `#2d2320` | Secondary fills |
| Ink | `#f8eee5` | Main text and strong borders |
| Muted ink | `#c7afa6` | Metadata, captions, secondary copy |
| Accent | `#ff9d86` | Links and editorial accents |
| Person name | `#f2a3c4` | Personal-name links on the About page |
| Rule | `#6f4b43` | Secondary dividers and borders |
| Focus | `#73d1c1` | Keyboard focus indicator |
| Media | `#181311` | Image loading background |
| Selection | `rgb(255 157 134 / 32%)` | Selected text |

Theme preference defaults to the operating system and can be switched manually. Keep the canvas colors synchronized between CSS, the pre-paint theme script, and the runtime theme code so navigation never flashes the wrong background.

Use the focus color only for focus treatment. It intentionally differs from the accent so a `3px` focus outline remains easy to identify. Muted text must still meet readable contrast; do not make body copy warm gray merely to soften the page.

## Page frame and spacing

The body uses the canvas color with fluid outer padding from `1rem` to `2.75rem`. A bordered surface sits in the middle:

- Standard shell: maximum width `960px`
- Wide shell for photo essays: maximum width `1320px`
- Main content padding: `clamp(3.75rem, 9vw, 7rem)` vertically and `clamp(1.25rem, 7vw, 5.25rem)` horizontally
- Shell borders and strong dividers: `1px solid var(--ink)`
- Secondary dividers: `1px solid var(--rule)`

Spacing should feel generous, especially around introductions, article headers, section changes, and photographs. Use `clamp()` where spacing needs to scale. Avoid dense cards, rounded containers, and stacks of boxed sections. The site uses open space and horizontal rules to group content.

## Layouts

### Standard pages

The default layout uses the `960px` shell with a shared header, main content area, and footer. About, portfolio, archive, offline, and error pages build on this frame.

Page introductions use an eyebrow, a large title, a short deck capped near `33ch`, and a rule below. The home page has an `8ch` title and a wider editorial deck capped at `31ch`.

### Long-form posts

Articles sit in a centered `66ch` column. The header separates the post type, title, date, and reading metadata from the body with a strong rule. Standard posts may use an accent-colored drop cap on the first paragraph. Utility pages such as About and Offline explicitly omit it.

Use semantic article elements, real heading levels, figures with captions, blockquotes, tables, and code blocks. Images remain responsive and reserve a muted media background while loading.

The Read next area uses three columns on larger screens and one column on mobile. Guides are a labeled post type but are not candidates or manual targets for Read next recommendations. A guide may still recommend essays.

### Post index

Archive and home lists use a two-column row with a `9rem` metadata column and a flexible title column. A thin rule separates entries. On hover or keyboard focus, the title shifts slightly and reveals an accent arrow. On mobile each row becomes one column.

### Photo essays

Photo essays use the `1320px` shell. Their titles may reach `8.5rem`. Each figure places the image beside a narrow caption column, with generous vertical space between figures. Below `760px`, figures become a single column. Images use `object-fit: contain` and may reach `82vh`, keeping the full photograph visible.

### Portfolio and About

Portfolio entries remain a simple vertical sequence divided by rules. Images use a `4 / 3` crop. The About page uses rules to separate sections and a dedicated plum/pink token for personal-name links. These pages may vary from article conventions only where their content needs it.

## Header, navigation, and footer

The masthead is compact and uses Inter. The brand combines the frog mark with the site name. The frog is monochrome through a CSS mask and inherits the current ink color. Its slight rotation and small hover movement should remain playful but subtle.

Navigation labels are lowercase and show a `2px` underline for hover, focus, and the current page. The current page must also use `aria-current="page"`. The theme toggle is circular because it is a standalone icon control; this is not a general invitation to add rounded UI elsewhere.

The footer stays small and secondary. It contains a short Barcelona colophon and uppercase external links. Keep both header and footer consistent across standard and photo-essay layouts.

## Links, controls, and interaction

Links use the accent color, a visible underline, and an offset that keeps the underline clear of letterforms. Hover increases underline thickness rather than changing the entire component style.

All links and buttons need a visible `:focus-visible` outline. Interactive effects must work for keyboard focus as well as hover. Controls need meaningful accessible names even when the visible content is only an icon.

Motion is brief, usually `140–180ms`, and uses the shared ease-out curve where movement is involved. Turbo navigation fades and shifts the content only slightly. Theme changes transition color and borders. Do not add long, looping, or attention-seeking animation.

Honor `prefers-reduced-motion`. The site removes smooth scrolling, collapses animation durations, and disables decorative transforms. Any new motion needs an equivalent reduced-motion rule.

## Content elements

- Blockquotes use a `4px` accent rule, larger italic Newsreader, and muted ink.
- Code uses Roboto Mono on the muted surface. Copy controls stay square, bordered, and attached to the top-right corner of the block.
- Tables use Inter, visible cell borders, and horizontal scrolling when narrow.
- Captions use small muted Inter text. They should explain the image rather than repeat nearby prose.
- Inline figures may place a smaller image beside text. They stack on mobile.
- Horizontal rules mark substantial breaks and use the secondary rule color.

Avoid generic cards, pills, badges, heavy shadows, gradients, glass effects, or large filled buttons unless a real content or interaction need justifies them.

## Responsive behavior

The main breakpoint is `760px`. At and below it:

- The outer canvas padding and shell border disappear so the surface fills the viewport.
- The written brand name hides, leaving the frog mark.
- Post lists, Read next, photo-essay figures, and inline figures stack.
- Article side padding tightens to roughly `1–1.25rem`.
- The footer stacks vertically.

At `480px`, header gaps and controls tighten, navigation type gets smaller, the secondary section-heading label hides, and post metadata becomes a block. Preserve usable tap targets and do not solve narrow layouts by shrinking article text below the current scale.

## Accessibility and resilience

- Keep the skip link and the focusable `main` target.
- Use semantic landmarks and heading order.
- Preserve `aria-current` in navigation and accessible labels on icon controls.
- Do not encode meaning by color alone.
- Keep focus states visible in both themes.
- Provide useful alternative text and captions for images.
- Make tables and code blocks scroll rather than overflow the viewport.
- Keep core reading and navigation usable when JavaScript, Turbo, analytics, or the service worker fails.
- Print output removes the site chrome, canvas, and shell border, then limits articles to `65ch` at `11pt`.

## How to extend the design

Before adding a new visual pattern:

1. Check whether an existing layout, include, or component already solves the problem.
2. Use the semantic color and font tokens from `assets/css/site.css`.
3. Test light, dark, and automatic themes.
4. Test keyboard use, visible focus, reduced motion, and a viewport at or below `480px`.
5. Keep article readability and page weight ahead of novelty.
6. Update this document when a deliberate change affects the shared visual language.

The safest default is to remove one element, not add one. If a design change makes the site resemble a dashboard or a generic publishing theme, it is probably moving in the wrong direction.
