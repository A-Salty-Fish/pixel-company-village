# Security

This open-source tree uses placeholders only.

## What is not in git

- Site password and ingest secret. Copy `.env.example` to `.env.local` and generate your own.
- Hosting tokens, Redis, Blob, or KV credentials.
- Private chat URLs, admin notes, personal email, and SSH hosts.
- A real colleague roster. The committed seed is fictional (`data/demo/`).

If a password, bearer token, or roster ever showed up in chat, a deploy log, or an older commit, rotate it on the host. Do not copy it back into the repo. Publishing this branch's older history as-is would republish data that this tree has since removed. For a public repository, export the current tree (or squash onto a new root) instead of pushing the unfiltered history.

## Runtime

- Login sets an httpOnly session cookie. The ingest route checks `INGEST_SECRET` and does not accept the site password.
- Score JSON is an allowlist: display name, date, `work`, `fish`, `on_task`, message **count**, `scored`, and a short tag. Chat text is rejected.
- Kindness, waves, comfort settings, the 30-day history strip, and Wave C play state (visit calendar, stickers, quotes, props, feathers, garden layer, anonymous coffee marks) stay in this browser. They are not a shared server quota.
- The anonymous-feed key stores only a date and display names. It does not store who sent the coffee. The sender's own kindness ledger still records the quota spend under `village:viewer:<display name>:kindness`.
- No Redis, Blob, or KV.

## Operator data

Production can load a private roster with `VILLAGE_ROSTER_B64` and `VILLAGE_SEED_B64` (base64 JSON, server environment only). Keep the source files in `data/private/`, which is gitignored. Do not put those values in a committed workflow file.
