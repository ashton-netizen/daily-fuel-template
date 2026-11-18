/**
 * Daily Fuel morning email. Runs in your own Google account (script.google.com).
 *
 * Sends you one short email each morning with a button that opens today's Daily Fuel.
 * The email is built and sent here, so the button is a clean, direct link. (A link sent through
 * an email connector is rewritten into a google.com redirect that costs you a click.)
 *
 * Setup, once:
 *   1. Put your details in fuel.config.json (morningEmail block) and run
 *      python3 setup/apply_config.py. It fills the CONFIG block below.
 *   2. Create a new project at script.google.com, paste this whole file in, and paste
 *      apps-script/appsscript.json into the project manifest (Project Settings, show manifest).
 *   3. Run install() once and approve the permissions, then run sendDailyFuel() to test.
 */
// CONFIG:START
const TO = "";
const LINK = "";
const TZ = "UTC";
const HOUR = 6;
const APP_NAME = "Daily Fuel";
const WEEKDAYS_ONLY = true;
// CONFIG:END

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function buildHtml() {
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#111">'
    + '<p style="margin:0 0 18px"><a href="' + esc(LINK) + '" style="display:inline-block;background:#FF6B2C;color:#0A0F1C;'
    + 'font-weight:bold;text-decoration:none;padding:14px 22px;border-radius:3px">Open today\'s ' + esc(APP_NAME) + '</a></p>'
    + '<p style="margin:0;color:#555">A few minutes. State, story, strategy.</p></div>';
}

function plainText() {
  return 'Open today\'s ' + APP_NAME + ' from the button in this email.\n\nA few minutes. State, story, strategy.';
}

function sendDailyFuel() {
  if (!TO || !LINK) throw new Error('TO and LINK are empty. Fill the morningEmail block in fuel.config.json and run python3 setup/apply_config.py, then paste the new Code.gs in.');
  // Utilities.formatDate with 'u' gives 1 (Monday) to 7 (Sunday).
  if (WEEKDAYS_ONLY && Number(Utilities.formatDate(new Date(), TZ, 'u')) >= 6) { console.log('Weekend: nothing sent.'); return; }
  GmailApp.sendEmail(TO, 'Your ' + APP_NAME + ' is ready', plainText(), { htmlBody: buildHtml() });
  console.log('Sent to ' + TO);
}

/** Run once. Replaces any earlier trigger with one daily run at about HOUR in TZ. */
function install() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDailyFuel') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyFuel').timeBased().everyDays(1).atHour(HOUR).nearMinute(0).inTimezone(TZ).create();
  console.log('Installed: sendDailyFuel daily at about ' + HOUR + ':00 ' + TZ + ' (Google allows +/- 15 minutes).');
}
