"""The template must carry nothing about the person who built it, or the people around them.

This is the gate before the repo is shared: it fails if a name, company, address, id or account
from the original build is anywhere in any file. The banned words are written in pieces so this
file does not trip its own check."""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BANNED = [
    "ash" + "ton", "bis" + "hop ", "hellostep" + "change", "step" + "change", "step " + "change",
    "fl" + "Ash", "power" + "ful with purpose", "power" + "ful presence",
    "13158" + "884", "182042" + "4798", "41292" + "27745", "184336" + "69880", "23372" + "12", "XX24hVF9K96P" + "7hwucGZTJR",
    "xen" + "ia", "luk" + "as", "reb" + "ecca", "magda" + "lena", "jas" + "on", "beck" + "ley", "mcros" + "tie", "third" + "ramp",
    "home" + "first", "tt" + "innovations", "over" + "watch", "kel" + "sian", "tet" + "low", "roc part" + "ners", "aqua" + " agent",
    "value gap" + " audit", "deep " + "dive", "hello-step" + "change", "ashton" + "-netizen",
    "11/04/" + "2035", "11/04/" + "1975", "10,000" + ",000", "60th " + "birthday", "powerfully " + "present",
]
ALLOWED_EMAIL_DOMAINS = {"example.com", "example.org", "gmail.com"}  # gmail.com only as a generic mention
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
SKIP_DIRS = {".git", "node_modules", "__pycache__"}


def text_files():
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            path = os.path.join(folder, name)
            try:
                with open(path, encoding="utf-8") as f:
                    yield path, f.read()
            except (UnicodeDecodeError, OSError):
                continue  # binary files are checked by name below


@unittest.skipIf(os.path.exists(os.path.join(ROOT, ".personalised")),
                 "This is a personalised copy; the template-only leak check does not apply.")
class NoPersonalData(unittest.TestCase):
    def test_no_banned_word_in_any_file(self):
        hits = []
        for path, text in text_files():
            if os.path.abspath(path) == os.path.abspath(__file__):
                continue
            lowered = text.lower()
            for word in BANNED:
                if word.lower() in lowered:
                    line = next(i for i, l in enumerate(text.splitlines(), 1) if word.lower() in l.lower())
                    hits.append(f"{os.path.relpath(path, ROOT)}:{line}: {word!r}")
        self.assertEqual(hits, [], "Personal details found:\n  " + "\n  ".join(hits))

    def test_no_real_email_address_anywhere(self):
        hits = []
        for path, text in text_files():
            for m in EMAIL.finditer(text):
                if m.group(1).lower() not in ALLOWED_EMAIL_DOMAINS:
                    hits.append(f"{os.path.relpath(path, ROOT)}: {m.group(0)}")
        self.assertEqual(hits, [], "Real-looking email addresses found:\n  " + "\n  ".join(hits))

    def test_the_log_folder_is_empty_of_real_days(self):
        logs = [f for f in os.listdir(os.path.join(ROOT, "log")) if f.endswith(".md")]
        self.assertEqual(logs, [], "log/ must start empty; history belongs to each person's own copy.")

    def test_no_video_or_photo_files_ship(self):
        shipped = []
        for folder, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            shipped += [f for f in files if f.lower().endswith((".mp4", ".mov", ".m4v", ".jpg", ".jpeg", ".png", ".webp"))]
        self.assertEqual(shipped, [], "Media files must not ship: video is licensed to one person, photos need their own credit.")


if __name__ == "__main__":
    unittest.main()
