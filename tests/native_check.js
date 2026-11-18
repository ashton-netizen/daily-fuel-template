// Built-in rocks, module switches and the pick prompt, in plain Node with no browser.
// Same stub page and fake claude.ai as page_check.js. Usage: node tests/native_check.js <page>
const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(process.argv[2], "utf8").match(/<script>([\s\S]*)<\/script>/)[1];
const els = {};
const mk = (id) => {
  const e = { id, dataset: {}, style: {}, hidden: false, value: "", textContent: "", className: "", disabled: false, readOnly: false, scrollHeight: 50, clientWidth: 1200, clientHeight: 700, width: 0, height: 0,
    listeners: {}, children: [], contentEditable: "false", isContentEditable: false,
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    dispatch(t, ev) { (this.listeners[t] || []).forEach(f => f(ev || { target: this })); },
    setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k]; }, hasAttribute(k) { return k in this; }, removeAttribute(k) { delete this[k]; },
    replaceChildren(...k) { this.children = k; }, append(...k) { this.children.push(...k); }, querySelector() { return null; }, querySelectorAll() { return []; },
    contains() { return false; },
    closest(sel) {
      if (sel === "[data-edit]") return this.dataset && this.dataset.edit ? this : null;
      if (sel === "select[data-item]") return this.id === "select" && this["data-item"] != null ? this : null;
      const m = /^\[(data-[a-z-]+)\]$/.exec(sel); return m && this[m[1]] != null ? this : null;
    }, focus() { document.activeElement = this; }, blur() {}, setSelectionRange() {}, scrollIntoView() {},
    getContext() { return new Proxy({}, { get: (t, p) => p in t ? t[p] : (p === "createLinearGradient" || p === "createRadialGradient") ? () => ({ addColorStop() {} }) : () => {} , set: (t, p, v) => (t[p] = v, true) }); } };
  return e;
};
const byId = (id) => els[id] || (els[id] = mk(id));
const moveAreas = [0, 1, 2].map(i => Object.assign(byId("m" + i), { dataset: { move: String(i) } }));
const fieldAreas = ["gratitudes", "cani_great", "cani_better", "influence"].map(f => Object.assign(byId("f-" + f), { dataset: { field: f } }));
const document = { hidden: false, activeElement: null, listeners: {}, getElementById: byId, createElement: (t) => mk(t), createTextNode: (t) => ({ t }),
  querySelectorAll: (q) => q === "textarea[data-move]" ? moveAreas : q === "textarea[data-field]" ? fieldAreas : [],
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }, execCommand() {}, documentElement: {} };
const writes = [], snaps = [];
// Two weekdays back from today in Sydney: yesterday has no moves, so Debrief must carry this day in.
const sydToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());
const backWeekday = (iso) => { const d = new Date(iso + "T00:00:00Z"); do { d.setUTCDate(d.getUTCDate() - 1); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6); return d.toISOString().slice(0, 10); };
const carryDay = backWeekday(backWeekday(sydToday));
const mondayOf = (iso) => { const d = new Date(iso + "T00:00:00Z"); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() - 1); return d; };
const lastWeek = [0, 1, 2].map(k => { const d = mondayOf(sydToday); d.setUTCDate(d.getUTCDate() - 7 + k); return d.toISOString().slice(0, 10); });
const allBut7 = Array.from({ length: 10 }, (_, i) => "d" + i).filter(id => id !== "d7");
const discDays = Object.fromEntries(lastWeek.map(d => [d, allBut7]));
const ref = (path) => ({ path, set: async (b) => { writes.push([path, JSON.parse(JSON.stringify(b))]); }, onSnapshot: (next) => { snaps.push([path, next]); return () => {}; } });
const db = { doc: ref, collection: (c) => ({ onSnapshot: (next) => { snaps.push([c, next]); return () => {}; } }) };
const user = { can: async () => null, isOwner: async () => false }; // the case that used to lock the page
// A fake Claude for the daily pick: records the prompt and answers with three ranked options.
const prompts = [];
const sample = { json: async (p) => { prompts.push(p); if (/exactly 1\]/.test(p)) return { options: [
  { move: "Draft the Beta pilot scope for Acme", why: "Moves Rock 4 without a call", rock: "Rock 4 ★" }] }; return { options: [
  { move: "Book the Beta pilot with one named client", why: "Unlocks Rock 4", rock: "Rock 4 ★" },
  { move: "Invite two leaders to the Roundtable", why: "Revenue", rock: "Rock 2" },
  { move: "Ask Pat Taylor and Sam Reed for one group each", why: "Due 9 Oct", rock: "Rock 3" }] }; } };
// A fake monday.com connection shaped like the Level-Up Rocks board: one of Ash's rocks with an
// undated next step (a subitem), one company rock, and a recorder for writes.
const mcpCalls = [];
const mondayItems = { items: [
  { id: 1, name: "Rock 4 - Launch Project", group: { id: "group_mine", title: "My rocks" }, column_values: { status: "On Track", date4: "2026-12-24" },
    subitems: [{ id: 42, name: "Setup wired, Build 1 live", column_values: { status: null, date0: null } }] },
  { id: 2, name: "1. Pricing Review", group: { id: "group_company", title: "Company Rocks" }, column_values: { person: "Casey", status: "On Track", date4: "2026-12-03" } }] };
const mcp = {
  watchTool: (server, tool, input, h) => { setTimeout(() => h({ type: "data", result: { payload: server === "monday.com" ? (input.boardId === 910001 && input.includeSubItems ? mondayItems : { items: [] }) : {} } }), 5); },
  callTool: async (server, tool, input) => { mcpCalls.push([server, tool, input]); return { payload: tool === "get_board_items_page" ? mondayItems : {} }; },
};
const window = { DAILY_FUEL_CONFIG: JSON.parse(process.env.FUEL_CONFIG || "{}"), claude: { use: async (n) => n === "db" ? db : n === "user" ? user : n === "sample" ? sample : n === "mcp" ? mcp : null }, matchMedia: () => ({ matches: true }), devicePixelRatio: 2, addEventListener() {}, getComputedStyle: () => ({ getPropertyValue: () => "" }) };
const ctx = { window, document, console, setTimeout, clearTimeout, setInterval: () => 0, Promise, Intl, Date, Math, JSON, Map, Set, Array, Object, Number, String, RegExp, isNaN, parseFloat,
  localStorage: { getItem: () => null, setItem() {} }, requestAnimationFrame: (f) => setTimeout(f, 0), ResizeObserver: class { observe() {} }, location: { reload() {} },
  getComputedStyle: () => ({ getPropertyValue: () => "" }), innerWidth: 1200, innerHeight: 800 };
ctx.globalThis = ctx;
vm.createContext(ctx);

const watched = [];
const realWatch = mcp.watchTool;
mcp.watchTool = (server, tool, input, h, o) => { watched.push(server); return realWatch(server, tool, input, h, o); };
vm.runInContext(src, ctx);
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms));
const walk = (n, pred) => { if (!n || typeof n !== "object") return null; if (pred(n)) return n; for (const k of n.children || []) { const f = walk(k, pred); if (f) return f; } return null; };
const lastRocks = () => { const w = writes.filter(([p]) => p === "pwp/rocks").pop(); return w && w[1].rocks; };
(async () => {
  await wait(60);
  for (const [p, next] of snaps) {
    if (p === "pwp/content") next({ exists: true, data: () => ({ purpose: "To help people grow", beliefs: ["I believe small steps compound"], horizons: [] }) });
    if (p === "log") next({ docs: [], metadata: { fromCache: false } });
    if (p === "pwp/picks") next({ exists: false, data: () => ({}) });
    if (p === "pwp/people") next({ exists: false, data: () => ({}) });
    if (p === "pwp/rocks") next({ exists: true, data: () => ({ rocks: [{ id: "r1", name: "Launch the beta", status: "On Track", due: "2026-12-24", priority: true,
      steps: [{ id: "s1", name: "Write the plan", due: "", done: false }, { id: "s2", name: "Old finished step", due: "", done: true, updatedAt: "2026-01-01T00:00:00Z" }] }] }) });
  }
  await wait(60);
  const rocksBox = byId("rocks-mine");
  const sync = (n) => { n.dataset = { item: n["data-item"], mfield: n["data-mfield"], orig: n["data-orig"], prefix: n["data-prefix"], sub: n["data-sub"] }; return n; };
  const fire = (type, target) => (rocksBox.listeners[type] || []).forEach(f => f({ target, preventDefault() {} }));
  const results = {};

  // Modules: only what the config switched on is wired up and shown.
  results["Built-in rocks subscribe to pwp/rocks, monday and HubSpot are never called"] =
    snaps.some(([p]) => p === "pwp/rocks") && !watched.includes("monday.com") && !watched.includes("HubSpot");
  results["Pipeline and company rocks are hidden, calendar shows"] =
    byId("deals-panel").hidden === true && byId("rocks-co-wrap").hidden === true && byId("agenda").hidden === false && byId("terrain").dataset.solo === "";
  results["The page is named from the config and the strip follows daily frequency"] =
    byId("hero-label").textContent === "Daily Fuel · Field log" && /^Last 20 days/.test(byId("strip-key").textContent);
  results["Prime is link-only when no video parts are published"] =
    byId("prime-video").hidden === true && byId("prime-nav").hidden === true && /new tab/.test(byId("prime-note").textContent);
  results["The pick prompt names the owner from the config, not a person from the repo"] =
    prompts.length > 0 && prompts[0].includes("You are Sam's strategy coach") && prompts[0].includes("A founder.") && !/the owner/.test(prompts[0].split("Context:")[0].slice(0, 200));

  // Built-in rocks: shows, retires old done steps, and every edit saves to pwp/rocks.
  const rock = rocksBox.children[0];
  const summary = walk(rock, n => /^Steps · /.test(n.textContent || ""));
  results["A rock shows with its open step; an old finished step has retired"] =
    !!walk(rock, n => n.class === "next-t" && n.textContent === "Write the plan") && !!summary && summary.textContent === "Steps · 1 open of 1";
  const nextSpan = walk(rock, n => n.class === "next-t");
  sync(nextSpan).textContent = "Write the one-page plan"; fire("focusout", nextSpan); await wait();
  results["Renaming a step saves"] = !!lastRocks() && lastRocks()[0].steps.find(s => s.id === "s1").name === "Write the one-page plan";
  const sel = walk(rock, n => n.id === "select");
  sel.dataset = { item: sel["data-item"] }; sel.value = "Off-Track"; fire("change", sel); await wait();
  results["Changing a rock's status saves"] = lastRocks()[0].status === "Off-Track";
  const due = walk(rock, n => n.class === "due-t");
  sync(due).textContent = "1/12/2027"; fire("focusout", due); await wait();
  results["Setting a rock's due date saves as a date"] = /^\d{4}-12-01$/.test(lastRocks()[0].due) && lastRocks()[0].due.endsWith("12-01");
  const addRow = walk(rock, n => n.class === "addstep");
  addRow.children[0].value = "Book the launch venue"; addRow.children[1].dispatch("click"); await wait();
  results["Adding a step saves"] = lastRocks()[0].steps.some(s => s.name === "Book the launch venue" && s.done === false);
  const tick = walk(byId("rocks-mine").children[0], n => n.class === "tick" && n["aria-label"] && /Write the one-page plan/.test(n["aria-label"]));
  tick.dispatch("click"); await wait();
  const ticked = lastRocks()[0].steps.find(s => s.id === "s1");
  results["Ticking a step done saves with a time stamp"] = ticked.done === true && !!ticked.updatedAt;
  results["Add a rock is available and adds one"] = (() => { const b = byId("rock-add"); if (b.hidden) return false; b.dispatch("click"); return true; })();
  await wait();
  results["A second rock is saved"] = lastRocks().length === 2 && lastRocks()[1].name === "New rock";
  const second = byId("rocks-mine").children[1];
  const rm = walk(second, n => n.textContent === "Remove rock");
  rm.dispatch("click"); await wait();
  results["Remove needs a second click, then removes only that rock"] = lastRocks().length === 2 && !!walk(second, n => n.textContent === "Sure? Remove it");
  walk(second, n => n.textContent === "Sure? Remove it").dispatch("click"); await wait();
  results["Confirmed removal saves"] = lastRocks().length === 1 && lastRocks()[0].id === "r1";

  let ok = true;
  for (const [name, passed] of Object.entries(results)) { console.log(name + ":", !!passed); if (!passed) ok = false; }
  process.exit(ok ? 0 : 1);
})();
