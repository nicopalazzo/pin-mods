# pin-mods

Three small Claude Code mods that keep a few lines pinned above the prompt while a long chat scrolls. Built 9 Oct 2026 as an experiment, separate from Mirror. Everything stays in the session and on your computer; nothing is sent anywhere.

| Mod | What it does | Try |
|---|---|---|
| `pin` | `/pin` keeps the last answer's steps (or the text you type); `/unpin` removes it | `/pin`, `/pin your text` |
| `pin-click` | A "Pin steps" button under replies that have steps; "Original" shows the full reply in the band; "Find in chat" copies a search phrase for the app's find | click the button under a reply |
| `pin-ask` | Ask Claude to pin a checklist; tick lines off in the band | "pin the steps" |

Known limits (tested 9 Oct 2026): the desktop app refuses to scroll the chat for a plugin ("transcript not scrollable here"); the Claude iPhone app did not draw anything from a plugin; Codex has no equivalent screen.

Install from a terminal:

    claude plugin marketplace add "<this folder>"
    claude plugin install pin@pin-mods
    claude plugin install pin-click@pin-mods
    claude plugin install pin-ask@pin-mods

Only one band shows at a time: if two mods have something pinned, the first in line draws. Unpin one before trying another.

## Check

    scripts/check.sh

Validates the marketplace and each mod, then runs each mod's tests (needs the `claude` CLI). See [CONTRIBUTING.md](CONTRIBUTING.md) for the commit and branch conventions.

## Licence

MIT. See [LICENSE](LICENSE).
