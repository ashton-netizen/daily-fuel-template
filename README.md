# Daily Fuel

A private daily dashboard you open each morning to get clear, calm and moving in about five minutes.
It runs as a private page inside your own Claude account. You answer ten questions once, and Claude
builds your version: your purpose, your beliefs, your goals, your rocks and your people, wired to
your own calendar and inbox. Nothing here belongs to anyone else, and nothing leaves your account.

## What it gives you each day

| Part | What happens |
|---|---|
| **Debrief** | What you moved yesterday, what was great, what didn't go well, what you make it mean and what you will do. Constant and never-ending improvement. |
| **State** | One of your empowering beliefs, read aloud, then gratitude. Energy before decisions. |
| **Story** | Your purpose and your summit, read aloud as already true. |
| **Strategy** | Claude's pick for your BIG move, ranked for leverage from your rocks, calendar, inbox and pipeline. Three moves. Ten daily disciplines you tick, with a weekly lead. Rocks with steps. People to reach out to. |
| **Basecamp** | The long game: your summit tracker, goals at 12 months, 3 years and 10 years, your dimensions of meaning and your keystone habits. |
| **Prime and the Four Agreements** | A link to a priming video, and a card to end the page on. |

It keeps a run (a streak) of the days you wrote something, and a weekly review for the CEO-level
questions that matter on a Friday.

## Quick start

1. **Get your own copy.** Click **Use this template** on GitHub and create a **private** repository, then
   download or clone it to your computer. (No GitHub? Download the ZIP instead.)
2. **Open the folder in the Claude desktop app**, in the Code tab.
3. **Paste the prompt in [`setup/master-prompt.md`](setup/master-prompt.md).** Claude interviews you in plain
   conversation (about fifteen minutes), then builds, publishes and checks your private page.

Details and the steps only you can do (connecting Gmail and Calendar, the optional morning email) are in
[`SETUP.md`](SETUP.md).

## What you need

| Need | Why |
|---|---|
| The Claude desktop app with the Code tab, on a plan that includes artifacts | Your page is a private artifact with its own small store. |
| Google Calendar and Gmail connected in Claude (optional) | The page reads today's calendar and inbox live. It stores none of it. |
| A Google account for the morning email (optional) | A tiny script sends you one email each morning with a button to open the page. |
| GitHub (optional) | Keeps a private history of your days and a way to update from this template. |
| monday.com or HubSpot (optional) | If you already track rocks or deals there. Otherwise rocks are built in and the pipeline is hidden. |

## Keep it private

- Your page is private by default. **Do not share it by public link:** it reads your calendar and inbox.
- Keep your copy of this repository **private.** It will hold your purpose, beliefs and goals.
- The repository never stores email contents, calendar details or cash figures. See `CLAUDE.md`.

## How it is organised

- `app/daily-fuel.html`: the page. One file. Setup writes your choices into its config block.
- `fuel.config.json`: the one place your choices live (name, time zone, frequency, which modules are on).
- `content/starter.json`: the generic framework (ten disciplines, weekly questions, recommendation checks)
  and empty fields for everything personal. Setup turns it into your `content/dashboard.json`.
- `setup/`: the interview, the setup procedure Claude follows, and `apply_config.py`.
- `apps-script/`: the optional morning email sender.
- `docs/`: [how it works](docs/how-it-works.md), [modules](docs/modules.md), [history sync](docs/daily-run.md),
  [updating](docs/updating.md) and [an email you can send a friend](docs/invite-email.md).
- `tests/`: `python3 -m unittest discover tests`.

## Where the ideas come from

The ideas are other people's, written here in our own words as prompts for action, not as quotations and
not as proof that belief guarantees results: Napoleon Hill (*Think and Grow Rich*), Stever Robbins (*What do
CEOs do?*), Tony Robbins (state, gratitude, priming), JT Foxx (*Billionaire vs Millionaire Thinking*; the
ideas here are a synthesis, not a verified list from the book), Barbara Minto (*The Pyramid Principle*),
Don Miguel Ruiz (*The Four Agreements*), Bob Proctor (telling your story as already true; known here only
through third-party summaries, not read directly) and Robert Cialdini (writing the commitment down). Read
the originals. The ten disciplines are a starting point: edit any of them on the page.

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE). Free to use and change for your own personal use. Commercial use
or resale needs the licensor's permission. The text is the standard published licence, unmodified.
