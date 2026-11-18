#!/usr/bin/env python3
"""Write today's log file, one file per date, and optionally commit and push just that file.

  python3 log_entry.py open [--date YYYY-MM-DD] [--commit]
      Create the day's file with empty fields if it doesn't exist yet. Running the
      dashboard for a day is what puts that day on the streak.

  python3 log_entry.py set [--date YYYY-MM-DD] [--gratitudes T] [--cani-great T]
                           [--cani-better T] [--action T] [--commit]
      Update only the fields given, keep the rest. Overwrites the same file, never
      creates a second one for the date.

--commit stages only log/<date>.md and commits it as "log: <date>". The commit
message never carries the entry's text.
"""
import argparse
import json
import os
import re
import subprocess
from datetime import date

from streak import configured_frequency, streak_for_today

BASE = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE, "log")
FIELDS = ["date", "streak_day", "gratitudes", "cani_great", "cani_better", "breakthrough_action"]


def parse_frontmatter(path):
    """Read a log file's YAML frontmatter. The schema is fixed and flat, so no YAML library."""
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        m = re.match(r"^---\n(.*?)\n---\n", f.read(), re.S)
    fm = {}
    for line in (m.group(1).splitlines() if m else []):
        key, sep, value = line.partition(":")
        if not sep:
            continue
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1].replace('\\"', '"').replace("\\\\", "\\")
        fm[key.strip()] = value
    return fm


def yaml_str(value: str) -> str:
    """Minimal YAML scalar quoting: double-quote and escape embedded quotes."""
    # One line per field: separate lines typed on the page become " / ".
    value = " / ".join(" ".join(line.split()) for line in value.splitlines() if line.strip())
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def log_path(day: date, log_dir: str = LOG_DIR) -> str:
    return os.path.join(log_dir, f"{day.isoformat()}.md")


def write_entry(day: date, fields: dict, log_dir: str = LOG_DIR) -> str:
    path = log_path(day, log_dir)
    lines = ["---", f"date: {day.isoformat()}", f"streak_day: {fields['streak_day']}"]
    for key in FIELDS[2:]:
        lines.append(f"{key}: {yaml_str(fields.get(key, ''))}")
    lines += ["---", ""]
    with open(path, "w") as f:
        f.write("\n".join(lines))
    return path


def open_day(day: date, log_dir: str = LOG_DIR) -> bool:
    """Create the day's file if missing. Returns True if it was created."""
    if os.path.exists(log_path(day, log_dir)):
        return False
    write_entry(day, {"streak_day": streak_for_today(log_dir, day, configured_frequency())}, log_dir)
    return True


def set_fields(day: date, updates: dict, log_dir: str = LOG_DIR) -> str:
    open_day(day, log_dir)
    current = parse_frontmatter(log_path(day, log_dir))
    merged = {k: current.get(k, "") for k in FIELDS}
    merged.update({k: v for k, v in updates.items() if v is not None})
    return write_entry(day, merged, log_dir)


def git(*args, base=BASE):
    return subprocess.run(["git", "-C", base, *args], check=True, capture_output=True, text=True)


def commit_day(day: date, base: str = BASE, push: bool = True) -> str:
    rel = os.path.relpath(log_path(day, os.path.join(base, "log")), base)
    git("add", "--", rel, base=base)
    if git("diff", "--cached", "--name-only", base=base).stdout.split() != [rel]:
        raise SystemExit(f"Refusing to commit: something other than {rel} is staged.")
    git("commit", "-m", f"log: {day.isoformat()}", base=base)
    if push:
        git("pull", "--rebase", "--quiet", base=base)
        git("push", "--quiet", base=base)
    return git("rev-parse", "--short", "HEAD", base=base).stdout.strip()


def main(argv=None, log_dir: str = LOG_DIR):
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["open", "set"])
    ap.add_argument("--date", default=date.today().isoformat())
    ap.add_argument("--gratitudes")
    ap.add_argument("--cani-great")
    ap.add_argument("--cani-better")
    ap.add_argument("--action")
    ap.add_argument("--from-json", help="JSON file holding any of the four fields, e.g. a dashboard "
                    "record. Safer than passing someone's words through the shell.")
    ap.add_argument("--commit", action="store_true")
    a = ap.parse_args(argv)
    day = date.fromisoformat(a.date)

    if a.command == "open":
        created = open_day(day, log_dir)
        print(f"{'Created' if created else 'Already exists'}: log/{day.isoformat()}.md")
        if not created:
            a.commit = False
    else:
        updates = {"gratitudes": a.gratitudes, "cani_great": a.cani_great,
                   "cani_better": a.cani_better, "breakthrough_action": a.action}
        if a.from_json:
            with open(a.from_json) as f:
                record = json.load(f)
            updates.update({k: str(record[k]) for k in FIELDS[2:] if k in record})
        set_fields(day, updates, log_dir)
        print(f"Updated log/{day.isoformat()}.md")

    if a.commit:
        dirty = git("status", "--porcelain", "--", os.path.relpath(log_path(day), BASE)).stdout
        if dirty:
            print(f"Committed and pushed {commit_day(day)}")
        else:
            print("No change to commit")


if __name__ == "__main__":
    main()
