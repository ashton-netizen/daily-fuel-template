// Rocks "Next" step in plain Node, no browser: pulls shapeMine out of the page and runs it on
// board-shaped items. Usage: node tests/rocks_check.js <page>
const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(process.argv[2], "utf8");
const fn = src.match(/  const col = \(it, id\)[\s\S]*?\n  function shapeCompany/)[0].replace(/\n  function shapeCompany$/, "");
const ctx = { MY_GROUP: "group_mine", MON: { workspaceUrl: "https://example.monday.com/", companyGroupMatch: "company rocks", columns: { status: "status", due: "date4", stepDue: "date0", outcome: "", owner: ["person"] } }, state: { today: "2026-10-03" }, daysBetween: (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000) };
vm.createContext(ctx);
vm.runInContext(fn + "; this.shapeMine = shapeMine;", ctx);
// Board shape: Ash's rocks sit in group_mine, their steps are subitems (status null = not started).
const step = (name, date, status, updated) => ({ id: name.length, name, updated_at: updated, column_values: { status: status || null, date0: date } });
const rock = (name, steps) => ({ id: name.length, name, group: { id: "group_mine" }, column_values: { status: "On Track", date4: "2026-12-24" }, subitems: steps });
const rocks = ctx.shapeMine({ items: [
  rock("Rock 3 - Prove partners will run the Customer Audit", [
    step("Facilitator mode and attribution live", "2026-11-30"),
    step("Ask Pat Taylor and Sam Reed for one group each", "2026-10-09"),
    step("Old done step", null, "On Track", "2026-01-01T00:00:00Z"),
    step("Fresh done step", null, "On Track", new Date().toISOString())]),
  rock("Rock 4 ★ - Launch Project: Build 1 live + pilot booked", [
    step("Already shipped", null, "On Track"),
    step("Setup wired, Build 1 live", null),
    step("Stage 1 spike (2-sec median)", null),
    step("Pilot engagement named and booked", "2026-12-24")]),
  { id: 9, name: "1. Pricing Review", group: { id: "group_company" }, column_values: { status: "On Track" } },
] });
const next = Object.fromEntries(rocks.map(r => [r.name.split(" · ")[0], r.next && r.next.name]));
console.log(JSON.stringify(next));
const ok = next["Rock 4 ★"] === "Setup wired, Build 1 live" && next["Rock 3"] === "Ask Pat Taylor and Sam Reed for one group each" && rocks.length === 2 && rocks[0].all.length === 3 && !rocks[0].all.some(s => s.name === "Old done step") && rocks[0].all.some(s => s.name === "Fresh done step") && rocks[1].priority === true && rocks[1].all.length === 4 && rocks[1].steps.length === 3;
process.exit(ok ? 0 : 1);
