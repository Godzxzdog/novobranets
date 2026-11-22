import assert from 'node:assert/strict';
import test from 'node:test';

import { approach, atmosphereFor } from '../web/atmosphere.js';
import { chartCaption, routeStripSvg, scissorsPoint, statsChartSvg } from '../web/visuals.js';
import { Run } from '../src/run.ts';
import { TEST_CARDS, TEST_ENDINGS } from '../data/test-content.ts';

const base = (over: Record<string, unknown> = {}, stats: Record<string, number> = {}) => ({
  phase: 2,
  day: 8,
  stats: { health: 7, energy: 7, supplies: 5, trust: 6, understanding: 2, bonds: 4, ...stats },
  ...over,
});

test('мряка густішає з фазою й виснаженням', () => {
  const early = atmosphereFor(base({ phase: 1, day: 1 }));
  const late = atmosphereFor(base({ phase: 5, day: 45 }));
  const worn = atmosphereFor(base({ phase: 3 }, { health: 2, energy: 1, supplies: 1 }));
  const fine = atmosphereFor(base({ phase: 3 }));
  assert.ok(late.fog > early.fog);
  assert.ok(worn.fog > fine.fog);
});

test('розуміння розвіює мряку, але не прибирає її повністю', () => {
  const blind = atmosphereFor(base({ phase: 4 }, { understanding: 0 }));
  const sees = atmosphereFor(base({ phase: 4 }, { understanding: 10 }));
  assert.ok(sees.fog < blind.fog);
  assert.ok(sees.fog >= 0.06);
  assert.ok(blind.fog - sees.fog <= 0.31, 'ясність має стелю');
});

test('краї темніють лише після безпечних днів, у фіналі — майже повністю', () => {
  assert.equal(atmosphereFor(base({ day: 10 })).dark, 0);
  assert.ok(atmosphereFor(base({ day: 40 })).dark > atmosphereFor(base({ day: 25 })).dark);
  assert.equal(atmosphereFor(base({ status: 'ended' })).dark, 0.9);
});

test('значення мряки завжди в межах 0..1', () => {
  for (const phase of [1, 2, 3, 4, 5]) {
    for (const v of [0, 5, 10]) {
      const a = atmosphereFor(base({ phase, day: phase * 12 }, { health: v, energy: v, supplies: v, understanding: v }));
      for (const k of ['fog', 'rain', 'dark'] as const) assert.ok(a[k] >= 0 && a[k] <= 1, `${k}=${a[k]}`);
    }
  }
});

test('approach плавно наближається і зупиняється', () => {
  let v = 0;
  for (let i = 0; i < 400; i += 1) v = approach(v, 1);
  assert.equal(v, 1);
  assert.ok(approach(0, 1) < 0.1);
});

test('смуга шляху: валідний SVG, мітка поточного дня, межі долі', () => {
  const run = new Run({ seed: 'strip', content: { cards: TEST_CARDS, endings: TEST_ENDINGS } });
  for (let i = 0; i < 30 && run.state.status === 'running'; i += 1) {
    if (!run.draw()) break;
    run.choose(run.availableOptions()[0]!.id);
  }
  const svg = routeStripSvg(run.state, run.director);
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.match(svg, new RegExp(`день ${Math.min(run.state.day, 60)} з 60`));
  assert.match(svg, /безпечні дні/);
  assert.match(svg, /неминучість росте щодня/);
});

test('смуга шляху показує посіяні наслідки пунктиром', () => {
  const run = new Run({ seed: 'strip2', content: { cards: TEST_CARDS, endings: TEST_ENDINGS } });
  let planted = false;
  for (let g = 0; g < 200 && run.state.status === 'running'; g += 1) {
    if (!run.draw()) break;
    const o = run.availableOptions().find((x) => x.next) ?? run.availableOptions()[0]!;
    run.choose(o.id);
    if ((run.state.queue ?? []).length > 0) { planted = true; break; }
  }
  assert.ok(planted, 'жоден вибір не посіяв наслідок');
  assert.match(routeStripSvg(run.state, run.director), /наслідок, що дозріває/);
});

test('історія показників пишеться після кожного рішення', () => {
  const run = new Run({ seed: 'hist', content: { cards: TEST_CARDS, endings: TEST_ENDINGS } });
  let n = 0;
  while (run.state.status === 'running' && n < 25) {
    if (!run.draw()) break;
    run.choose(run.availableOptions()[0]!.id);
    n += 1;
  }
  assert.equal(run.state.history?.length, run.state.decisions);
  const snap = run.snapshot();
  snap.history![0]!.stats.trust = 999;
  assert.notEqual(run.state.history![0]!.stats.trust, 999, 'snapshot має копіювати історію');
});

test('графік: порожньо без даних, SVG із даними, «ножиці» знаходяться', () => {
  assert.equal(statsChartSvg([]), '');
  const mk = (t: number, u: number, i: number) => ({ day: i + 1, decision: i + 1, stats: { health: 7, energy: 7, supplies: 5, trust: t, understanding: u, bonds: 4 } });
  const crossing = [mk(6, 2, 0), mk(7, 3, 1), mk(6, 5, 2), mk(5, 7, 3), mk(4, 8, 4)];
  const sp = scissorsPoint(crossing);
  assert.equal(sp?.decision, 4);
  const svg = statsChartSvg(crossing);
  assert.match(svg, /<polyline/);
  assert.match(svg, /розуміння обігнало довіру/);
  assert.match(chartCaption(crossing), /перевищило довіру на рішенні №4/);

  const never = [mk(8, 2, 0), mk(9, 3, 1), mk(9, 3, 2)];
  assert.equal(scissorsPoint(never), null);
  assert.match(chartCaption(never), /Довіра так і лишилась/);
});
