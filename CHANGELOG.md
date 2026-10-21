# Changelog

All notable changes to pin-mods. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `pin` 0.4.0: the shelf is the source of truth. A new tool, `pin_from_shelf`, lets Claude show a Steps shelf entry in the pin with its ticks. A shelf-linked pin says "on the shelf", its ticks are read-only, and its button becomes "↻ Shelf", which asks Claude to read the entry again and refresh the pin. The pin cannot read the shelf itself (it needs the person's sign-in), so it follows only when Claude refreshes it. The "➕ Shelf" button now also asks Claude to link the pin to the new entry.

- `pin` 0.3.0: tick lines off in the band (☐ / ☑), and a "➕ Shelf" button that types "Add these steps to the shelf" with the pinned lines into the prompt, ticked ones marked `[x]`. It needs the Steps shelf plugin; the pin does not read the shelf back, so a tick made on the shelf does not show on the pin.

### Changed

- `pin` 0.2.0 now holds what `pin-click` did: the "📌 Pin steps" button under replies, "↩ Original", "🔎 Find in chat" and `/pin-goto`, plus step detection for tables. `/pin` keeps the original reply too, so "Original" works for it. It could only reach the last reply before; the button reaches any reply. `pin-click` 0.1.5 is a pointer to `pin` and is no longer listed in the marketplace.
- Why: two plugins drew two different bands, and a user could not tell which to use.

### Fixed

- `pin`: `/pin` and `/unpin` are registered again after `/clear` or `/resume`. They were registered only at session start, so after `/clear` the app could answer "/pin isn't a command here". `pin-ask` has the same pattern, not yet fixed.

## [0.1.4] - 2026-10-14

### Fixed

- `pin`, `pin-click`: an opened band now shows every pinned line. It used to stop at the row budget, so "more" never revealed a long list. A list taller than the band now scrolls in Claude Code's own window. Bumped to `pin` 0.1.3 and `pin-click` 0.1.4.
- `pin-ask`: the checklist shows every line rather than cutting at "… N more", so every line can be ticked off. Bumped to 0.1.2.

## [0.1.3] - 2026-10-13

### Changed

- `pin-click`: a reply whose steps are in a table now gets the "Pin steps" button, but only when a call to action (❓, 🎯, 📍, ✍️, "Your turn", "Your call", "Next") comes after the table. A table you only read stays without a button. Each row is pinned as "first cell → other cells". Only the `pin-click` mod is bumped.

## [0.1.2] - 2026-10-09

### Fixed

- `pin`: `/pin 1. a 2. b 3. c` now shows three lines, not one long line. It splits only where the numbers count up from 1 in order, so ordinary sentences with numbers stay whole. Only the `pin` mod is bumped.

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
