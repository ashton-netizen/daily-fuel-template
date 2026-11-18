# Modules

Everything beyond the core climb is a module you can switch on or off in `fuel.config.json` (then run
`python3 setup/apply_config.py` and publish again). A switched-off module is never called and its panel is hidden.

| Module | Config | Needs | Reads or stores |
|---|---|---|---|
| **Calendar** | `calendar` | Google Calendar connector | Today's events, live. Stores nothing. |
| **Inbox** | `inbox`, `owner.email` | Gmail connector | Unread threads, live; Claude picks the few that need you. Stores nothing. |
| **People** | `people` | Nothing | Your own list in `pwp/people`. |
| **Rocks, built in** | `rocks.source = "native"` | Nothing | Rocks and steps in `pwp/rocks`. |
| **Rocks, monday.com** | `rocks.source = "monday"` | monday.com connector | Your board, live, and writes edits back. |
| **No rocks** | `rocks.source = "none"` | Nothing | The rocks panel is hidden. |
| **Pipeline** | `pipeline.source = "hubspot"` | HubSpot connector | Your open deals, live. Hidden when `"none"`. |
| **Prime** | `prime.enabled`, `prime.parts` | Nothing | A link to a public video (edit it on the page). |
| **Four Agreements** | `agreements` | Nothing | A card at the foot. |
| **Morning email** | `morningEmail` | A Google account | An Apps Script in your own account. |
| **History** | `history.sync` | GitHub, `gh` signed in | A private copy of your days. See [daily-run](daily-run.md). |

## Rocks on monday.com

Use this only if your rocks already live there. The page expects:

- One board with your rocks as items in one group (`myGroupId`), each named `Rock 1 - the rock`, `Rock 2 - ...`. A ★ after the number marks the priority.
- Steps as **subitems**. Their board is `stepsBoardId`. A step's status is done when it is **On Track**; blank means not started.
- Column ids in `rocks.monday.columns`: `status` (shared by rocks and steps), `due` (a rock's date), `stepDue` (a step's date), optional `outcome`
  (a text column) and `owner` (for company rocks).
- Optional company rocks: items in a group whose title matches `companyGroupMatch`.
- `workspaceUrl` is your account's address (`https://your-account.monday.com/`); links only open if they start with it.

To find the ids, ask Claude to use the monday connector's board information tool. Never guess an id.

## Pipeline on HubSpot

Set `portalId` (the number in your HubSpot address), `ownerId` (your own owner id, so you see your deals), `pipelineId` (usually `default`) and
`stages` (a map from each stage id to the name you want shown). Claude can find them through the HubSpot connector. The panel shows the top ten
open deals ranked by value times stage odds, with red for no activity in 14 days or more.

## Prime and video

The Prime panel links to a public video, which opens in a new tab. If you own a video and have the right to put it on your page, Claude can cut
it into parts under the artifact file limit and play them in sequence; set `prime.parts` to the number of parts. Do not do this with a video you
do not have the rights to. This template ships no video and no photos.

## Photos

The page has optional background photos. Put your own files in an `img/` folder published with the page (`hero.jpg`, `route.jpg`, `summit.jpg`,
`basecamp.jpg`) and credit them in the footer. Without them the page simply shows its dark background.
