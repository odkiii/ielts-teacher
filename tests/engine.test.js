const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const E = require('../app/js/engine.js');
const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/data/content.json'), 'utf8'));
const resources = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/data/resources.json'), 'utf8'));

const profile = (over) => Object.assign({
  module: 'academic', target: { overall: 7.5, min: 7 }, hours: 13, start: '2026-11-02',
  skills: { L: 5, R: 5, W: 4, S: 4.5 },
}, over || {});

test('weights sum to 1, weakest skill gets most', () => {
  const w = E.weights(profile(), {});
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
  assert.ok(w.W > w.L && w.W > w.R);
});

test('weights: all at target → still every skill has ≥10%', () => {
  const w = E.weights(profile({ skills: { L: 7.5, R: 7.5, W: 7.5, S: 7.5 } }), {});
  Object.values(w).forEach((v) => assert.ok(v >= 0.1));
});

test('weeks and phases', () => {
  assert.equal(E.weekNo('2026-11-02', '2026-11-02'), 1);
  assert.equal(E.weekNo('2026-11-02', '2026-11-16'), 3);
  assert.equal(E.phaseFor(3).id, 'P1');
  assert.equal(E.phaseFor(19).id, 'P2');
  assert.equal(E.phaseFor(35).id, 'P3');
  assert.equal(E.phaseFor(60).id, 'BUF');
});

test('dayTasks is deterministic and fits the budget for a whole year', () => {
  const p = profile();
  for (let i = 0; i < 365; i++) {
    const d = E.addDays(p.start, i);
    const a = E.dayTasks(p, d, content, resources, []);
    const b = E.dayTasks(p, d, content, resources, []);
    assert.deepStrictEqual(a, b);
    assert.ok(a.tasks.length >= 2, d);
    a.tasks.forEach((t) => { assert.ok(t.title && t.minutes >= 5, d + ' ' + t.title); });
    const weekly = 13 * 60;
    assert.ok(a.total <= weekly * 0.3, d + ' total ' + a.total);
  }
});

test('weekly total is close to hours budget (non-light, non-P0 week)', () => {
  const p = profile();
  let total = 0;
  for (let i = 0; i < 7; i++) total += E.dayTasks(p, E.addDays('2026-11-30', i), content, resources, []).total;
  assert.ok(total > 13 * 60 * 0.8 && total < 13 * 60 * 1.2, 'total ' + total);
});

test('General module gets letters on Task-1 days', () => {
  const p = profile({ module: 'general' });
  const titles = [];
  for (let i = 0; i < 250; i++) E.dayTasks(p, E.addDays(p.start, i), content, resources, []).tasks.forEach((t) => titles.push(t.title));
  assert.ok(titles.some((t) => t.includes('письмо')));
  assert.ok(!titles.some((t) => t.includes('Task 1 (Academic)')));
});

test('no british-council resources are assigned', () => {
  const p = profile();
  const bad = new Set(resources.filter((r) => r.ru_risk === true).map((r) => r.id));
  for (let i = 0; i < 120; i++) E.dayTasks(p, E.addDays(p.start, i), content, resources, []).tasks.forEach((t) => { if (t.resource) assert.ok(!bad.has(t.resource.id)); });
});

test('error tags bias drills', () => {
  const p = profile({ start: '2026-11-02' });
  const errs = Array.from({ length: 6 }, () => ({ date: '2026-12-01', tag: 'L-SPELL' }));
  let hit = false;
  for (let i = 28; i < 56; i++) E.dayTasks(p, E.addDays(p.start, i), content, resources, errs).tasks.forEach((t) => { if (/орфограф/.test(t.title)) hit = true; });
  assert.ok(hit);
});

test('SRS intervals grow, again resets', () => {
  const c = E.newCard('a', 'b', 'x');
  E.review(c, 2, '2026-11-02'); assert.equal(c.interval, 1);
  E.review(c, 2, '2026-11-03'); assert.equal(c.interval, 4);
  E.review(c, 2, '2026-11-07'); assert.ok(c.interval >= 9);
  E.review(c, 0, '2026-11-20'); assert.equal(c.reps, 0); assert.equal(c.due, '2026-11-20');
});

test('overall rounding and raw→band', () => {
  assert.equal(E.overall(6.5, 6.5, 6, 6), 6.5); // 6.25 → 6.5
  assert.equal(E.overall(7, 7, 6.5, 7), 7);     // 6.875 → 7.0
  assert.equal(E.overall(6, 6.5, 7, 7), 6.5);   // 6.625 → 6.5
  assert.equal(E.rawToBand('listening', 32), 7.5);
  assert.equal(E.rawToBand('reading_general', 34), 7);
});
