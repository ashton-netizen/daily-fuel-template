#!/usr/bin/env python3
"""Write fuel.config.json into the dashboard page and the morning-email script.

  python3 setup/apply_config.py            # apply, then print what changed
  python3 setup/apply_config.py --check    # validate only, change nothing

fuel.config.json is the one place your choices live. This script copies them into:
  - app/daily-fuel.html        the block between DAILY-FUEL-CONFIG:START and :END, and the <title>
  - apps-script/Code.gs        the block between CONFIG:START and CONFIG:END
  - apps-script/appsscript.json  the time zone
It is safe to run again: the same config always produces the same files.
"""
import argparse
import html
import json
import os
import re
import sys
from datetime import date
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "fuel.config.json")
PAGE = os.path.join(ROOT, "app", "daily-fuel.html")
GS = os.path.join(ROOT, "apps-script", "Code.gs")
GS_JSON = os.path.join(ROOT, "apps-script", "appsscript.json")

PAGE_START = "<!-- DAILY-FUEL-CONFIG:START"
PAGE_END = "<!-- DAILY-FUEL-CONFIG:END -->"
GS_START = "// CONFIG:START"
GS_END = "// CONFIG:END"


def load(path=CONFIG):
    with open(path, encoding="utf8") as f:
        return json.load(f)


def problems(cfg):
    """Everything wrong with a config, as plain sentences. Empty means it is fine."""
    out = []

    def need(ok, message):
        if not ok:
            out.append(message)

    need(isinstance(cfg.get("appName"), str) and cfg["appName"].strip(), "appName must be a non-empty string.")
    try:
        ZoneInfo(str(cfg.get("timezone")))
    except Exception:
        out.append("timezone must be a valid IANA name such as Australia/Sydney or America/New_York.")
    try:
        date.fromisoformat(str(cfg.get("startDate")))
    except ValueError:
        out.append("startDate must be a date written YYYY-MM-DD.")
    need(cfg.get("frequency") in ("weekdays", "daily"), 'frequency must be "weekdays" or "daily".')
    need(re.fullmatch(r"[a-z]{2,3}(-[A-Z]{2})?", str(cfg.get("locale", ""))) is not None, "locale must look like en-AU or en-US.")
    cur = cfg.get("currency", {})
    need(isinstance(cur.get("symbol"), str) and 0 < len(cur["symbol"]) <= 3, "currency.symbol must be one to three characters, such as $.")
    need(re.fullmatch(r"[A-Z]{3}", str(cur.get("code", ""))) is not None, "currency.code must be three capital letters, such as AUD.")
    try:
        date.fromisoformat("2001-" + str(cfg.get("summit", {}).get("checkin", "")))
    except ValueError:
        out.append("summit.checkin must be a day written MM-DD, such as 06-30 or 12-31.")
    for key in ("calendar", "inbox", "people", "agreements"):
        need(isinstance(cfg.get(key), bool), f"{key} must be true or false.")
    need(isinstance(cfg.get("history", {}).get("sync"), bool), "history.sync must be true or false.")
    rocks = cfg.get("rocks", {})
    need(rocks.get("source") in ("native", "monday", "none"), 'rocks.source must be "native", "monday" or "none".')
    if rocks.get("source") == "monday":
        m = rocks.get("monday", {})
        need(isinstance(m.get("rocksBoardId"), int) and m["rocksBoardId"] > 0, "rocks.monday.rocksBoardId must be your board's number.")
        need(isinstance(m.get("stepsBoardId"), int) and m["stepsBoardId"] > 0, "rocks.monday.stepsBoardId must be your subitem board's number.")
        need(bool(m.get("myGroupId")), "rocks.monday.myGroupId must be the id of the group that holds your rocks.")
        need(str(m.get("workspaceUrl", "")).startswith("https://"), "rocks.monday.workspaceUrl must start with https://.")
    pipeline = cfg.get("pipeline", {})
    need(pipeline.get("source") in ("none", "hubspot"), 'pipeline.source must be "none" or "hubspot".')
    if pipeline.get("source") == "hubspot":
        need(bool(str(pipeline.get("hubspot", {}).get("portalId", "")).strip()), "pipeline.hubspot.portalId is needed for deal links.")
    prime = cfg.get("prime", {})
    need(isinstance(prime.get("parts"), int) and prime["parts"] >= 0, "prime.parts must be 0 (link only) or the number of video parts you published.")
    mail = cfg.get("morningEmail", {})
    if mail.get("enabled"):
        need("@" in str(mail.get("to", "")), "morningEmail.to must be your email address.")
        need(str(mail.get("artifactUrl", "")).startswith("https://"), "morningEmail.artifactUrl must be the link to your published page.")
        need(isinstance(mail.get("hour"), int) and 0 <= mail["hour"] <= 23, "morningEmail.hour must be 0 to 23.")
    return out


def page_block(cfg):
    """What the page needs. The morning email settings never go into the page."""
    page_cfg = {k: v for k, v in cfg.items() if k != "morningEmail"}
    body = json.dumps(page_cfg, indent=2, ensure_ascii=False).replace("</", "<\\/").replace("<!--", "<\\!--")
    return (f"{PAGE_START} (written by setup/apply_config.py from fuel.config.json; edit that file, not this block) -->\n"
            f'<script id="daily-fuel-config">window.DAILY_FUEL_CONFIG = {body};</script>\n{PAGE_END}')


def swap(text, start, end, block, label):
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if len(pattern.findall(text)) != 1:
        raise SystemExit(f"{label}: expected exactly one {start} ... {end} block.")
    return pattern.sub(lambda m: block, text)


def js(value):
    return json.dumps(value, ensure_ascii=False)


def gs_block(cfg):
    mail = cfg.get("morningEmail", {})
    return "\n".join([
        GS_START,
        f"const TO = {js(mail.get('to', ''))};",
        f"const LINK = {js(mail.get('artifactUrl', ''))};",
        f"const TZ = {js(cfg['timezone'])};",
        f"const HOUR = {int(mail.get('hour', 6))};",
        f"const APP_NAME = {js(cfg['appName'])};",
        f"const WEEKDAYS_ONLY = {'true' if cfg['frequency'] == 'weekdays' else 'false'};",
        GS_END,
    ])


def render(cfg):
    """The three files as they should be for this config: {path: text}."""
    out = {}
    with open(PAGE, encoding="utf8") as f:
        text = swap(f.read(), PAGE_START, PAGE_END, page_block(cfg), "app/daily-fuel.html")
    # The browser tab and gallery name follow the page name.
    out[PAGE] = re.sub(r"<title>.*?</title>", lambda m: f"<title>{html.escape(cfg['appName'])}</title>", text, count=1, flags=re.S)
    with open(GS, encoding="utf8") as f:
        out[GS] = swap(f.read(), GS_START, GS_END, gs_block(cfg), "apps-script/Code.gs")
    with open(GS_JSON, encoding="utf8") as f:
        manifest = json.load(f)
    manifest["timeZone"] = cfg["timezone"]
    out[GS_JSON] = json.dumps(manifest, indent=2) + "\n"
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="validate fuel.config.json and change nothing")
    a = ap.parse_args(argv)
    cfg = load()
    bad = problems(cfg)
    if bad:
        print("fuel.config.json needs fixing:", *bad, sep="\n  - ", file=sys.stderr)
        return 1
    if a.check:
        print("fuel.config.json is valid.")
        return 0
    changed = []
    for path, text in render(cfg).items():
        with open(path, encoding="utf8") as f:
            if f.read() != text:
                with open(path, "w", encoding="utf8") as g:
                    g.write(text)
                changed.append(os.path.relpath(path, ROOT))
    print("Updated: " + ", ".join(changed) if changed else "Nothing to change: files already match fuel.config.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
