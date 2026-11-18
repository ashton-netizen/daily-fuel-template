"""fuel.config.json is the one source of choices: validated, and applied to the page and the email script."""
import copy
import json
import os
import re
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "setup"))

import apply_config  # noqa: E402


class Validation(unittest.TestCase):
    def setUp(self):
        self.cfg = apply_config.load()

    def broken(self, mutate):
        cfg = copy.deepcopy(self.cfg)
        mutate(cfg)
        return apply_config.problems(cfg)

    def test_the_shipped_config_is_valid(self):
        self.assertEqual(apply_config.problems(self.cfg), [])

    def test_a_bad_time_zone_is_caught(self):
        self.assertTrue(self.broken(lambda c: c.update(timezone="Mars/Olympus")))

    def test_a_bad_start_date_is_caught(self):
        self.assertTrue(self.broken(lambda c: c.update(startDate="05/01/2026")))

    def test_locale_currency_and_checkin_day_are_checked(self):
        self.assertTrue(self.broken(lambda c: c.update(locale="english")))
        self.assertTrue(self.broken(lambda c: c["currency"].update(code="aud")))
        self.assertTrue(self.broken(lambda c: c["currency"].update(symbol="")))
        self.assertTrue(self.broken(lambda c: c["summit"].update(checkin="02-30")))
        self.assertTrue(self.broken(lambda c: c["summit"].update(checkin="June 30")))
        self.assertEqual(self.broken(lambda c: c["summit"].update(checkin="12-31")), [])

    def test_frequency_must_be_weekdays_or_daily(self):
        self.assertTrue(self.broken(lambda c: c.update(frequency="sometimes")))

    def test_monday_rocks_need_their_ids(self):
        self.assertTrue(self.broken(lambda c: c["rocks"].update(source="monday")))

    def test_the_morning_email_needs_an_address_and_a_link_when_on(self):
        problems = self.broken(lambda c: c["morningEmail"].update(enabled=True))
        self.assertTrue(any("morningEmail.to" in p for p in problems))
        self.assertTrue(any("artifactUrl" in p for p in problems))


class Applying(unittest.TestCase):
    def test_the_page_and_script_already_match_the_config(self):
        """Run python3 setup/apply_config.py after any edit to fuel.config.json."""
        cfg = apply_config.load()
        for path, expected in apply_config.render(cfg).items():
            with open(path, encoding="utf8") as f:
                self.assertEqual(f.read(), expected, f"{os.path.relpath(path, ROOT)} is out of step with fuel.config.json")

    def test_applying_twice_changes_nothing(self):
        cfg = apply_config.load()
        first = apply_config.render(cfg)
        self.assertEqual(first, apply_config.render(cfg))

    def test_the_morning_email_settings_never_reach_the_page(self):
        cfg = apply_config.load()
        cfg["morningEmail"] = {"enabled": True, "to": "someone@example.com", "hour": 6, "artifactUrl": "https://example.com/p"}
        page = apply_config.render(cfg)[apply_config.PAGE]
        self.assertNotIn("morningEmail", page)
        self.assertNotIn("someone@example.com", page)
        self.assertIn("someone@example.com", apply_config.render(cfg)[apply_config.GS])

    def test_text_that_could_end_the_script_block_is_escaped(self):
        cfg = apply_config.load()
        cfg["owner"]["about"] = "x</script><b>y"
        page = apply_config.render(cfg)[apply_config.PAGE]
        self.assertEqual(page.count('<script id="daily-fuel-config">'), 1)
        block = page.split("DAILY-FUEL-CONFIG:START", 1)[1].split("DAILY-FUEL-CONFIG:END", 1)[0]
        self.assertEqual(block.count("</script>"), 1)  # only the real closing tag

    def test_the_config_in_the_page_is_the_config_file(self):
        cfg = apply_config.load()
        page = apply_config.render(cfg)[apply_config.PAGE]
        raw = re.search(r"window\.DAILY_FUEL_CONFIG = (\{.*?\});</script>", page, re.S).group(1)
        self.assertEqual(json.loads(raw.replace("<\\/", "</")), {k: v for k, v in cfg.items() if k != "morningEmail"})

    def test_the_tab_title_follows_the_page_name(self):
        cfg = apply_config.load()
        cfg["appName"] = "Morning <Fuel> & Co"
        page = apply_config.render(cfg)[apply_config.PAGE]
        self.assertIn("<title>Morning &lt;Fuel&gt; &amp; Co</title>", page)

    def test_the_email_script_time_zone_follows_the_config(self):
        cfg = apply_config.load()
        cfg["timezone"] = "America/New_York"
        manifest = json.loads(apply_config.render(cfg)[apply_config.GS_JSON])
        self.assertEqual(manifest["timeZone"], "America/New_York")


if __name__ == "__main__":
    unittest.main()
