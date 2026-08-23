---
layout: post
title: "Of Mise and Men"
post_type: guide
description: "Use mise to manage Ruby, Python, Node.js, and Java versions per project on macOS."
---

I tried to build this website with Ruby 4. Bundler refused. The `github-pages` gem requires Ruby 2.6 or newer, but lower than Ruby 4.

Downgrading Ruby across my Mac would fix this project, but it could break another one. The Ruby error was also one example of a bigger problem. I used a different version manager for each programming language. Each manager had its own commands and configuration files, and the whole setup got messy.

I needed one tool that could manage all those versions without forcing every project to use the same ones.

## The One version manager

[Mise](https://mise.jdx.dev/) does that. It can set default runtime versions across my Mac, then override them inside individual projects. Entering a project directory automatically selects the versions that project needs.

For the projects in this guide, mise manages every runtime I use:

- Ruby
- Python
- Node.js
- Java

Mise supports many more runtimes and command-line tools through its [registry](https://mise.jdx.dev/registry.html), but these four cover my examples.

As Stanley Ulili writes in [a comparison of mise and rbenv](https://betterstack.com/community/guides/scaling-ruby/mise-vs-rbenv/):

> Rather than learning different commands for rbenv, nvm, pyenv, and other tools, Mise uses consistent syntax across all languages. This reduces the mental overhead of switching between project types.

## Install mise

Install mise with Homebrew and activate it in Zsh:

```zsh
brew install mise
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
exec zsh
```

The activation line lets mise change the active runtimes whenever I move between project directories.

## Set global defaults

I can let mise manage the default Node.js, Ruby, and Python versions across my Mac:

```zsh
mise use -g node@latest ruby@latest python@latest
```

The `-g` flag makes these the global defaults. They apply when a project does not specify another version.

## Override a version for one project

This website cannot use Ruby 4 yet, so I set Ruby 3.3 inside its directory:

```zsh
cd project-folder
mise use ruby@3.3
```

`mise use ruby@3.3` records the choice in the project. When I enter this website's directory, mise selects Ruby 3.3. Other projects can keep using Ruby 4 or any version they need. The project carries its requirement instead of relying on me to remember it.

## Give Python its own environment

Python projects have a second problem. They often need a specific Python version and an isolated set of packages. Mise can manage both. A `mise.toml` file can contain:

```toml
[tools]
python = "3.13"

[env]
_.python.venv = { path = ".venv", create = true }
```

With mise active, entering that directory selects Python 3.13 and creates or activates `.venv`. Packages installed there stay separate from other projects. Another directory can use Python 3.12 and its own virtual environment.

## Manage several runtimes in one project

Some projects need more than one runtime. [Yuwenke](https://github.com/janbsc4/yuwenke), my Chinese flashcard app, needs Node.js 22 or newer. Its Firebase Firestore rules tests also need Java 21. Both versions fit in the same `mise.toml` file:

```toml
[tools]
node = "22"
java = "21"
```

After running `mise install`, entering the Yuwenke directory selects both runtimes. I can run the app and its Firestore rules tests without checking which Node.js or Java version my terminal picked up.

## Why I am keeping it

I found mise because an AI suggested it while I was trying to untangle the Ruby 4 failure. I am very happy it did. Instead of separate version managers with different commands and configuration files, I now have one interface for all these runtimes. Each project still gets exactly the versions it needs. It is so much better than my previous setup.
