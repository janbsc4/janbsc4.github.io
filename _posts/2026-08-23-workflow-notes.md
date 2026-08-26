---
layout: post
title: "Workflow Notes"
post_type: guide
description: "A private cheat sheet of terminal commands I keep forgetting."
categories: [hidden]
---

This page is my cheat sheet. It is hidden from the blog, the feed, and the sitemap, so nobody stumbles into it but me. When I forget a command for the tenth time, it lands here.

## Fresh Mac setup

A wiped Mac needs one install before anything else: Homebrew. Everything after that comes from it.

```zsh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

The installer offers to fetch the Xcode command line tools, let it. When it finishes it prints two lines that add `brew` to the PATH. Run them, or nothing installed later will resolve in the terminal.

### Bulk install

Formulae are terminal tools. Install the four I use on every Mac in one command:

```zsh
brew install git gh mise uv
```

Casks are regular Mac apps. Homebrew can install those together too:

```zsh
brew install --cask \
  bitwarden \
  flux-markdown \
  hyperkey \
  maccy \
  netnewswire \
  obsidian \
  spotify \
  sublime-merge@dev \
  sublime-text \
  t3-code \
  vlc \
  zotero
```


### Git and gh

```zsh
gh auth login
```

`gh auth login` asks a few questions: pick GitHub.com and HTTPS, then sign in through the browser with the one-time code. Choosing HTTPS also lets gh teach git to push without any extra credential setup. Then stamp every commit with an identity, one line each:

```zsh
git config --global user.name "janbsc4"
```

```zsh
git config --global user.email "me@example.com"
```

Clone my three development repositories into the root of my home folder:

```zsh
for repo in dev janbsc4.github.io yuwenke; do gh repo clone "janbsc4/$repo" "$HOME/$repo"; done
```

### mise

```zsh
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

That line makes zsh start mise on every launch.

```zsh
exec zsh
```

Restarts the shell so the change takes effect right now.

```zsh
mise use -g node@latest ruby@latest python@latest
```

This installs the current Node.js, Ruby, and Python releases and records them as global fallbacks. Those are the three runtimes I use often enough to want available on a fresh Mac. The `-g` flag puts the choices in mise's global config, so they apply everywhere until a project supplies its own `mise.toml`. That project file always wins. This website, for example, pins Ruby 3.3 because the `github-pages` gem refuses Ruby 4. The first Ruby installation may compile from source, so it can take a few minutes. That mismatch is exactly the situation mise exists for and the whole story in [Of Mise and Men]({{ '/of-mise-and-men' | relative_url }}).

### Preferences

System Settings renames things every year or so. As of writing: tap-to-click sits in the Trackpad pane, display-off timers sit under Lock Screen, and the dim-on-battery switch keeps moving or vanishing entirely, at which point only the last command below still works.

Keep folders above files in Finder windows when sorting by name:

```zsh
defaults write com.apple.finder _FXSortFoldersFirst -bool true
killall Finder
```

The first command changes the global Finder preference. The second restarts Finder so open windows pick it up immediately.

Show hidden files in Finder:

```zsh
defaults write com.apple.finder AppleShowAllFiles -bool true
killall Finder
```

Finder remembers this setting after restarts. Press `Command-Shift-.` if I only want to toggle hidden files temporarily.

Tap counts as a click on the trackpad:

```zsh
defaults write com.apple.AppleMultitouchTrackpad Clicking -bool true
```

On battery, sleep the display after fifteen minutes and the Mac after forty-five:

```zsh
sudo pmset -b displaysleep 15 sleep 45
```

On power, give the display thirty minutes:

```zsh
sudo pmset -c displaysleep 30
```

And never dim it to save battery:

```zsh
sudo pmset -b lessbright 0
```

## A new repo, start to finish

The whole dance at a glance:

```zsh
mkdir my-project
cd my-project

git init
smerge .

# build stuff...

git add .
git commit -m "Initial commit"

gh repo create
```

Each step on its own, ready to copy.

`mkdir my-project` makes the folder:

```zsh
mkdir my-project
```

`cd my-project` steps into it:

```zsh
cd my-project
```

`git init` turns the folder into a repository by creating a `.git` directory inside. Once per project:

```zsh
git init
```

`smerge .` opens Sublime Merge in the current directory, ready for when there is something to stage:

```zsh
smerge .
```

Build your thing. Files land in the folder. When there is something worth keeping, `git add .` stages every new and changed file in the project:

```zsh
git add .
```

`git commit -m "Initial commit"` records the staged snapshot in history:

```zsh
git commit -m "Initial commit"
```

Finally `gh repo create` creates the GitHub side. It asks for a name and whether the repo is public or private, then offers to push. It needs a GitHub login, so `gh auth login` comes first, once per machine:

```zsh
gh repo create
```

The interactive prompts get old fast. This variant does everything in one shot:

```zsh
gh repo create my-project --private --source=. --remote=origin --push
```

It creates the remote, connects it as `origin`, and pushes the local commits.

One thing I used to skip: if the project needs Ruby or Python, pin the version with mise before installing anything. Otherwise every tool lands on whatever the system happens to run. I wrote up how that works in [Of Mise and Men]({{ '/of-mise-and-men' | relative_url }}).

## Useful commands to remember

### Restore my coding setup

On a new Mac, follow the instructions in [janbsc4/dev](https://github.com/janbsc4/dev) to restore my coding skills and development setup.

### Open the current folder in Sublime Text

```zsh
subl .
```

The dot means "right here", so this opens the terminal's current folder in Sublime Text. `subl file.md` opens one file, while `subl ~/notes` opens another folder without changing directories first.

### Open the current repository in Sublime Merge

```zsh
smerge .
```

This opens the current folder in Sublime Merge so I can inspect changes, stage files, and review commit history.

If zsh cannot find either command, create symlinks to the executables inside the application bundles:

```zsh
ln -s "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/subl
ln -s "/Applications/Sublime Merge.app/Contents/SharedSupport/bin/smerge" /usr/local/bin/smerge
```

### Upgrade everything installed through Homebrew

```zsh
brew upgrade --greedy
```

This upgrades outdated formulae and casks. The `--greedy` flag also includes casks marked `latest` and apps that normally update themselves, which Homebrew would otherwise skip.
