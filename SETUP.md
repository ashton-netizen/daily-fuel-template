# Setting up your Daily Fuel

About twenty minutes, most of it the interview. You do very little; Claude does the building.

## Before you start

You need the **Claude desktop app** with the **Code tab**, signed in to a plan that includes artifacts. That is where your private
page will live. Then, optionally:

- **Google Calendar and Gmail connected in Claude**, so the page can show your day and what needs you. Without them the
  page still works; those two panels are simply hidden.
- **A Google account** for the optional morning email.
- **GitHub** for a private history of your days and for picking up updates to the template.

## The steps

1. **Copy the template.** On the template's GitHub page click **Use this template**, make it **private**, and clone or download it.
   Or download the ZIP.
2. **Open the folder in the Claude desktop app** (Code tab).
3. **Paste the prompt** from [`setup/master-prompt.md`](setup/master-prompt.md).
4. **Answer the ten questions.** Plain conversation. Skip anything you want to leave blank. Nothing is made up for you.
5. **Claude builds, publishes and checks your page**, then gives you the link. It is private to you.
6. **The first time you open it,** the page asks permission to read your calendar and inbox. That is your choice. It stores none of it.
7. **Optional, one at a time:** the morning email, and the private history.

## What only you can do

| Step | Why it has to be you |
|---|---|
| Connect Gmail and Calendar in Claude | They are your accounts. |
| Approve the page's permissions on first open | Your consent, per connector. |
| The morning email: create the Apps Script project, run `install()`, approve | It runs in your own Google account. |
| `gh auth login` for the history | Your GitHub sign-in. Never paste a token anywhere. |

## Using it

Open it each morning. Click any text to change it, and it saves as you type. Tick the ten disciplines at the end of the day. On Friday, the
weekly review appears. Change a setting (time zone, which panels show, rocks source) by editing `fuel.config.json`, running
`python3 setup/apply_config.py`, and publishing the same file again so your link stays the same.

## Doing it by hand

Possible, but not the intended way. In short: edit `fuel.config.json`, run `python3 setup/apply_config.py`, publish `app/daily-fuel.html`
as a private artifact with the capabilities in `setup/capabilities.json` (minus modules you switch off), then write your content into the
page's store. `setup/claude-setup.md` is the exact procedure.

## If something looks wrong

- *The page says "Open this page in Claude while signed in".* You opened it outside Claude, or through someone else's account. Open it from your own
  claude.ai link.
- *A panel is empty.* Check the connector is connected, and that its module is switched on in `fuel.config.json`.
- *Your words did not save.* The page shows a status pill at the top. If it says it cannot save, you are viewing it read-only.
