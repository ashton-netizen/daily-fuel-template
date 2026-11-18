# Updating from the template

The template improves over time. Your copy keeps your own choices (`fuel.config.json`), your content and your history, and takes
the template's improvements only when you choose.

If you made your copy with **Use this template**, GitHub shows "generated from <owner>/<template>" at the top of your repository. That is the
template's address.

1. Add it once: `git -C <your folder> remote add template <template address>`.
2. Fetch: `git -C <your folder> fetch template`.
3. See what changed: `git -C <your folder> diff HEAD template/main -- app setup docs tests`.
4. Bring it in on a branch: merge or cherry-pick the files you want. Your own files are not in those folders: `fuel.config.json`, `content/`, `log/`.
5. If `app/daily-fuel.html` conflicts, the conflict is in the config block between `DAILY-FUEL-CONFIG:START` and `:END`. Take either side, then run
   `python3 setup/apply_config.py`: it rewrites that block from your `fuel.config.json`.
6. Run `python3 -m unittest discover tests`, then publish the same file again so your page link stays the same. Claude can do all of this if you ask.

Your own store records are never touched by an update. If a new version needs a new field in your content, Claude will say so and add it, reading
the record first.
