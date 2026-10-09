# Security and privacy

These mods keep a few lines of text above the prompt in Claude Code. They store that text, so a privacy problem matters as much as a security one.

## Reporting a problem

- Open an issue with the **Bug report** template, or contact the maintainer directly if it could expose someone's data.
- **Never paste real conversations, tokens or file paths** into an issue, a pull request or a comment.

## What counts

- Anything that makes a mod send data over a network, or imports a networking library.
- Anything that stores pinned text outside the session, or somewhere the user did not choose.
- A mod that reads files, tools or settings it does not need.

## What the mods do and don't do

- A pin lives in the session's memory (`$.state`). Nothing is written to disk by the mods themselves, and nothing is sent anywhere.
- `pin-ask` registers two tools for the model (`pin` and `unpin`). They only change what is drawn above the prompt.
- The text you pin can be a reply of up to 8,000 characters (`pin-click`). It stays in the session.

## Supported versions

Only the latest release is supported. This is an experiment (version 0.x), maintained by one person, so replies can take a few days.
