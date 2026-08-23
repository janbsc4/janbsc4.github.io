---
layout: post
title: "Of Mise and Men"
post_type: guide
description: "Use mise to manage Ruby, Python, Node.js, and Java versions per project on macOS."
---

I just tried to build this website with Ruby 4. Bundler refused. The `github-pages` gem requires Ruby 2.6 or newer, but lower than Ruby 4.

Downgrading Ruby across my Mac would fix one project and risk breaking another. [Mise](https://mise.jdx.dev/) offers a better way. It manages language versions per project without touching the runtimes installed elsewhere on the Mac.

As Stanley Ulili writes in [a comparison of mise and rbenv](https://betterstack.com/community/guides/scaling-ruby/mise-vs-rbenv/):

> Rather than learning different commands for rbenv, nvm, pyenv, and other tools, Mise uses consistent syntax across all languages. This reduces the mental overhead of switching between project types.

Install it with Homebrew and activate it in Zsh:

```zsh
brew install mise
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
exec zsh
```

Then choose a Ruby version inside the project:

```zsh
cd /Users/jan/janbsc4.github.io
mise use ruby@3.3
gem install bundler -v 2.6.3
bundle install
bundle exec jekyll serve
```

`mise use ruby@3.3` records the choice in the project. When I enter this website's directory, mise selects Ruby 3.3. Other projects can keep using Ruby 4 or any version they need.

Python projects have a second problem. They often need a specific Python version and an isolated set of packages. Mise can manage both. A `mise.toml` file can contain:

```toml
[tools]
python = "3.13"

[env]
_.python.venv = { path = ".venv", create = true }
```

With mise active, entering that directory selects Python 3.13 and creates or activates `.venv`. Packages installed there stay separate from other projects. Another directory can use Python 3.12 and its own virtual environment.

Mise also helps when one project needs more than one runtime. [Yuwenke](https://github.com/janbsc4/yuwenke), my Chinese flashcard app, needs Node.js 22 or newer. Its Firebase Firestore rules tests also need Java 21. Both versions fit in the same `mise.toml` file:

```toml
[tools]
node = "22"
java = "21"
```

After running `mise install`, entering the Yuwenke directory selects both runtimes. I can run the app and its Firestore rules tests without checking which Node.js or Java version my terminal picked up. The repository carries that information with it.
