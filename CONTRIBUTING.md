# Contributing

Small experiments, kept tidy.

## Rules that come first

- **Local only.** No network code, no accounts. A pin lives in the session (or a local file the user can delete).
- **No secrets and no real conversations** in the repository. gitleaks scans staged changes before every commit.
- **Keep what you pin small.** The band lives in the chat column and never pushes the typing area off-screen.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): imperative summary`, 72 characters at most, no final period. The body explains why.

- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- Scopes: `pin`, `pin-ask`, `marketplace`.
- One logical change per commit.
- Credit AI pair programming with a `Co-Authored-By` trailer.

## Workflow

1. Branch from `main`: `feat/<topic>`, `fix/<topic>`, `docs/<topic>` or `chore/<topic>`.
2. Run `scripts/check.sh` (needs the `claude` CLI). It validates the marketplace and each mod, then runs each mod's tests. CI runs the cheaper `scripts/check_repo.py` and a secret scan, because it cannot run the `claude` CLI.
3. Try the change in a live Claude Code session and say which surface (terminal, desktop app).
4. Open a pull request, squash-merge, delete the branch. For a release, update `CHANGELOG.md`, bump the mod's version in its `plugin.json` (Claude Code only picks up a change when the version changes), and tag `vX.Y.Z`.

## One-time setup

```bash
brew install gitleaks pre-commit
pre-commit install
```
