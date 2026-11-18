// Page smoke check in plain Node, no browser: runs app/pwp-dashboard.html's script against a
// stub page and a fake claude.ai whose store records writes, in a view that can't confirm
// ownership. Then types the BIG move, switches away, and checks People and Claude's pick. Usage: node tests/page_check.js <page>
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
vm.runInContext(src, ctx);
setTimeout(() => {
  // Deliver an empty content doc and log collection, then type into the BIG move.
  for (const [p, next] of snaps) {
    if (p === "pwp/content") next({ exists: true, data: () => ({ purpose: "To help people grow", calling: "Calm and Focused", role: "I am the builder", beliefs: ["I believe small steps compound"], horizons: [{ title: "H1", items: ["One thing"] }], disciplines: Array.from({ length: 10 }, (_, i) => ({ id: "d" + i, rule: "Rule " + i, test: "Test " + i, source: "Hill" })), prime: [{ name: "Prime", use: "Do it", url: "https://example.com/prime" }], study: [{ name: "Hill", use: "Execution", url: "https://example.com/hill" }], ceoReview: [{ q: "Where will we win?", out: "One trade-off" }] }) });
    if (p === "log") next({ docs: [{ id: carryDay, data: () => ({ date: carryDay, moves: [{ text: "Carried move from before", done: "no" }, { text: "", done: null }, { text: "", done: null }] }) }], metadata: { fromCache: false } });
    if (p === "pwp/picks") next({ exists: false, data: () => ({}) });
    if (p === "pwp/disciplines") next({ exists: true, data: () => ({ days: discDays }) });
    if (p === "pwp/people") next({ exists: true, data: () => ({ people: [{ name: "Robin Hale", note: "", done: "" }, { name: "Done last week", note: "", done: "2026-01-01" }] }) });
  }
  // Each idea has one home: calling and purpose fill in place, and editing the calling in the hero saves it.
  const homesOk = byId("calling").textContent === "Calm and Focused" && byId("purpose").textContent === "To help people grow";
  console.log("Calling and purpose fill their one home:", homesOk);
  const leadOk = byId("lead-discipline").textContent === "Rule 7" && /Held 0 of 3/.test(byId("lead-why").textContent) && byId("disciplines").children.length >= 1;
  console.log("This week's lead is the discipline held least last week:", leadOk);
  const walk = (n, pred) => { if (!n || typeof n !== "object") return null; if (pred(n)) return n; for (const k of n.children || []) { const f = walk(k, pred); if (f) return f; } return null; };
  const heldBtn = walk(byId("disciplines"), n => n.class === "held");
  if (heldBtn) heldBtn.dispatch("click"); // first tap: Held
  walk(byId("disciplines"), n => n.class === "held").dispatch("click"); // second tap: N/A
  byId("lead-pick").value = "d3"; byId("lead-pick").dispatch("change"); // choose this week's lead
  const pinnedOk = byId("lead-discipline").textContent === "Rule 3";
  const pv = byId("prime-video"); pv.play = () => Promise.resolve();
  const firstPart = pv.src === "video/prime-1.mp4" && byId("prime-part").textContent === "Part 1 of 8";
  pv.dispatch("ended"); // a finished part moves on to the next
  const nextPart = pv.src === "video/prime-2.mp4" && byId("prime-part").textContent === "Part 2 of 8";
  for (let k = 0; k < 10; k++) byId("prime-next").dispatch("click");
  const lastPart = pv.src === "video/prime-8.mp4"; pv.dispatch("ended"); // stays on the last part
  const primeOk = firstPart && nextPart && lastPart && pv.src === "video/prime-8.mp4" && !!walk(byId("prime-rows"), n => n.class === "pbtn" && n.href === "https://example.com/prime");
  const studyOk = primeOk && !!walk(byId("study"), n => n.class === "pbtn" && n.href === "https://example.com/hill");
  const calling = byId("calling"); calling.dataset.edit = "calling"; calling.textContent = "Calm, Focused and Playful";
  (document.listeners.focusout || []).forEach(f => f({ target: calling }));
  // Debrief with no moves yesterday: write what you did move, and it saves to yesterday.
  const findIn = (n, pred) => { if (!n || typeof n !== "object") return null; if (pred(n)) return n; for (const k of n.children || []) { const f = findIn(k, pred); if (f) return f; } return null; };
  const carried = findIn(byId("recon"), n => n.textContent === "Carried move from before" || (n.t === "Carried move from before"));
  const carriedOk = !!carried && byId("recon").children[0].textContent.startsWith("Last planned moves");
  console.log("Debrief carries in the last planned day when yesterday had none:", carriedOk);
  const firstY = findIn(byId("recon"), n => n.id === "ymove-0");
  if (firstY) { firstY.value = "Sent the Acme proposal"; firstY.dispatch("change"); }
  // Full rock editing, saved to monday.com: rename a step, change status, set a date, add a step.
  const find = (n, pred) => { if (!n || typeof n !== "object") return null; if (pred(n)) return n; for (const k of n.children || []) { const f = find(k, pred); if (f) return f; } return null; };
  const rocksBox = byId("rocks-mine"), rock = rocksBox.children[0];
  const sync = (n) => { n.dataset = { item: n["data-item"], mfield: n["data-mfield"], orig: n["data-orig"], prefix: n["data-prefix"], sub: n["data-sub"] }; return n; };
  const fire = (type, target) => (rocksBox.listeners[type] || []).forEach(f => f({ target, preventDefault() {} }));
  const nextSpan = find(rock, n => n.class === "next-t");
  if (nextSpan) { sync(nextSpan).textContent = "Wire the setup (Part 3 rows 1-6)"; fire("focusout", nextSpan); }
  const sel = find(rock, n => n.id === "select");
  if (sel) { sel.dataset = { item: sel["data-item"] }; sel.value = "Off-Track"; fire("change", sel); }
  const due = find(rock, n => n.class === "due-t");
  if (due) { sync(due).textContent = "1/12/2026"; fire("focusout", due); }
  const addRow = find(rock, n => n.class === "addstep");
  if (addRow) { addRow.children[0].value = "Book the privacy lawyer"; addRow.children[1].dispatch("click"); }
  const tick = find(rock, n => n.class === "tick");
  if (tick) tick.dispatch("click");
  const ups = mcpCalls.filter(([sv, tl]) => sv === "monday.com" && tl === "update_items").map(([, , i]) => [i.updates[0].itemId, JSON.parse(i.updates[0].columnValues)]);
  const made = mcpCalls.find(([sv, tl]) => sv === "monday.com" && tl === "create_item");
  const upBoards = mcpCalls.filter(([sv, tl]) => sv === "monday.com" && tl === "update_items").map(([, , i]) => [i.updates[0].itemId, i.updates[0].boardId]);
  const rockOk = ups.some(([id, c]) => id === 42 && c.name === "Wire the setup (Part 3 rows 1-6)")
    && ups.some(([id, c]) => id === 1 && c.status && c.status.label === "Off-Track")
    && ups.some(([id, c]) => id === 1 && c.date4 && c.date4.date === "2026-12-01")
    && ups.some(([id, c]) => id === 42 && c.status && c.status.label === "On Track")
    && upBoards.filter(([id]) => id === 42).length > 0 && upBoards.filter(([id]) => id === 42).every(([, b]) => b === 910002)
    && upBoards.filter(([id]) => id === 1).every(([, b]) => b === 910001)
    && !!made && made[2].parentItemId === 1 && made[2].name === "Book the privacy lawyer" && made[2].boardId === 910001;
  console.log("Rocks edit on the page and save to monday.com (rename, status, date, new step):", rockOk);
  const big = byId("m0");
  console.log("BIG move editable:", big.readOnly === false);
  big.value = "Close Acme this week"; document.activeElement = big; big.dispatch("input");
  const inf = byId("f-influence"); inf.value = "Understand the pilot · Feel safe · Do book a date"; inf.dispatch("input");
  document.hidden = true; (document.listeners.visibilitychange || []).forEach(f => f()); // switch away straight after typing
  setTimeout(() => {
    const w = writes.filter(([p]) => p.startsWith("log/")).pop();
    console.log("saved on switch-away:", !!w && JSON.stringify(w[1].moves && w[1].moves[0]));
    const yw = writes.filter(([p]) => p.startsWith("log/") && p !== "log/" + w[0].slice(4)).pop();
    const yOk = !!yw && yw[1].moves[0].text === "Sent the Acme proposal";
    console.log("A missed day's move can be added in Debrief:", yOk);
    const infOk = !!w && w[1].influence === "Understand the pilot · Feel safe · Do book a date";
    console.log("The understand-feel-do line saves with the day:", infOk);
    console.log("status:", byId("status").textContent);
    // People to reach out to: Reach out fills the next empty move, Done stamps today and saves.
    const row = byId("people").children[0].children[0], [reach, done] = row.children[1].children;
    reach.dispatch("click");
    const reachOk = !reach.disabled && byId("m1").value.startsWith("Reach out to Robin Hale");
    console.log("Reach out fills move 2:", reachOk);
    done.dispatch("click");
    setTimeout(() => {
      const pw = writes.filter(([p]) => p === "pwp/people").pop();
      const doneOk = !!pw && pw[1].people[0].name === "Robin Hale" && /^\d{4}-\d{2}-\d{2}T/.test(pw[1].people[0].done)
        && byId("people").children[0].children.length === 1 && pw[1].people.length === 2; // done long ago: hidden, but kept
      console.log("Done saves the list:", doneOk);
      // Claude's pick: three ranked options, a prompt that weighs leverage and remembers, Use on option 2 records it.
      const prompt = prompts[0] || "";
      const pickOk = byId("impact-move").textContent.startsWith("Book the Beta pilot") && !byId("impact-alts").hidden
        && /leverage over urgency/.test(prompt) && /thisWeeksDiscipline":"Rule 7"/.test(prompt) && /recentPicks/.test(prompt) && /priority rock/.test(prompt);
      console.log("Pick shows three ranked options:", pickOk);
      const alt = byId("impact-alts").children[1].children[1].children[0]; // [label "Or", option 2, option 3] > [text, [Use, Not for me]]
      alt.dispatch("click");
      setTimeout(() => {
        const cw = writes.filter(([p]) => p === "pwp/content").pop();
        const editOk = !!cw && cw[1].calling === "Calm, Focused and Playful" && cw[1].purpose === "To help people grow";
        console.log("Editing the calling in the hero saves it:", editOk);
        const kw = writes.filter(([p]) => p === "pwp/picks").pop();
        const useOk = byId("m0").value.startsWith("Rock 2 · Invite two leaders") && !!kw && Object.values(kw[1].days).some(d => d.chosen === "Invite two leaders to the Roundtable" && d.options.length === 3);
        console.log("Use on option 2 sets the BIG move and remembers it:", useOk);
        // The used pick shows Locked (green); a second click changes nothing; picking another moves the lock.
        const lockAlt = alt.textContent === "Locked" && alt["aria-pressed"] === "true" && byId("impact-use").textContent === "Use as my BIG move";
        const m0Before = byId("m0").value, m1Before = byId("m1").value, m2Before = byId("m2").value;
        alt.dispatch("click");
        const noDup = byId("m0").value === m0Before && byId("m1").value === m1Before && byId("m2").value === m2Before;
        byId("impact-use").dispatch("click");
        const lockTop = byId("impact-use").textContent === "Locked" && byId("impact-use").dataset.locked === "" && alt.textContent === "Use" && alt["aria-pressed"] === "false" && byId("m0").value.startsWith("Rock 4");
        const lockOk = lockAlt && noDup && lockTop;
        console.log("Used pick shows Locked, no duplicate, lock follows the BIG move:", lockOk);
        // Not for me on option 3, with a reason: the reason is remembered and only that option is replaced.
        const row3 = byId("impact-alts").children[2];
        row3.children[1].children[1].dispatch("click");
        const form = row3.children[2];
        form.children[0].value = "Pat is already booked for Thursday"; form.children[1].dispatch("click");
        // The summit: cash is a yearly check-in, saved against the most recent 30 June.
        byId("cash-in").value = "850k"; byId("cash-log").dispatch("click");
        const cash = writes.filter(([p]) => p === "pwp/cash").pop();
        const fyOk = !!cash && /^\d{4}-06-30$/.test(cash[1].checkins[0].date) && cash[1].checkins[0].amount === 850000;
        console.log("A cash check-in saves against 30 June:", fyOk);
        setTimeout(() => {
          const pk = writes.filter(([p]) => p === "pwp/picks").pop(), day = pk && Object.values(pk[1].days)[0];
          const nopeOk = !!pk && pk[1].feedback.some(f => f.why === "Pat is already booked for Thursday" && /Pat Taylor/.test(f.move))
            && /exactly 1\]/.test(prompts[prompts.length - 1]) && /already booked for Thursday/.test(prompts[prompts.length - 1])
            && day.options.length === 3 && day.options[2].move.startsWith("Draft the Beta pilot") && day.options[1].move.startsWith("Invite two leaders");
          console.log("Not for me remembers the reason and replaces only that option:", nopeOk);
          const dw = writes.filter(([p]) => p === "pwp/disciplines").pop();
          const rec = dw && dw[1].days[sydToday];
          const discOk = !!rec && rec.na.includes("d0") && !rec.held.includes("d0") && Object.keys(dw[1].days).length === 4
            && dw[1].leads[mondayOf(sydToday).toISOString().slice(0, 10)] === "d3" && Array.isArray(dw[1].days[lastWeek[0]].held) && pinnedOk && studyOk;
          console.log("Ticking a discipline saves it against the day:", discOk);
        process.exit(lockOk && discOk && leadOk && carriedOk && rockOk && yOk && infOk && nopeOk && fyOk && homesOk && editOk && reachOk && doneOk && pickOk && useOk && w && w[1].moves && w[1].moves[0].text === "Close Acme this week" ? 0 : 1);
        }, 50);
      }, 50);
    }, 50);
  }, 50);
}, 50);
