# Repository Standards Audit

**Audit date:** 2026-07-30<br>
**Repository:** `janbsc4.github.io`<br>
**Standard:** `AGENTS.md`

## Executive summary

The repository has a healthy foundation. It builds cleanly, its generated
internal links resolve, its layouts use sensible semantic landmarks, and the
current CSS gives readers a responsive long-form column, strong color contrast,
visible focus treatment, and reduced-motion support. There is no critical issue
that should block publishing.

The main gap against `AGENTS.md` is behind the page rather than in its visual
design. The browser runtime contains duplicated and dormant behavior, the
service worker does substantially more work than an offline fallback requires,
and the asset tree is much larger than the files the site actually uses. A
focused cleanup could make the site easier to reason about and materially reduce
repository and network weight without changing its appearance.

The highest-value improvements are:

1. Make the Turbo lifecycle initialization single and idempotent, and count
   analytics on Turbo navigations.
2. Replace the service worker's site-wide precache with a small, reliable
   offline shell and bounded runtime caching.
3. Remove unused font files and serve compressed WOFF2 subsets.
4. Add responsive variants for the photo essay and replace placeholder
   alternative text.
5. Remove dormant theme code and add automated repository checks.

## Scope and method

This was a repository and generated-output audit. It covered:

- Jekyll configuration, dependencies, layouts, includes, data, feed, manifest,
  service worker, JavaScript, CSS, development scripts, and representative
  content.
- Tracked font and image inventories, references, sizes, and generated image
  attributes.
- Generated HTML structure, duplicate IDs, root-relative internal links, and
  whether repository-only files leak into `_site`.
- Current official dependency guidance for GitHub Pages, Turbo, and
  GoatCounter.

The audit did not redesign the site, rewrite posts, run Lighthouse against the
live domain, or claim browser/physical-device validation. Performance findings
are based on source, generated output, and asset measurements. A live Lighthouse
run remains useful after the high-priority optimizations are implemented.

## Baseline results

| Check | Result |
| --- | --- |
| `bundle exec jekyll build --trace` | Pass |
| `bundle exec jekyll doctor` | Pass |
| `git diff --check` | Pass at audit time |
| JavaScript syntax (`turbo-config.js`, generated `sw.js`) | Pass |
| YAML and post front matter parsing | Pass |
| Duplicate IDs in generated site HTML | None detected |
| Broken root-relative links in generated HTML | None detected |
| Standard page images missing `alt` | None detected |
| Theme text/accent/focus contrast against surfaces | 6.61:1–16.12:1 light; 8.25:1–14.97:1 dark |

The generated site is roughly 37 MB because Jekyll copies all tracked fonts and
images, whether or not a page references them. Before the exclusions added with
this report, the generated cache manifest contained 61 URLs: 13 asset URLs and
48 page or other non-asset URLs. The exclusion-only validation build still
contains 58 URLs.

## What already meets the standard

### Reading experience and accessibility

- The long-form column is capped at `66ch`, with responsive post gutters and
  comfortable line height.
- Layouts use `<header>`, `<nav>`, `<main>`, `<article>`, and `<footer>`
  landmarks appropriately.
- A skip link targets the main content, and the main target can receive
  programmatic focus.
- Links and buttons have visible `:focus-visible` outlines.
- The navigation indicates the current page with `aria-current`.
- The theme control has an accessible label and state, and the initial theme is
  resolved before the stylesheet paints.
- `prefers-reduced-motion` disables smooth scrolling and nearly all transition
  duration.
- The core palette comfortably exceeds WCAG AA contrast requirements for the
  combinations tested.

### Performance foundations

- Fonts are self-hosted and use `font-display: swap`.
- Most content images have explicit intrinsic dimensions, lazy loading, and
  asynchronous decoding.
- The photo essay gives its first image high fetch priority and lazily loads the
  remaining images.
- Turbo is pinned and protected by subresource integrity.
- GoatCounter loads asynchronously and is a small analytics dependency.
- The site remains composed of ordinary links and rendered HTML, so core
  navigation and reading do not inherently depend on JavaScript.

### Maintainability foundations

- Layout concerns are separated into small Jekyll layouts and includes.
- CSS is a single file but is clearly divided into tokens, components, content,
  responsive rules, motion preferences, and print rules.
- The light/dark palette and typography are centralized with custom properties.
- The dependency lock matches the versions currently supported by GitHub Pages:
  `github-pages` 232 and Jekyll 3.10.0.

## Priority 1 findings

### P1.1 — Page initialization can run twice

**Relevant standard:** self-explanatory code, straightforward control flow,
progressive enhancement.

**Evidence**

- `assets/js/turbo-config.js:119` calls `onPageLoad` on `turbo:load`.
- `assets/js/turbo-config.js:122` calls it again on `DOMContentLoaded`.
- Turbo emits `turbo:load` for the initial page as well as subsequent visits.
- The theme button protects itself by cloning and replacing the node, but form
  handlers and image handlers do not have an equivalent idempotency guard.

**Impact**

The initial page can attach form, image load, and image error behavior twice.
There are no active forms today, so this is not currently visible, but a future
external POST form could submit twice. The cloning workaround also makes the
theme setup harder to understand than necessary.

**Recommendation — small effort, low visual risk**

- Use `turbo:load` as the single initialization entry point.
- Make each initializer explicitly idempotent, preferably as small named
  functions for theme, images, and analytics.
- Attach a listener directly to the newly rendered theme button rather than
  cloning it to discard unknown listeners.
- Remove the generic form interception unless a real form requires it. If it is
  retained, check `response.ok`, handle non-JSON responses, expose an accessible
  success/error status, and test failure paths.

**Verify**

- Instrument initialization and confirm it runs once on the first load and once
  per Turbo visit.
- Navigate repeatedly, toggle the theme, and confirm only one state change
  occurs per click.
- If forms remain, confirm one network request per submission and accessible
  success/error announcements.

### P1.2 — GoatCounter does not account for Turbo navigation

**Relevant standard:** maintainable behavior and trustworthy UX instrumentation.

**Evidence**

- `_includes/head.html:65` uses GoatCounter's normal on-load integration.
- `assets/js/turbo-config.js` does not call `window.goatcounter.count`.
- Turbo replaces the body without a full document load during internal
  navigation.
- GoatCounter's official
  [SPA guidance](https://www.goatcounter.com/help/spa) requires manual counting
  when navigation does not reload the document.

**Impact**

The first page view is counted, but later Turbo visits can be missing from the
analytics. This makes post-level traffic less reliable.

**Recommendation — small effort, low risk**

- Configure GoatCounter with `no_onload: true` before loading `count.js`.
- Count from the single `turbo:load` lifecycle, using the current path and title.
- Guard against Turbo previews and confirm the initial visit is counted exactly
  once.
- Use the canonical URL once standard canonical metadata is added.

**Verify**

- In a non-production test configuration, navigate home → blog → post without
  full reloads and confirm one request per page.
- Confirm Back/Forward visits follow the desired counting policy.

### P1.3 — The service worker precaches too much and can install incompletely

**Relevant standard:** fast loading, lightweight pages, progressive enhancement,
straightforward failure handling.

**Evidence**

- `cache-list.json:21-28` adds every Jekyll page and post.
- Before the audit exclusions, the generated list contained 61 URLs, including
  48 non-asset routes and hidden posts. It still contains 58 URLs after
  excluding repository documentation and local curriculum files.
- `sw.js:12-22` catches a failed `cache.addAll` and resolves the install instead
  of failing it.
- `sw.js:42-84` runtime-caches every successful same-origin GET response without
  an allowlist, size cap, entry cap, or expiration policy.
- The offline fallback depends on the precache succeeding, but the install error
  is suppressed.

**Impact**

Every deployment can trigger dozens of avoidable first-visit requests for posts
the reader may never open. A partial precache failure can activate a worker
without a working offline page. Runtime storage can grow as large images and
query-string variants are visited.

**Recommendation — medium effort, medium behavioral risk**

- Precache only the offline page and the minimum shell required to render it.
- Use a network-first strategy for navigations with the offline page as fallback.
- Use stale-while-revalidate only for stable CSS, JavaScript, and font assets.
- Cache images on demand only if offline images are a real requirement; impose a
  documented entry or age limit.
- Do not swallow failure to cache required shell assets. Let the new worker fail
  installation so the previous working worker remains active.
- Combine activation cleanup and `clients.claim()` into one `waitUntil` chain.
- Exclude hidden posts and repository/build artifacts from generated cache
  inputs.

**Verify**

- First visit makes only the documented shell requests.
- A simulated failed shell request prevents the new worker from activating.
- Online navigation returns current content; offline navigation returns
  `offline.html`.
- Cache storage remains bounded after visiting the photo essay and query-string
  variants.
- Repeat the checks across an old-worker/new-worker deployment transition.

### P1.4 — The font tree is much larger than the used font set

**Relevant standard:** lightweight assets, reuse, removal of obsolete support
files.

**Evidence**

- `assets/fonts` is approximately 22 MB and is copied in full to `_site`.
- CSS references only four normal variable faces:
  - Newsreader normal WOFF2, approximately 132 KB.
  - Newsreader italic WOFF2, approximately 144 KB.
  - Inter normal variable TTF, approximately 856 KB.
  - Roboto Mono normal variable TTF, approximately 180 KB.
- The repository also contains every static Inter cut, every static Roboto Mono
  cut, and unused italic variable files.
- Inter and Roboto Mono are served as TTF rather than web-optimized WOFF2.

**Impact**

Unused files inflate clones and deployments by roughly 20 MB. The actual page
can still request about 1.3 MB of font data, with Inter responsible for most of
it.

**Recommendation — medium effort, low visual risk**

- Retain licenses and only the faces actually referenced by CSS.
- Convert or source legitimate WOFF2 variable builds for Inter and Roboto Mono.
- Subset to the Latin characters needed for English, Spanish, Catalan, and
  German while preserving punctuation and symbols used by posts.
- Consider whether Roboto Mono warrants a separate request for the small amount
  of metadata/code text; retain it if its visual role is important.
- Update `@font-face` sources and `cache-list.json` together.
- Do not preload every font. If measurement supports preloading, preload only
  the primary above-the-fold face.

**Verify**

- Compare rendered text, weight range, italics, diacritics, and fallback behavior
  before and after.
- Confirm no removed file appears in CSS, HTML, the manifest, or cache list.
- Record before/after repository size and transferred font bytes.

### P1.5 — The photo essay lacks responsive sources and useful alt text

**Relevant standard:** responsive reading experience, accessibility, optimized
media.

**Evidence**

- `assets/images/2026-Pearl-River-Delta` is approximately 14 MB across 25 WebP
  photographs.
- Source dimensions are generally 2,000–3,000 pixels, but each `<img>` has only
  one `src`; there are no `srcset` or `sizes` attributes.
- 23 of the 25 images use `alt="placeholder"`.
- Intrinsic dimensions, lazy loading, and async decoding are otherwise present.

**Impact**

Phones download desktop-scale images when readers scroll through the essay.
Placeholder alt text is announced as meaningless content and does not satisfy
the accessibility standard.

**Recommendation — medium/large effort, low design risk**

- Generate several width variants, for example 480, 800, 1,200, and the retained
  original maximum, without upscaling.
- Use an include or data-driven figure structure to emit `srcset`, `sizes`,
  dimensions, caption, and alt consistently.
- Keep WebP and evaluate AVIF only if the added generation/maintenance cost is
  justified by measured savings.
- Write concise descriptions for meaningful images; use `alt=""` only when a
  nearby caption makes an image truly redundant.
- Preserve the current first-image priority and lazy-load policy.

**Verify**

- Browser selection chooses an appropriately sized file at representative
  mobile and desktop widths.
- The gallery layout and link-to-original behavior are unchanged.
- All images have intentional, reviewed alternatives and retain dimensions.
- Compare total transferred bytes after scrolling the complete essay.

## Priority 2 findings

### P2.1 — Dormant theme code obscures the active site

**Relevant standard:** small cohesive changes, no duplication, removal of
obsolete supporting code.

**Evidence**

- `_includes/toggle_theme_js.html` is not included anywhere and duplicates theme
  resolution already present in `_includes/head.html`.
- Project, old-project, miscellaneous-list, and tag features are disabled but
  their data, includes, conditionals, and some styles remain.
- `_includes/date_and_social_share.html` no longer contains active social
  sharing; it retains commented Soopr markup.
- CSS utilities `.dashed`, `.text-bold`, and `hr.page-break` have no current
  source references.
- The `menu` and `wave-link` classes on the “See all posts” link have no current
  CSS definitions.
- `custom_head.html` is only a placeholder extension point.

**Impact**

Future maintainers must distinguish active behavior from inherited theme
scaffolding. Disabled features can drift and may not work cleanly if toggled
back on.

**Recommendation — small/medium effort, low risk**

- Decide that the current site, rather than the original theme's full option
  surface, is the source of truth.
- Remove unused includes, data, configuration keys, comments, classes, and CSS.
- Retain an extension point only when its intended use is documented.
- Rename `date_and_social_share.html` to reflect post metadata.
- If optional features are intentionally retained, test them and document them
  rather than leaving them dormant.

**Verify**

- Search confirms removed symbols have no references.
- Home, blog, post, about, portfolio, offline, and photo-essay generated
  structures remain unchanged.

### P2.2 — Reading metadata undercounts words

**Relevant standard:** accurate, self-explanatory content metadata.

**Evidence**

- `_includes/date_and_social_share.html:10-16` subtracts 180 before displaying
  the word count.
- The code adds 180 back only for the reading-time calculation.
- Posts below 180 words omit the metadata, and units are always plural.

**Impact**

Displayed word counts are 180 words too low, and the Liquid arithmetic is not
self-explanatory.

**Recommendation — small effort, low risk**

- Capture the actual `number_of_words` once.
- Display the actual count and calculate minutes with a clearly named words-per-
  minute constant or documented expression.
- Round short posts to a minimum of one minute and pluralize labels.

**Verify**

- Check representative posts below, near, and well above 180 words against an
  independent count.

### P2.3 — Standard pages have incomplete metadata

**Relevant standard:** maintainable templates, usable sharing and navigation.

**Evidence**

- `_includes/head.html` provides title, description, feed, and multilingual
  alternates but no standard canonical or Open Graph/Twitter metadata.
- `jekyll-seo-tag` is a direct dependency but `{% seo %}` is not used.
- Dynamic title and description output is not consistently escaped.
- `cv.md` has its own canonical because standard pages do not.

**Impact**

Search engines, link previews, and GoatCounter path normalization have less
reliable canonical information. Hand-maintained metadata duplicates capability
already present in the dependency set.

**Recommendation — medium effort, low visual risk**

- Prefer one metadata system: configure and use `jekyll-seo-tag`, or document
  why a custom implementation is necessary.
- Preserve the existing cleaned display title while escaping attribute values.
- Emit canonical URLs through `absolute_url`.
- Keep multilingual `hreflang` links, add an appropriate self-reference, and
  consider `x-default`.
- Remove the page-specific canonical workaround once the shared head owns it.

**Verify**

- Inspect generated home, normal post, translated post, photo essay, and redirect
  pages for one title, description, and canonical each.
- Validate shared links with representative social preview tools.

### P2.4 — URL and filtering conventions are inconsistent

**Relevant standard:** self-explanatory and reusable Jekyll code.

**Evidence**

- Some links use `relative_url`; others hard-code `/blog` or `/portfolio`, and
  translation links output raw `post.url`.
- The home list filters `item.category != 'hidden'`; the archive checks
  `post.categories contains "hidden"`.
- The translation block loops over the same collection to detect, count, and
  render alternatives.

**Impact**

The current root-domain deployment works, but a future `baseurl` or filtering
change can create inconsistent behavior. The translation template is longer
than the behavior requires.

**Recommendation — small effort, low risk**

- Use `relative_url` for internal links and `absolute_url` for metadata/feed
  URLs.
- Define visible posts once and reuse the same hidden-post rule.
- Build the alternative-translation collection once, then render it once.
- Keep language labels in a small data mapping if more translations are likely.

**Verify**

- Build once with the normal root configuration and once with a temporary
  non-empty base URL.
- Confirm home/archive visibility and all translation links.

### P2.5 — Ignored local files make builds non-reproducible

**Relevant standard:** predictable validation and narrow deployment scope.

**Evidence**

- `.gitignore` ignores `curriculum/`.
- Jekyll does not infer that exclusion from Git; the local build copied the
  directory and added several curriculum pages to `cache-list.json`.
- A clean GitHub checkout does not contain those files, so local and production
  output differ.

**Impact**

Local validation can test and precache pages that production can never build.
Running the development server can also expose ignored working files.

**Recommendation — completed as part of this audit documentation change**

- Add `curriculum`, `AGENTS.md`, and `CODE_AUDIT.md` to `_config.yml` `exclude`.
- Keep repository instructions and the audit in Git without publishing them as
  site assets.

**Verify**

- Confirm all three paths are absent from `_site` after a clean build.

### P2.6 — There is no automated quality gate

**Relevant standard:** maintainable changes and consistent validation.

**Evidence**

- `.github` contains funding configuration but no validation workflow.
- The README lists technology and ideas but not prerequisites, setup,
  validation, architecture, or publishing behavior.
- Link and image checks used for this audit are not saved or repeatable through
  one project command.

**Impact**

Build failures, broken internal links, placeholder alt text, and asset
regressions depend on manual review.

**Recommendation — medium effort, low risk**

- Add a GitHub Actions workflow using the GitHub Pages-compatible Ruby and
  dependency set.
- Run the Jekyll build, doctor, diff/format checks, internal-link validation,
  duplicate-ID detection, and image metadata checks.
- Add a small repository script for the generated checks so CI and local
  development use the same command.
- Document Ruby/Bundler requirements, `bin/bootstrap`, `bin/start`, validation,
  and the Turbo/service-worker architecture in the README.
- Add Lighthouse CI only after choosing stable budgets and a deployment/test
  URL; avoid a flaky aspirational threshold.

**Verify**

- A clean checkout passes locally and in CI.
- Deliberately broken fixtures make the expected check fail.

### P2.7 — Turbo is behind the current patch release

**Relevant standard:** maintained dependencies and predictable performance.

**Evidence**

- `_includes/head.html:61` pins Turbo 8.0.11.
- The current upstream release is 8.0.23 according to the
  [Turbo repository](https://github.com/hotwired/turbo).
- The Ruby lockfile itself matches the
  [GitHub Pages dependency versions](https://pages.github.com/versions/), so the
  Pages stack does not currently need a speculative upgrade.

**Impact**

The site misses later Turbo fixes, but an untested CDN URL/SRI change could alter
navigation behavior.

**Recommendation — small effort, medium regression risk**

- Review Turbo release notes from 8.0.12 through 8.0.23.
- Update the pinned URL and SRI hash together.
- Test initial load, internal navigation, Back/Forward, scroll restoration,
  anchors, theme state, analytics, offline fallback, and content transitions.
- Continue pinning an exact reviewed version.

**Verify**

- No console errors or duplicate lifecycle events across the navigation matrix.

## Priority 3 findings

### P3.1 — The CSS filename and ownership are unclear

`assets/css/converted-css.css` is well sectioned, but the name suggests generated
output and there is no source file or build step that explains what it was
converted from. Document that it is hand-maintained or rename it to a stable
site-oriented name. Keep the current token/component organization; splitting
1,160 lines into many files would add process without automatically improving
clarity.

Some selectors depend on a slug generated from the page title, such as
`.page-about` and `.page-you-are-offline`. Prefer an explicit, stable front
matter/body class for page-specific behavior so copy changes cannot silently
break styles.

### P3.2 — Minor head and runtime hygiene can be simplified

- `X-UA-Compatible` is obsolete for supported modern browsers.
- Service-worker registration logs successful registration on every full load;
  routine production logging is unnecessary.
- Theme values are repeated between CSS and JavaScript. Keep the small
  pre-paint script, but document the duplication or derive shared values at
  runtime where doing so does not reintroduce a flash.
- The image fade script does not establish a hidden initial state before the
  load event, so its visual value should be measured against its lifecycle
  complexity.
- Broken images are hidden and marked `aria-hidden`; ensure this does not conceal
  meaningful content or its surrounding link without an understandable
  fallback.
- `site.webmanifest` forces portrait orientation. Remove the restriction unless
  landscape use has been deliberately rejected.

### P3.3 — A few tracked assets appear orphaned

Repository searches found no active reference to:

- `assets/images/2025-06-09-how-to-follow-a-blog/how-to-follow-blog-4.png`
- `assets/images/CV-jan-balanya.jpg`
- `assets/images/ponpon.gif`
- Inter and Roboto Mono italic variable faces
- All static Inter and Roboto Mono faces

Confirm intended future use and history before deleting them. The three image
files account for roughly 700 KB; the unused fonts are the much larger gain.

### P3.4 — Configuration and development scripts retain theme-era details

- `_config.yml` contains a nonexistent `favicon: "./logo.png"`, remote-theme
  comments, and unused `back_home_text`/`show_copyright` options.
- Direct gem constraints duplicate versions already fixed by `github-pages`.
  They currently agree with the official Pages stack, so either keep them as
  explicit documentation or reduce the Gemfile to the dependencies the site
  intentionally owns.
- `bin/bootstrap` and `bin/start` work, but the README should explain them.
  Standardize the shell style and failure flags when those scripts are next
  touched.

## Recommended sequence

### Phase 1 — correctness and clarity

1. Consolidate Turbo initialization and remove unused form behavior.
2. Integrate GoatCounter with Turbo navigation.
3. Fix reading metadata.
4. Remove confirmed dormant includes, configuration, comments, and selectors.
5. Add repeatable generated-output checks and CI.

### Phase 2 — offline behavior and network weight

1. Redesign the service-worker cache strategy and test upgrade/offline paths.
2. Remove unused font files and move active UI/mono fonts to WOFF2 subsets.
3. Generate responsive photo sources and audit alternative text.

### Phase 3 — metadata and polish

1. Consolidate SEO/canonical metadata.
2. Normalize internal URL and post-filtering conventions.
3. Clarify CSS ownership and stable page hooks.
4. Review the remaining low-priority head, manifest, script, and asset cleanup.
5. Run live Lighthouse and browser/device checks, then set evidence-based
   performance budgets.

## Suggested success measures

- One initialization pass and one analytics request per intended Turbo visit.
- First-visit service-worker installation precaches only a documented small
  shell and remains recoverable after a failed deployment.
- No unbounded runtime cache.
- Tracked font size reduced from roughly 22 MB to only the licensed web assets
  actually used; transferred font bytes measured and reduced.
- Mobile photo-essay transfers use viewport-appropriate sources.
- No placeholder or accidental missing image alternatives.
- No unused includes/configuration retained without documentation.
- One local command and one CI job reproduce the repository's required checks.
- No visual or content regression in home, archive, standard post, translated
  post, about, portfolio, offline, 404, feed, or photo-essay output.

## External references

- [GitHub Pages dependency versions](https://pages.github.com/versions/)
- [Turbo repository and releases](https://github.com/hotwired/turbo)
- [GoatCounter JavaScript API](https://www.goatcounter.com/help/js)
- [GoatCounter SPA integration](https://www.goatcounter.com/help/spa)
