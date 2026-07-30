# Repository Guidelines

This repository is a personal Jekyll blog hosted on Github Pages and long-form publication. Treat
performance, usability, accessibility, and the reading experience as primary
product requirements.

## Design and user experience

- Preserve the site's restrained editorial identity and established visual
  language unless a redesign is explicitly requested.
- Keep typography readable, line lengths comfortable, navigation clear, and
  layouts responsive across mobile and desktop screens.
- Use semantic HTML and accessible interaction patterns. Preserve keyboard
  navigation, visible focus states, meaningful labels, and sensible document
  structure.
- Prefer progressive enhancement. Core content and navigation should remain
  usable if optional JavaScript, Turbo, or offline features are unavailable.

## Performance

- Keep pages lightweight. Avoid unnecessary JavaScript, CSS, dependencies, and
  oversized media.
- Reuse existing Jekyll layouts, includes, data, and styles before introducing
  new abstractions.
- Optimize images and other assets appropriately, and avoid changes that delay
  rendering or make navigation feel slower.

## Maintainability

- Write code that is ideally self-explanatory: use clear names, small cohesive
  changes, and straightforward control flow.
- Avoid duplication and remove obsolete supporting code when replacing a
  feature.
- Add comments only when they explain non-obvious intent or constraints rather
  than restating the code.
- Keep changes narrowly scoped and preserve published content unless content
  editing is explicitly requested.

## Validation

For applicable changes:

- Run `bundle exec jekyll build --trace`.
- Run `git diff --check`.
- Inspect the generated HTML for affected pages and confirm that unrelated page
  types retain their expected structure and presentation.
