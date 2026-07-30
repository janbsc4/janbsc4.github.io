# Personal Blog

Built with:

- [Jekyll](https://github.com/jekyll/jekyll) Page Builder
- [Turbo Drive](https://github.com/hotwired/turbo)
- [Goatcounter](https://www.goatcounter.com)
- Hosted on [Github Pages](https://pages.github.com)

## Local development

Install the Ruby dependencies:

```sh
bin/bootstrap
```

Start the local Jekyll server at `http://localhost:4000`:

```sh
bin/start
```

Arguments are forwarded to Jekyll, so options such as `bin/start --drafts` work
as expected.

Before publishing a change, run:

```sh
bundle exec jekyll build --trace
git diff --check
```

## Development Ideas

- [X] Automatic dark/light theme
- [X] Add images
- [X] Add img loading placeholders
- [X] Implement Turbo Drive
- [X] Fix CSS page transitions
- [X] Offline support: service worker & manifest
- [ ] Achieve a 95+ Lighthouse score across the board
- [X] Consolidated Gemfile (No Gemspec Dependency)

## Writing Ideas

- [ ] Instant noodle ranking post
