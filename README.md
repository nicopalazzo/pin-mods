# pin-mods

Long Claude Code chats bury the steps you're meant to follow. pin-click adds a 📌 Pin steps button under any reply that has steps.

![A reply with four steps and the Pin steps button under it](docs/pin-click-button.png)

One click keeps them above the prompt while the chat scrolls:

![The pinned steps in a band above the prompt](docs/pin-click-band.png)

Everything stays in your session, on your computer. Nothing is sent anywhere.

## Install pin-click

    claude plugin marketplace add nicopalazzo/pin-mods
    claude plugin install pin-click@pin-mods

Start a new session. The button appears under replies with a numbered or bulleted list, or with a table followed by a call to action ("Next", "Your turn", ❓, 🎯). In the band: "Original" shows the full reply; "Find in chat" copies a search phrase for the app's find (Cmd+F).

## Other ways to pin

| Mod | When to use it |
|---|---|
| `pin` | You prefer typing: `/pin` keeps the last reply's steps, `/pin your text` keeps your own |
| `pin-ask` | You want Claude to write the checklist: say "pin the steps", then tick lines off |

Only one band shows at a time. Unpin one before trying another.

## Known limits (tested 9 Oct 2026)

- The desktop app doesn't let a plugin scroll the chat, so "Find in chat" falls back to copying a phrase.
- The Claude iPhone app draws nothing from a plugin.
- Claude Code only; Codex has no equivalent screen.

## Check

    scripts/check.sh

Validates the marketplace and each mod, then runs their tests (needs the `claude` CLI). See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT. See [LICENSE](LICENSE).
