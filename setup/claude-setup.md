# Setup procedure (for Claude)

You are setting up one person's private Daily Fuel from this folder. Follow the steps in order. Do the work
yourself; give the person a step only when it truly has to be theirs, and give **one step at a time**, with the
exact place to click, then wait. Name who does each thing ("Claude does ..." or "You do ..."). Never say a step is
done, saved, published or checked until you have read the result back in this conversation, and say what you
checked and what you did not.

## Step 0. Orient

1. Read `README.md`, `CLAUDE.md`, `fuel.config.json`, `content/starter.json`, `setup/interview.md`, `docs/modules.md`
   and `docs/how-it-works.md`.
2. Run `python3 setup/apply_config.py --check` and `python3 -m unittest discover tests`. Both should pass before you
   change anything. If `node` is missing the page checks skip; say so.

## Step 1. Check your tools

- You need the **Artifact** tool (publish, read, list) and the **ArtifactData** tool (the page's store). If
  ArtifactData is deferred, load it with ToolSearch `select:ArtifactData`.
- Load the `artifact-capabilities` skill before you publish: the Artifact tool requires it.
- If there is no Artifact tool, stop and tell the person plainly: this folder needs to be opened in the Claude desktop
  app's Code tab, on a plan that includes artifacts. Do not look for workarounds.
- The page can read Google Calendar and Gmail through the person's own connectors. Check which connectors this session has
  (their tool names appear in your tool list). If one the person wants is missing, tell them in one step how to connect it, or
  turn that module off for now. **Never write menu instructions from memory:** menus change. Ask for one screenshot of
  their screen first, then say exactly where to click.

## Step 2. Interview

Run `setup/interview.md`. Their words only, read back, blank is fine. Keep a running list of their answers.

## Step 3. Write their choices

1. Edit `fuel.config.json` from their answers 1, 2, 9 and 10. Set `startDate` to today's date in their time zone
   (YYYY-MM-DD): the daily belief rotation counts from it. Leave `morningEmail.artifactUrl` empty for now.
   For `rocks.source` "monday" or `pipeline.source` "hubspot", read `docs/modules.md` first and use the connector to
   find the board, group, column and owner ids. Never guess an id.
2. Run `python3 setup/apply_config.py`. It must print what it updated, and a second run must print "Nothing to change".
3. Run `python3 -m unittest discover tests`. Fix anything that fails before you go on.

## Step 4. Write their content (kept in this private folder)

1. `content/dashboard.json`: start from `content/starter.json`, then put in their answers 3 to 8 (purpose, quote,
   calling, role, beliefs, dimensions, habits, summit, horizons). Keep the generic framework unless they changed it. Do not
   add `updatedAt`. Dates in the store are `YYYY-MM-DD`.
2. If rocks are built in, `content/rocks.json` as `{"rocks": [{"id": "r1", "name": "...", "status": "", "due": "YYYY-MM-DD",
   "priority": false, "steps": [{"id": "s1", "name": "...", "due": "", "done": false}]}]}`. Give every rock and step a short unique id.
3. `content/people.json` as `{"people": [{"name": "...", "note": "...", "done": ""}]}` (answer 10).
4. Tell them these files hold their purpose and goals, so the repository must stay **private**.

## Step 5. Publish the page

1. Build the capabilities from `setup/capabilities.json`: remove the `_comment`, the `module` fields, and the servers of
   every module that is switched off. If no servers remain, leave `mcp` out.
2. Publish with the Artifact tool: `action` publish, `file_path` `app/daily-fuel.html`, `icon` "lightning", the capabilities, and
   a one-sentence `description`. The page is private to them. **Do not change sharing.** Warnings that a connector "was not
   observed" are expected for a first publish.
3. Put the returned link into `fuel.config.json` as `morningEmail.artifactUrl`, run `python3 setup/apply_config.py`, and run the tests.

## Step 6. Put their words in the page's store

With ArtifactData and the page's link:

1. `set` collection `pwp`, doc `content` with `content/dashboard.json` (a new record, so no `if_version`).
2. If rocks are built in, `set` doc `rocks` with `content/rocks.json` plus `"updatedAt"`.
3. If they gave people, `set` doc `people` with `content/people.json` plus `"updatedAt"`.
4. `get` each one back and confirm the content matches what they approved. Never write over a record you have not read.

## Step 7. Look at it

Open the published page in the person's browser (Claude in Chrome or the built-in browser, whichever is connected;
read that browser's skill first) and look through it from the top. The first time, the page asks permission to read their
calendar and inbox: that is expected, and it is their choice. Check the header shows their name, their purpose and beliefs
appear, rocks and people show, and the modules that are off are hidden. **Do not click anything that writes** except what the
person asks you to try. Report what you saw and what you did not check. Give the person the link as `[Title](URL)`.

## Step 8. Optional modules, one at a time

Offer each one. Do only the ones they want. See `docs/modules.md`.

- **Morning email.** Needs `morningEmail` in the config. Walk them through `apps-script/Code.gs` one step at a time (new Apps Script
  project, paste the file and the manifest, run `install()`, approve, run `sendDailyFuel()`, check the inbox). Ask for a screenshot
  before telling them where anything is.
- **History.** A private GitHub repository for their days, a morning task that copies the page's records into `log/`, and the
  commit guard. Follow `docs/daily-run.md`. GitHub sign-in is theirs: tell them to run `gh auth login` themselves; never touch a token.

## Step 9. Close

1. Create `.personalised` (one line: today's date). It turns off the template-only leak test in this copy.
2. Run the tests, then commit locally: `git -C <this folder> add -A` then a commit named "Personalise Daily Fuel". Do not push unless they
   asked and the repository is private.
3. Tell them, briefly: where their page is, how to edit anything on the page itself (click the text), that changing a setting means
   editing `fuel.config.json`, running `python3 setup/apply_config.py`, and publishing the same file again (the link stays the same), and that
   `docs/updating.md` shows how to pick up improvements to the template.

## Traps

- The page only works inside Claude. Opened as a plain file or through a shared link, it shows "Open this page in Claude while signed in".
  Tests simulate Claude; the published page is the real check.
- Dates are typed day/month/year on the page. They are stored `YYYY-MM-DD`.
- Every write to an existing store record is pinned to the version you read. If it fails, re-read and redo it.
- Changing `rocks.source` after launch does not move existing rocks. Tell the person before they switch.
- A video file is licensed to whoever owns it. Do not add one to the page for them unless they say they have the right to; link to it instead.
- Never copy email or calendar content, or cash check-ins, into this folder.
