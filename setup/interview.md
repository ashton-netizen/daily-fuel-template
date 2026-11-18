# The ten questions

Claude asks these in plain conversation, one at a time or in short groups. It takes about fifteen minutes.

How to run it:

- **Their words, not yours.** Never answer a question for them. If they are unsure, ask one follow-up, then offer up to
  three drafts built only from what they said, each labelled a draft. They pick, reword or skip.
- **Read each answer back** in one line and get a yes before moving on.
- **Blank is fine.** Any question can be skipped and filled in later, on the page. Leave the field empty. Never
  put in a placeholder as if it were theirs.
- **No jargon.** Say "your page" and "your store", not "artifact" or "database".

| # | Ask | Why it matters | Goes in |
|---|---|---|---|
| 1 | **You and your page.** What name should the page show (default "Daily Fuel")? What should it call you? A nickname for the header (optional)? Your time zone (for example Australia/Sydney)? The spelling you use (English with Australian, British or American spelling)? Any writing preference (for example "no em-dashes")? One sentence about what you do, so Claude's suggestions fit your world. Your email address, which the inbox check and the morning email use. And your region for number and date style (for example en-AU or en-US) and your currency symbol and code (for example $ and AUD). | The header, the date, every prompt Claude writes. | `fuel.config.json`: `appName`, `owner.name`, `nickname`, `timezone`, `language`, `writingStyle`, `owner.about`, `owner.email`, `locale`, `currency` |
| 2 | **Your rhythm.** Weekdays only, or every day? Do you want a short email each morning with a button to open the page, and at what hour? | A weekday run skips weekends without breaking. The email is the nudge. | `frequency`, `morningEmail.enabled`, `morningEmail.hour`, `morningEmail.to` |
| 3 | **Your purpose.** Why do you do what you do, in one line? Who do you serve, and what changes for them? Optional: a short paragraph on what being at your best looks like. | Read aloud each morning in Story. | store `purpose`, `quote` |
| 4 | **Your calling and role.** Two short lines that finish "I am ...": the state you choose to be in, and the role you play. | The line under your name: "Say it: I am ..." | store `calling`, `role` |
| 5 | **Your empowering beliefs.** Five to eight beliefs, in the first person, that you want to be true and can read aloud. | One rotates in each day in State. | store `beliefs` |
| 6 | **What matters to you.** Which areas of life matter most (for example health, work, family, learning, money, energy)? For each, one line on what doing it well looks like. Then up to three keystone habits: a label and the habit. | Your dimensions of meaning and keystone habits in Basecamp. | store `dimensions`, `habits` |
| 7 | **Your summit.** Your one definite long-term goal. What is it, by when (a date), and why is it a must? If it is a cash figure, how much? Leave the number blank if it is not about money. On what day each year should the page ask for a check-in (the default is 30 June, the end of the Australian financial year; 31 December suits many people)? | The countdown in Story and, with a number, a yearly check-in line in Basecamp. | store `bhag` (`statement`, `why`, `by` as YYYY-MM-DD, `target`); `summit.checkin` as MM-DD |
| 8 | **Your horizons.** Two to five goals for the next 12 months, for the next three years, and for ten years and beyond. | The goals Claude weighs when it picks your BIG move. | store `horizons` |
| 9 | **Your rocks.** Where do your quarterly priorities live? Built into the page (recommended), monday.com, or nowhere? If built in: the three to five rocks for this quarter, each with a next step or two and a due date (day/month/year). Is one the priority? | Rocks and steps are what Claude ranks for leverage. | `rocks.source`; store `pwp/rocks` when built in |
| 10 | **Your connections.** Who do you want to reach out to soon, and why (names and a note)? Which tools should the page read: Google Calendar, Gmail, a HubSpot pipeline? Do you want a private GitHub history of your days? | The people list, the agenda, "needs you", the pipeline, and the history sync. | store `pwp/people`; `calendar`, `inbox`, `pipeline.source`, `history.sync` |

## After the ten

Show them what is already in the page and let them change it, in one short list:

- **The ten daily disciplines** and their daily tests (a generic framework drawn from public ideas). Keep all ten,
  or reword or remove any? They tick them each day, and the page suggests a weekly lead from their ticks.
- **The weekly CEO review** questions, shown Friday to Sunday.
- **The ten recommendation checks** and the reusable instruction, tucked under the moves.
- **Prime**, a link to a public priming video. Keep or remove.
- **The Four Agreements card** at the foot. Keep or remove.

Then read back a one-screen summary of everything you are about to build and get a yes before you build it.

## Coaching prompts for the harder ones

- *Purpose:* "Who is one person your work has made a real difference to? What changed for them?"
- *Beliefs:* "What do you need to believe on your worst day to keep going?" Turn each answer into "I believe ...".
- *Summit:* "If it is three years from now and you are proud, what has happened?" Then ask for a number and a date.
- *Rocks:* "If you could only finish three things this quarter, what are they?"
