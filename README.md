# Skill Stack

Install and manage the same set of skills for multiple coding agents on a new machine.

Skill Stack installs skills for Codex, Pi, Hermes, and Claude Code through `npx skills`. The skills CLI manages sources and links through `~/.agents/skills`.

The research for [Issue #4](https://github.com/PeeraphatN/skill-stack/issues/4) is documented in [MVP skill installation methods and compatibility](docs/install-methods.md), including commands, skill names, and upstream evidence. The tested CLI version supports `codex`, `pi`, `hermes-agent`, and `claude-code`. Codex and Pi read `~/.agents/skills` directly. Hermes uses `~/.hermes/skills`, while Claude Code uses `~/.claude/skills`.

## Problem

Setting up a new machine means installing skills one by one. Installation methods vary between skills, and paths or commands may differ across operating systems.

## Goals

- Install regularly used skills with one command.
- Support Linux, macOS, and Windows.
- Target Codex, Pi, Hermes, and Claude Code.
- Keep the selected skills in one manifest.
- Let the skills CLI manage links.
- Add personal skills later.
- Publish personal skills publicly so they can be installed through `npx skills`.

## MVP

The MVP started with repositories that work directly with `npx skills add`:

- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop)
- [mattpocock/skills](https://github.com/mattpocock/skills)
- [thananon/9arm-skills](https://github.com/thananon/9arm-skills)

Issue #11 added four more sources. Skill Stack installs only the selected skills through `npx skills`; it does not run upstream plugins, hooks, or setup steps. See [Adapter behavior and limitations](docs/adapters.md):

- [trailhq/Trail-Code](https://github.com/trailhq/Trail-Code)
- [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)
- [Ar9av/obsidian-wiki](https://github.com/Ar9av/obsidian-wiki)
- [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)

## How it works

```text
skill-stack repository
        |
        v
  install.mjs
        |
        v
npx skills add --global
        |
        v
~/.agents/skills/<skill>
        |
        v
Codex / Pi read directly
Hermes reads through ~/.hermes/skills/<skill>
```

Skill Stack does not manage links itself. The skills CLI owns global skills and agent destinations.

## Project structure

```text
skill-stack/
├── manifest.json
├── install.mjs
├── install.sh
├── install.ps1
└── README.md
```

## Manifest

[manifest.json](manifest.json) selects 29 skills from eight repositories for `codex`, `pi`, `hermes-agent`, and `claude-code`. Each repository entry lists the exact skills to install. See the [manifest contract](docs/manifest.md) and [adapter limitations](docs/adapters.md).

Validate the manifest and run the tests with Node.js 22.20.0 or later:

```bash
node scripts/validate-manifest.mjs
node --test
```

## Install skills

```bash
node install.mjs
```

On Linux or macOS, use the shell wrapper:

```sh
./install.sh
# or
sh install.sh
```

From another directory, run `sh "/path/to/skill-stack/install.sh"` with the real checkout path. The wrapper runs the adjacent `install.mjs` and returns the same exit code. Node.js must be available in `PATH`.

On Windows, use the PowerShell wrapper:

```powershell
.\install.ps1
```

From another directory, run `& 'C:\path with spaces\skill-stack\install.ps1'`. The wrapper runs the adjacent `install.mjs` and returns the same exit code. `node` must be available in `PATH`.

If the execution policy blocks scripts, run `node 'C:\path with spaces\skill-stack\install.mjs'` instead. See the [installer guide](docs/installer.md).

A future release may support direct package execution:

```bash
npx github:<owner>/skill-stack
```

The installer can run by absolute path from any directory because it resolves the manifest next to its own script.

Check installed skills without downloading or changing anything:

```bash
node install.mjs status
```

Update only manifest skills that are already installed for every configured agent:

```bash
node install.mjs update
```

See the [installer guide](docs/installer.md) for verification, repeat runs, and troubleshooting.

## Requirements

- Node.js 22.20.0 or later, with npm and npx in `PATH`.
- Git in `PATH`, with access to the npm registry and public GitHub repositories.
- Write access to the current user's home directory and agent destinations.

The installer runs `skills@1.7.2` through npx, so the skills CLI does not need to be installed separately.

On Windows, the Node.js/npm installation must provide `node_modules/npm/bin/npm-cli.js` and `npx-cli.js` next to Node or within a directory in `PATH`. This lets the installer invoke npm without a shell.

## Roadmap

1. Document installation methods and supported agent names (done).
2. Add `manifest.json` and `install.mjs` (done).
3. Add shell and PowerShell wrappers (done).
4. Add `status` and `update` commands (#10) (done).
5. Add selected skills from Trail-Code and three other sources (#11) (done, skills only).
6. Test installation on all three operating systems and confirm agent discovery (#9) (incomplete).
7. Test frontend skills on real projects before adding them to the manifest (planned after v1).
8. Add and publish personal skills through `npx skills` (not started).

### Frontend skills after v1

The NIGHTSHIFT showcase turned out well, but one experiment is not enough to show which skills are worth keeping for real work. These repositories are therefore not in `manifest.json`:

- [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill): find and maintain a visual direction.
- [jman528/design-extract-designlang](https://github.com/jman528/design-extract-designlang): extract a design language from references.
- [philotheephilix/reactbits.dev-skill](https://github.com/philotheephilix/reactbits.dev-skill): select and adapt React Bits components.
- [greensock/gsap-skills](https://github.com/greensock/gsap-skills): plan motion with GSAP and ScrollTrigger.
- [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli): test UI and browser interactions.
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable): design, review, and polish frontend work.
- [jakubantalik/transitions.dev](https://github.com/jakubantalik/transitions.dev): design transition patterns.

Before adding any of them, test them on several real projects, verify their installation methods and skill names, and keep only those that add distinct value. Track the results in [Issue #12](https://github.com/PeeraphatN/skill-stack/issues/12).

## Status

The product requirements and MVP acceptance criteria are in the [PRD](docs/PRD.md).

The manifest, validator, installer, and `status`/`update` commands have automated tests. [Issue #9: cross-platform validation](docs/cross-platform-validation.md) records macOS and Windows results for the earlier 23-skill manifest. The current 29-skill manifest still needs native Linux testing and discovery checks inside the agents, so cross-platform acceptance is incomplete.

The system requirements and MVP acceptance criteria are in the [SRS](docs/SRS.md) for [Issue #3](https://github.com/PeeraphatN/skill-stack/issues/3).
