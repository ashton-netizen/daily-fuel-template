#!/usr/bin/env python3
"""Commit guard. Runs locally as the pre-commit hook (`git config core.hooksPath .githooks`)
and on GitHub as the required "guard" check, against every change since the base commit.

Blocks a commit that would:
- delete or rename anything under log/
- add a log file not named YYYY-MM-DD.md, or one with fields beyond the fixed schema
  or any body text (the only place email or calendar detail could hide)
- stage a grounding file (today's calendar and inbox read), which lives outside the repo
"""
import re
import subprocess
import sys

FIELDS = ["date", "streak_day", "gratitudes", "cani_great", "cani_better", "breakthrough_action"]


def staged():
    out = subprocess.run(["git", "diff", "--cached", "--name-status", "-M"],
                         check=True, capture_output=True, text=True).stdout
    for line in out.splitlines():
        parts = line.split("\t")
        yield parts[0], parts[1:]


def check_log_file(path, base_ref=None):
    text = read_file(path, base_ref)
    m = re.match(r"^---\n(.*?)\n---\n(.*)\Z", text, re.S)
    if not m:
        return f"{path}: no YAML frontmatter"
    keys = [line.partition(":")[0].strip() for line in m.group(1).splitlines() if line.strip()]
    if keys != FIELDS:
        return f"{path}: fields must be exactly {', '.join(FIELDS)}"
    if m.group(2).strip():
        return f"{path}: log files are frontmatter only, no body text"
    date = re.match(r"log/(\d{4}-\d{2}-\d{2})\.md$", path).group(1)
    if not re.search(rf"^date: {date}$", m.group(1), re.M):
        return f"{path}: date field doesn't match the filename"
    return None


def changes(base_ref=None):
    """Staged changes, or (in CI) every change between base_ref and HEAD."""
    if base_ref is None:
        yield from staged()
        return
    out = subprocess.run(["git", "diff", "--name-status", "-M", f"{base_ref}...HEAD"],
                         check=True, capture_output=True, text=True).stdout
    for line in out.splitlines():
        parts = line.split("\t")
        yield parts[0], parts[1:]


def read_file(path, base_ref):
    ref = f":{path}" if base_ref is None else f"HEAD:{path}"
    return subprocess.run(["git", "show", ref], check=True, capture_output=True, text=True).stdout


def main(base_ref=None):
    problems = []
    for status, paths in changes(base_ref):
        if any("grounding" in p.lower() for p in paths):
            problems.append(f"{paths[-1]}: grounding data (calendar/inbox) never goes in the repo")
        if status[0] in "DR" and paths[0].startswith("log/"):
            problems.append(f"{paths[0]}: log files are never deleted or renamed")
            continue
        path = paths[-1]
        if path.startswith("log/") and status[0] in "AMC":
            if not re.match(r"log/\d{4}-\d{2}-\d{2}\.md$", path):
                problems.append(f"{path}: log files are named YYYY-MM-DD.md")
            else:
                err = check_log_file(path, base_ref)
                if err:
                    problems.append(err)
    if problems:
        print("Commit blocked by check_commit.py:", *problems, sep="\n  ", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    # CI passes the base commit: python3 check_commit.py <base-sha>
    main(sys.argv[1] if len(sys.argv) > 1 else None)
