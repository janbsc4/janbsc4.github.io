---
layout: post
title: "Of Mise and Men"
post_type: guide
description: "Use mise to manage Ruby, Python, Node.js, and Java versions per project on macOS."
---

I just tried to build this website with Ruby 4. Bundler refused. The `github-pages` gem requires Ruby 2.6 or newer, but lower than Ruby 4.

Downgrading Ruby across my Mac would fix one project and risk breaking another. [Mise](https://mise.jdx.dev/) offers a better way. It manages language versions per project without touching the runtimes installed elsewhere on the Mac.

For the projects in this guide, mise manages every runtime I need:

- Ruby
- Python
- Node.js
- Java

Mise supports many more runtimes and command-line tools through its [registry](https://mise.jdx.dev/registry.html), but these four cover the examples below.

As Stanley Ulili writes in [a comparison of mise and rbenv](https://betterstack.com/community/guides/scaling-ruby/mise-vs-rbenv/):

> Rather than learning different commands for rbenv, nvm, pyenv, and other tools, Mise uses consistent syntax across all languages. This reduces the mental overhead of switching between project types.

Install it with Homebrew and activate it in Zsh:

```zsh
brew install mise
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
exec zsh
```

Mise can manage the default Node.js, Ruby, and Python versions across the Mac too:

```zsh
mise use -g node@latest ruby@latest python@latest
```

The `-g` flag makes these the global defaults. Projects can still override any of them with their own versions. For this website, I choose Ruby 3.3 inside the project:

```zsh
cd project-folder
mise use ruby@3.3
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

I found mise because an AI suggested it while I was trying to untangle the Ruby 4 failure. I am very happy it did. Before this, I used a different version manager for each programming language. The managers, configuration files, and commands piled up until the whole setup became messy. Mise is so much better. I now have one command and one configuration format for all of them.
