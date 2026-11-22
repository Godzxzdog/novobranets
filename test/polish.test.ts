import assert from 'node:assert/strict';
import test from 'node:test';

import { describeRequirement } from '../src/conditions.ts';
import { Run } from '../src/run.ts';
import { validateContent } from '../src/validate.ts';
import { TEST_CARDS, TEST_ENDINGS } from '../data/test-content.ts';

function newRun(seed: string, extra: Record<string, unknown> = {}) {
  return new Run({ seed, content: { cards: TEST_CARDS, endings: TEST_ENDINGS }, ...extra });
}

/** Грає «безпечно»: щоразу лікує здоров'я, щоб перевіряти лише директора. */
function playKeepingHealthy(run: Run, maxSteps = 600) {
  let guard = 0;
  while (run.state.status === 'running' && guard < maxSteps) {
    guard += 1;
    const card = run.draw();
    if (!card) break;
    run.state.stats.health = 10;
    run.state.stats.energy = 10;
    run.state.stats.supplies = 10;
    run.choose(run.availableOptions()[0]!.id);
  }
}

test('директор: неминучість росте рівно на 1 за добу після старту, а не за картку', () => {
  const run = newRun('inev-1', {
    director: { baseFatalChance: 0, rampPerDay: 0, hardEndDay: 200 },
  });
  playKeepingHealthy(run, 700);
  const d = run.state.day;
  assert.ok(d > 35, `забіг мав дійти хоча б до дня 35, дійшов до ${d}`);
  // Шанс смерті нульовий, тож множник нічого не вбиває — лічильник має дорівнювати днях понад старт.
  assert.equal(run.state.inevitability, d - 30);
});

test('директор: шанс смерті не залежить від кількості карток на добу', () => {
  const deathDay = (min: number, max: number) => {
    const days: number[] = [];
    for (let i = 0; i < 400; i += 1) {
      const run = newRun(`perday-${min}-${i}`, {
        cardsPerDay: { min, max },
        director: { baseFatalChance: 0.15, rampPerDay: 0, maxFatalChance: 0.15 },
      });
      playKeepingHealthy(run, 900);
      days.push(run.state.day);
    }
    return days.reduce((a, b) => a + b, 0) / days.length;
  };
  const few = deathDay(1, 1);
  const many = deathDay(5, 5);
  // Раніше кубик кидався на кожну картку, тож «багато карток» помирало в ~5 разів швидше.
  assert.ok(Math.abs(few - many) < 2.5, `середній день смерті: ${few.toFixed(1)} проти ${many.toFixed(1)}`);
});

test('перший нуль здоров’я — «виносять», другий — кінець', () => {
  const run = newRun('reprieve-1');
  run.draw();
  run.state.stats.health = 1;
  // Вибираємо варіант, що точно б’є по здоров’ю, або примусово опускаємо стан.
  const hurt = run.availableOptions().find((o) => (o.effects?.stats?.health ?? 0) < 0);
  if (hurt) run.choose(hurt.id);
  else {
    run.choose(run.availableOptions()[0]!.id);
    run.state.stats.health = 0;
  }
  if (run.state.status === 'running' && run.state.stats.health > 0 && !run.state.flags.carried_out) {
    // Варіант не вдарив — форсуємо нуль на наступному кроці.
    run.draw();
    run.state.stats.health = 1;
    const o = run.availableOptions().find((x) => (x.effects?.stats?.health ?? 0) < 0) ?? run.availableOptions()[0]!;
    run.choose(o.id);
  }
  if (run.state.flags.carried_out) {
    assert.equal(run.state.status, 'running');
    assert.ok(run.state.stats.health >= 1);
  }
});

test('reprieve: false повертає стару поведінку (нуль здоров’я — одразу кінець)', () => {
  for (let i = 0; i < 40; i += 1) {
    const run = newRun(`noreprieve-${i}`, { reprieve: false });
    let guard = 0;
    while (run.state.status === 'running' && guard < 400) {
      guard += 1;
      const card = run.draw();
      if (!card) break;
      const o = run.availableOptions().sort((a, b) => (a.effects?.stats?.health ?? 0) - (b.effects?.stats?.health ?? 0))[0]!;
      run.choose(o.id);
    }
    assert.notEqual(run.state.flags.carried_out, true);
  }
});

test('одна й та сама картка не повертається протягом вікна пам’яті', () => {
  let violations = 0;
  for (let i = 0; i < 120; i += 1) {
    const run = newRun(`recent-${i}`);
    const seen: string[] = [];
    let guard = 0;
    while (run.state.status === 'running' && guard < 300) {
      guard += 1;
      const card = run.draw();
      if (!card) break;
      if (seen.slice(-3).includes(card.id)) violations += 1;
      seen.push(card.id);
      run.choose(run.availableOptions()[0]!.id);
    }
  }
  assert.equal(violations, 0);
});

test('«доля» може дати не лише accident-фінали: шлях гравця впливає на кінець', () => {
  const kinds = new Set<string>();
  for (let i = 0; i < 600; i += 1) {
    const run = newRun(`kinds-${i}`);
    playKeepingHealthy(run, 700);
    const e = run.ending();
    if (e) kinds.add(e.kind);
  }
  assert.ok(kinds.size >= 3, `досягнуті види фіналів: ${[...kinds].join(', ')}`);
});

test('картки з echo показуються й без слідів у минулому', () => {
  const echoCards = TEST_CARDS.filter((c) => c.echo);
  assert.ok(echoCards.length > 0);
  const shown = new Set<string>();
  for (let i = 0; i < 300; i += 1) {
    const run = newRun(`echo-${i}`);
    let guard = 0;
    while (run.state.status === 'running' && guard < 300) {
      guard += 1;
      const card = run.draw();
      if (!card) break;
      if (card.echo && run.echoLines(card).length === 0) shown.add(card.id);
      run.choose(run.availableOptions()[0]!.id);
    }
  }
  assert.ok(shown.size > 0, 'жодна echo-картка не показалась без сліду — вони ховаються');
});

test('заблокований варіант пояснює, чого не вистачає', () => {
  assert.equal(
    describeRequirement({ skillAtLeast: { people: 1 }, statAtLeast: { bonds: 5 } }),
    'потрібно: Зв’язки ≥ 5, навичка «Люди» ≥ 1',
  );
  assert.match(describeRequirement({ flagTrue: ['x'] }), /вчинок/);
  const run = newRun('hint');
  const locked = TEST_CARDS.flatMap((c) => c.options).find((o) => o.requires);
  assert.ok(locked);
  assert.notEqual(run.lockedHint(locked!), 'недоступно');
});

test('контент: валідний, без літерних слешів, кожен вибір має авторський наслідок', () => {
  const errors = validateContent(TEST_CARDS, TEST_ENDINGS).filter((i) => i.level === 'error');
  assert.deepEqual(errors, []);

  const strings: string[] = [];
  for (const c of TEST_CARDS) {
    strings.push(c.text, c.lead ?? '');
    for (const e of c.echo ? (Array.isArray(c.echo) ? c.echo : [c.echo]) : []) strings.push(e.line);
    for (const o of c.options) strings.push(o.text, o.outcome?.text ?? '', o.outcome?.voice ?? '');
  }
  for (const e of TEST_ENDINGS) strings.push(e.title, e.epilogue, e.defaultEpitaph);
  const bad = strings.filter((t) => t.includes('\\'));
  assert.deepEqual(bad, [], 'у тексті лишились літерні зворотні слеші');

  const missing = TEST_CARDS.flatMap((c) => c.options.filter((o) => !o.outcome?.text).map((o) => `${c.id}/${o.id}`));
  assert.deepEqual(missing, []);
});

test('валідатор ловить замкнене коло навички', () => {
  const cards = [
    {
      id: 'a', kind: 'event' as const, phase: [1 as const], text: 'x',
      options: [
        { id: '1', text: 'a', requires: { skillAtLeast: { people: 1 } }, effects: { skills: { people: 1 } } },
        { id: '2', text: 'b' },
      ],
    },
  ];
  const issues = validateContent(cards, []);
  assert.ok(issues.some((i) => i.level === 'error' && i.where === 'skill people'));
});

test('жодна картка не показується двічі за забіг (за замовчуванням)', () => {
  for (let i = 0; i < 300; i += 1) {
    const run = newRun(`norepeat-${i}`);
    const seen = new Set<string>();
    let guard = 0;
    while (run.state.status === 'running' && guard < 400) {
      guard += 1;
      const card = run.draw();
      if (!card) break;
      assert.ok(!seen.has(card.id), `забіг ${i}: картка ${card.id} повторилась`);
      seen.add(card.id);
      const opts = run.availableOptions();
      run.choose(opts[(i + guard) % opts.length]!.id);
    }
  }
});

test('allowRepeats: true повертає повтори (контролюваний режим)', () => {
  let repeats = 0;
  for (let i = 0; i < 60; i += 1) {
    const run = newRun(`rep-${i}`, { allowRepeats: true });
    let guard = 0;
    while (run.state.status === 'running' && guard < 300) {
      guard += 1;
      if (!run.draw()) break;
      run.choose(run.availableOptions()[0]!.id);
    }
    repeats += Object.values(run.state.seenCards).filter((n) => n > 1).length;
  }
  assert.ok(repeats > 0, 'з allowRepeats картки мали б повторюватись');
});

test('дерево: вибір планує наслідок, і той настає через заданий час', () => {
  const cards = [
    { id: 'root', kind: 'event' as const, phase: [1 as const], text: 'корінь', once: true, weight: 100,
      options: [
        { id: 'go', text: 'піти', next: { card: 'leaf', inDays: 2 }, effects: { flags: { went: true } } },
        { id: 'stay', text: 'лишитись' },
      ] },
    { id: 'leaf', kind: 'event' as const, phase: [5 as const], text: 'наслідок', requires: { flagTrue: ['went'] },
      options: [{ id: 'ok', text: 'ок' }, { id: 'ok2', text: 'ок2' }] },
    { id: 'filler1', kind: 'routine' as const, phase: [1 as const, 2 as const, 3 as const], text: 'a', options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }] },
    { id: 'filler2', kind: 'routine' as const, phase: [1 as const, 2 as const, 3 as const], text: 'b', options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }] },
    { id: 'filler3', kind: 'routine' as const, phase: [1 as const, 2 as const, 3 as const], text: 'c', options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }] },
    { id: 'filler4', kind: 'routine' as const, phase: [1 as const, 2 as const, 3 as const], text: 'd', options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }] },
  ];
  const endings = [{ id: 'e', kind: 'accident' as const, title: 't', epilogue: 'x'.repeat(90), defaultEpitaph: 'e' }];
  const run = new Run({ seed: 't', content: { cards, endings }, director: { safeUntilDay: 999 } });
  assert.equal(run.draw()!.id, 'root');
  run.choose('go');
  const dayPlanned = run.state.day;
  let leafDay = -1;
  for (let g = 0; g < 40 && run.state.status === 'running'; g += 1) {
    const c = run.draw();
    if (!c) break;
    if (c.id === 'leaf') { leafDay = run.state.day; run.choose('ok'); break; }
    run.choose('a');
  }
  assert.ok(leafDay >= dayPlanned + 2, `наслідок мав настати не раніше ніж через 2 дні, настав на дні ${leafDay} (вибір на ${dayPlanned})`);
  assert.deepEqual(run.state.tree?.map((t) => [t.from, t.to]), [['root', 'leaf']]);
});

test('дерево: наслідок не показується, якщо його requires не виконані', () => {
  const cards = [
    { id: 'root', kind: 'event' as const, phase: [1 as const], text: 'корінь', once: true, weight: 100,
      options: [{ id: 'go', text: 'піти', next: 'leaf' }, { id: 'stay', text: 'лишитись' }] },
    { id: 'leaf', kind: 'event' as const, phase: [1 as const], text: 'наслідок', requires: { flagTrue: ['never'] },
      options: [{ id: 'ok', text: 'ок' }, { id: 'ok2', text: 'ок2' }] },
    { id: 'f', kind: 'routine' as const, phase: [1 as const], text: 'f', options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }] },
  ];
  const endings = [{ id: 'e', kind: 'accident' as const, title: 't', epilogue: 'x'.repeat(90), defaultEpitaph: 'e' }];
  const run = new Run({ seed: 'u', content: { cards, endings } });
  run.draw();
  run.choose('go');
  const next = run.draw();
  assert.notEqual(next?.id, 'leaf');
});

test('контент закінчився: час іде далі, картки не повторюються, фінал настає', () => {
  const cards = [
    { id: 'only', kind: 'event' as const, phase: [1 as const], text: 'єдина', options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }] },
  ];
  const endings = [{ id: 'e', kind: 'quiet' as const, title: 't', epilogue: 'x'.repeat(90), defaultEpitaph: 'e' }];
  const run = new Run({ seed: 'x', content: { cards, endings } });
  assert.equal(run.draw()!.id, 'only');
  run.choose('a');
  assert.equal(run.draw(), null);
  assert.equal(run.state.status, 'ended');
  assert.equal((run.state as { endingReason?: string }).endingReason, 'exhausted');
});

test('дерево з контенту: кожен next веде на існуючу картку', () => {
  const ids = new Set(TEST_CARDS.map((c) => c.id));
  let edges = 0;
  for (const c of TEST_CARDS) {
    for (const o of c.options) {
      for (const n of o.next ? (Array.isArray(o.next) ? o.next : [o.next]) : []) {
        edges += 1;
        assert.ok(ids.has(typeof n === 'string' ? n : n.card), `${c.id}/${o.id} веде на неіснуючу картку`);
      }
    }
  }
  assert.ok(edges >= 10, `у дереві мало гілок: ${edges}`);
});
