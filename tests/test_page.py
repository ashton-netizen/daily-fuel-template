"""The page loads, stays editable, saves, and switches modules on and off (runs the Node checks)."""
import json
import os
import re
import shutil
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "app", "daily-fuel.html")
NODE = shutil.which("node")

MONDAY_AND_PLAYER = {
    "prime": {"enabled": True, "parts": 8},
    "rocks": {"source": "monday", "monday": {
        "rocksBoardId": 910001, "stepsBoardId": 910002, "myGroupId": "group_mine", "companyGroupMatch": "company rocks",
        "workspaceUrl": "https://example.monday.com/",
        "columns": {"status": "status", "due": "date4", "stepDue": "date0", "outcome": "text_outcome", "owner": ["person", "people__1"]}}},
}
NATIVE_DAILY = {"frequency": "daily", "owner": {"name": "Sam", "email": "sam@example.com", "about": "A founder."}}


def run(script, config):
    env = dict(os.environ, FUEL_CONFIG=json.dumps(config))
    return subprocess.run([NODE, os.path.join(ROOT, "tests", script), PAGE], capture_output=True, text=True, timeout=60, env=env)


@unittest.skipUnless(NODE, "node is not installed")
class Checks(unittest.TestCase):
    def test_big_move_is_editable_and_the_whole_page_flow_saves_with_monday_rocks(self):
        r = run("page_check.js", MONDAY_AND_PLAYER)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("BIG move editable: true", r.stdout)

    def test_built_in_rocks_and_the_module_switches(self):
        r = run("native_check.js", NATIVE_DAILY)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_monday_rock_next_step_rule(self):
        """A rock's Next step follows the board order; only a step due within 14 days jumps ahead."""
        r = subprocess.run([NODE, os.path.join(ROOT, "tests", "rocks_check.js"), PAGE], capture_output=True, text=True, timeout=30)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


class EachIdeaOnce(unittest.TestCase):
    """Calling, purpose, beliefs, the BHAG and horizons each have one home on the page, edited in place."""

    def setUp(self):
        with open(PAGE, encoding="utf-8") as f:
            self.page = f.read()

    def test_each_idea_is_editable_in_exactly_one_place(self):
        for key in ("calling", "role", "purpose", "quote", "bhag.statement", "bhag.why", "bhag.by", "bhag.target"):
            self.assertEqual(self.page.count(f'data-edit="{key}"'), 1, key)
        self.assertEqual(self.page.count('itemsEl("beliefs"'), 1)
        self.assertEqual(self.page.count("horizons.${i}.items"), 1)

    def test_cash_is_a_yearly_check_in_in_basecamp(self):
        basecamp = self.page.split('id="ptn"', 1)[1]
        for piece in ('id="cash-fy"', 'id="bhag-ladder"', 'id="cash-log"'):
            self.assertIn(piece, basecamp)

    def test_there_is_exactly_one_config_block_and_it_comes_before_the_script(self):
        self.assertEqual(self.page.count('<script id="daily-fuel-config">'), 1)
        self.assertLess(self.page.index("daily-fuel-config"), self.page.index("<script>\n(() => {"))


class PhoneLayout(unittest.TestCase):
    """On a phone, rows that put text beside buttons stack, so text never wraps letter by letter."""

    def test_phone_block_stacks_text_beside_buttons(self):
        with open(PAGE, encoding="utf-8") as f:
            css = f.read().split("</style>")[0]
        phone = css.split("@media (max-width: 600px) {", 1)[1]
        for rule in (".recon-row { grid-template-columns: minmax(0, 1fr);",
                     ".ladder li { grid-template-columns: minmax(0, 1fr) auto;",
                     ".step { grid-template-columns: 32px minmax(0, 1fr);"):
            self.assertIn(rule, phone)


if __name__ == "__main__":
    unittest.main()
