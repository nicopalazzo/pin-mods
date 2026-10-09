# Changelog

All notable changes to pin-mods. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [0.1.1] - 2026-10-09

### Changed

- Each mod's manifest now declares the MIT licence, matching the `LICENSE` file, so a tool reading the manifest knows it. Versions bumped because Claude Code only picks up a change when the version changes.

## [0.1.0] - 2026-10-09

### Added

- `pin`: `/pin` keeps the last answer's steps (or the text you type) above the prompt; `/unpin` removes it. Long lines wrap inside a row budget.
- `pin-click`: a "Pin steps" button under replies that have steps. The band can show the full original reply, and "Find in chat" tries to scroll to the reply, or copies a short search phrase for the app's find. `/pin-goto` does the same from the keyboard.
- `pin-ask`: Claude pins a short checklist when asked, and each line can be ticked off in the band.
- A marketplace file listing the three mods, a check script (`scripts/check.sh`), and gitleaks secret scanning before every commit.

### Known limits

- The desktop app refuses to scroll the chat for a plugin ("transcript not scrollable here").
- The Claude iPhone app did not draw anything from a plugin in a test on 9 Oct 2026.
- Codex has no equivalent screen, so these mods are Claude Code only.
