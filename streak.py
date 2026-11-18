#!/usr/bin/env python3
"""Compute the current streak by walking log/*.md filenames backward from a given date.
Never trusts a stored streak_day field as the source of truth for today's number;
that field is only ever written once a day is logged, as a record, not read back to
decide the next day's number.

Which days count is set in fuel.config.json ("frequency": "weekdays" or "daily").
"""
import json
import os
from datetime import date, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))


def configured_frequency(base: str = BASE) -> str:
    """The frequency from fuel.config.json, or "weekdays" when there is no readable config."""
    try:
        with open(os.path.join(base, "fuel.config.json")) as f:
            value = json.load(f).get("frequency", "weekdays")
    except (OSError, ValueError):
        return "weekdays"
    return value if value in ("weekdays", "daily") else "weekdays"


def is_active_day(d: date, frequency: str = "weekdays") -> bool:
    """A day that counts toward the run: Monday to Friday, or every day when frequency is daily."""
    return frequency == "daily" or d.weekday() < 5


def compute_streak(log_dir: str, as_of: date, frequency: str = "weekdays") -> int:
    """Length of the continuous run of active-day log files ending the last active day
    strictly before `as_of`. Days that don't count (weekends, on a weekday run) are skipped
    without breaking the run; the first missing active day ends it."""
    d = as_of - timedelta(days=1)
    count = 0
    while True:
        if not is_active_day(d, frequency):
            d -= timedelta(days=1)
            continue
        if os.path.exists(os.path.join(log_dir, f"{d.isoformat()}.md")):
            count += 1
            d -= timedelta(days=1)
        else:
            break
    return count


def streak_for_today(log_dir: str, today: date, frequency: str = "weekdays") -> int:
    """Today's streak day: the run before today, plus today itself (today is being run)."""
    return compute_streak(log_dir, today, frequency) + 1


if __name__ == "__main__":
    log_dir = os.path.join(BASE, "log")
    today = date.today()
    print(f"{today.isoformat()}: day {streak_for_today(log_dir, today, configured_frequency())}")
