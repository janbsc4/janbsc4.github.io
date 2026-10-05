# frozen_string_literal: true

source "https://rubygems.org"

# Plain Jekyll instead of the github-pages meta-gem. The meta-gem hard-pins
# jekyll-remote-theme 0.4.3, which caps rubyzip below the patched 3.x line
# and keeps CVE-2026-85396 (high-severity path traversal) in the dependency
# tree. This site uses no remote theme, so that dependency is not needed.
# These versions match what GitHub Pages builds with, so local previews are
# faithful to production.
gem "jekyll", "~> 3.10.0"
gem "kramdown", "~> 2.4"
gem "kramdown-parser-gfm", "~> 1.1"
gem "rouge", "~> 3.3"
gem "jekyll-feed", "~> 0.17"
gem "jekyll-sitemap", "~> 1.4"
