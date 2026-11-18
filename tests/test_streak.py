"""Streak checks: the run is counted from the log filenames, weekdays or daily.
Run: python3 -m unittest discover tests"""
import json
import os
import shutil
import sys
import tempfile
import unittest
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from streak import compute_streak, configured_frequency, is_active_day, streak_for_today  # noqa: E402


def make_logs(directory, days, streak_text="1"):
    for d in days:
        with open(os.path.join(directory, f"{d}.md"), "w") as f:
            f.write(f"---\ndate: {d}\nstreak_day: {streak_text}\ngratitudes: \"\"\ncani_great: \"\"\ncani_better: \"\"\nbreakthrough_action: \"\"\n---\n")


class Weekdays(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        # Monday 28 Sep to Thursday 1 Oct 2026, then today is Friday 2 Oct.
        make_logs(self.tmp, ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01"])

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_four_logged_days_make_today_day_5(self):
        self.assertEqual(streak_for_today(self.tmp, date(2026, 10, 2)), 5)

    def test_a_missed_weekday_resets_to_day_1(self):
        os.remove(os.path.join(self.tmp, "2026-10-01.md"))
        self.assertEqual(streak_for_today(self.tmp, date(2026, 10, 2)), 1)

    def test_a_gap_mid_run_stops_the_walk(self):
        os.remove(os.path.join(self.tmp, "2026-09-29.md"))
        self.assertEqual(compute_streak(self.tmp, date(2026, 10, 2)), 2)

    def test_a_weekend_does_not_break_the_run(self):
        make_logs(self.tmp, ["2026-09-25"])  # the Friday before; nothing on the weekend
        self.assertEqual(streak_for_today(self.tmp, date(2026, 9, 28)), 2)

    def test_the_stored_streak_day_is_never_read(self):
        shutil.rmtree(self.tmp)
        self.tmp = tempfile.mkdtemp()
        make_logs(self.tmp, ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01"], streak_text="99")
        self.assertEqual(streak_for_today(self.tmp, date(2026, 10, 2)), 5)


class Daily(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        make_logs(self.tmp, ["2026-10-01", "2026-10-02"])  # Thursday and Friday; nothing on the weekend

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_weekdays_skip_the_weekend_and_keep_the_run(self):
        self.assertEqual(streak_for_today(self.tmp, date(2026, 10, 5), "weekdays"), 3)

    def test_daily_counts_a_missed_weekend_day_as_a_break(self):
        self.assertEqual(streak_for_today(self.tmp, date(2026, 10, 5), "daily"), 1)

    def test_daily_counts_weekend_logs(self):
        make_logs(self.tmp, ["2026-10-03", "2026-10-04"])
        self.assertEqual(streak_for_today(self.tmp, date(2026, 10, 5), "daily"), 5)

    def test_which_days_are_active(self):
        saturday = date(2026, 10, 3)
        self.assertFalse(is_active_day(saturday, "weekdays"))
        self.assertTrue(is_active_day(saturday, "daily"))


class ConfiguredFrequency(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def write(self, text):
        with open(os.path.join(self.tmp, "fuel.config.json"), "w") as f:
            f.write(text)

    def test_no_config_means_weekdays(self):
        self.assertEqual(configured_frequency(self.tmp), "weekdays")

    def test_daily_is_read_from_the_config(self):
        self.write(json.dumps({"frequency": "daily"}))
        self.assertEqual(configured_frequency(self.tmp), "daily")

    def test_garbage_falls_back_to_weekdays(self):
        self.write("{not json")
        self.assertEqual(configured_frequency(self.tmp), "weekdays")
        self.write(json.dumps({"frequency": "hourly"}))
        self.assertEqual(configured_frequency(self.tmp), "weekdays")


if __name__ == "__main__":
    unittest.main()
