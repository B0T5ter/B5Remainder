# B5remainder - security notes

This repository is safe to publish on GitHub if the following rules are kept:

- Sensitive values are kept in `.env` only.
- `.env` is ignored by Git via `.gitignore` and is not tracked in this repo.
- A sample `.env.example` is included with dummy placeholder values.

## What happens here

- `docker-compose.yml` uses environment variables for database and SMTP credentials.
- The backend loads `MAIL_USER` and `MAIL_PASSWORD` from `.env`.
- The application does not hardcode real email or database secrets in tracked files.

## Cybersecurity reminders

- Do not commit `.env` to GitHub.
- Do not share the real `MAIL_PASSWORD` or database password publicly.
- Use a Gmail app password for SMTP, not your normal account password.
- If `.env` is ever added by mistake, remove it with:
  ```bash
  git rm --cached .env
  ```

## Safe to publish

Yes — the repository is safe to publish now, as long as `.env` remains local and untracked.
