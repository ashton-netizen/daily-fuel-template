# How it works

## The pieces

- **The page** (`app/daily-fuel.html`): one file, published as a private artifact in your Claude account. It is the only thing you open.
- **The page's store:** a small private database that belongs to the page and to you alone (owner-only read and write). Everything you
  type is saved here as you type.
- **Your connectors** (optional): Google Calendar, Gmail, monday.com, HubSpot. The page reads them live through your own Claude account and
  stores none of what it reads.
- **Claude's pick:** the page asks Claude, with your permission, to rank three options for your BIG move from your rocks, goals, calendar,
  inbox and pipeline.
- **This folder:** the template, your choices (`fuel.config.json`), your content seeds, and optionally a private history of your days.
- **The morning email** (optional): a script in your own Google account that emails you a button to open the page.

## What lives in the store

| Record | What it holds |
|---|---|
| `pwp/content` | Purpose, calling, role, beliefs, summit, horizons, dimensions, habits, the ten disciplines and their tests, the weekly questions, the recommendation checks, Prime links. |
| `log/YYYY-MM-DD` | One record per day: gratitude, what was great, what didn't go well, your three moves and how they went. |
| `pwp/disciplines` | Your daily ticks (Held, N/A) per discipline, and the lead you chose for the week. |
| `pwp/rocks` | Built-in rocks and their steps (only if `rocks.source` is "native"). |
| `pwp/people` | Your reach-out list. A person marked done drops off after 48 hours. |
| `pwp/picks` | The options Claude offered you each day and what you used or rejected, so a rejected pick does not return. |
| `pwp/cash` | Yearly summit check-ins. Stays in the store only. |

## A day

1. The morning email (if you set it up) arrives. You open the page.
2. **Debrief:** tick how yesterday's moves went (the last day that had moves is carried in if yesterday had none), write what was great and what
   didn't go well.
3. **State:** read today's belief aloud, write your gratitude.
4. **Story:** read your purpose and your summit aloud.
5. **Strategy:** read the week's lead discipline, take or reject Claude's pick, write three moves, lock them in. Work the rocks and people.
6. **End of day:** tick the ten disciplines (Held, or N/A when there was no opportunity).

## Privacy, plainly

- The page and its store are private to you. Do not share the page by public link: it reads your calendar and inbox.
- Email, calendar details and cash figures are never copied into this folder, a commit or a chat summary.
- Claude's pick sends your rocks, goals, today's agenda titles and the inbox lines it chose to Claude, with your permission, to make a suggestion.
  Switch the calendar and inbox modules off if you would rather it never saw them.
- A done step or person drops off the page after 48 hours, but stays in your records.

## Known limits

- Dates are typed day/month/year.
- The page only works inside Claude.
- The summit tracker is built around a money figure; leave the number blank for a non-financial summit.
- The ten disciplines and weekly questions are a synthesis of public ideas, not quotations. Edit them freely.
