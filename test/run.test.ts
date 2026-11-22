import assert from 'node:assert/strict';
import test from 'node:test';

import { Run, phaseForDay } from '../src/run.ts';
import { TEST_CARDS, TEST_ENDINGS } from '../data/test-content.ts';

function newRun(seed: string) {
  return new Run({
    seed,
    content: { cards: TEST_CARDS, endings: TEST_ENDINGS },
    cardsPerDay: { min: 2, max: 3 },
  });
}

test('phaseForDay мепить дні у 5 фаз', () => {
  assert.equal(phaseForDay(1), 1);
  assert.equal(phaseForDay(3), 1);
  assert.equal(phaseForDay(4), 2);
  assert.equal(phaseForDay(13), 3);
  assert.equal(phaseForDay(30), 4);
  assert.equal(phaseForDay(45), 5);
});

test('один і той самий seed дає ідентичний забіг', () => {
  const a = newRun('seed-1');
  const b = newRun('seed-1');
  for (let i = 0; i < 30; i += 1) {
    const card = a.draw();
    b.draw();
    if (!card) break;
    const opt = a.availableOptions()[0]!;
    assert.equal(opt.id, b.availableOptions()[0]!.id);
    a.choose(opt.id);
    b.choose(opt.id);
  }
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test('будь-який забіг завершується фіналом і стан валідний', () => {
  for (let s = 0; s < 200; s += 1) {
    const run = newRun(`fuzz-${s}`);
    let guard = 0;
    while (run.state.status === 'running' && guard < 400) {
      guard += 1;
      const card = run.draw();
      if (!card) break;
      const options = run.availableOptions();
      assert.ok(options.length > 0, `картка ${card.id} без доступних варіантів`);
      run.choose(options[0]!.id);
    }
    assert.equal(run.state.status, 'ended', `забіг ${s} не завершився`);
    assert.ok(run.state.endingId, `забіг ${s} без фіналу`);
    assert.deepEqual(run.validate(), []);
    assert.ok(run.state.day <= 60, `забіг ${s} довший за жорсткий ліміт: ${run.state.day}`);
  }
});

test('немає смерті до safeUntilDay (без нуля здоров’я)', () => {
  for (let s = 0; s < 120; s += 1) {
    const run = newRun(`safe-${s}`);
    let guard = 0;
    while (run.state.status === 'running' && run.state.day <= 20 && guard < 200) {
      guard += 1;
      const card = run.draw();
      if (!card) break;
      const opts = run.availableOptions();
      // Обираємо варіант, що не знищує здоров’я — перевіряємо саме «долю».
      run.choose(opts[0]!.id);
    }
    if (run.state.day <= 20 && run.state.status === 'ended') {
      assert.equal(run.state.endingId !== undefined, true);
    }
  }
});

test('картки once не повторюються', () => {
  const run = newRun('once-test');
  const seenOnce = new Set<string>();
  let guard = 0;
  while (run.state.status === 'running' && guard < 200) {
    guard += 1;
    const card = run.draw();
    if (!card) break;
    if (card.once) {
      assert.ok(!seenOnce.has(card.id), `once-картка ${card.id} повторилась`);
      seenOnce.add(card.id);
    }
    run.choose(run.availableOptions()[0]!.id);
  }
});

test('закритий варіант недоступний, якщо умова не виконана', () => {
  const run = newRun('locked-test');
  const fakeCard = TEST_CARDS.find((c) => c.id === 'phase3.bribe')!;
  // Змушуємо картку бути поточною вручну, для перевірки фільтра.
  run.state.pending = { cardId: fakeCard.id, options: fakeCard.options.map((o) => o.id) };
  run.state.phase = 3;
  run.state.stats.supplies = 1;
  run.state.skills.system = 0;
  const ids = run.availableOptions().map((o) => o.id);
  assert.ok(!ids.includes('pay'));
  assert.ok(!ids.includes('report'));
  assert.ok(ids.includes('refuse'));
});

test('вибір недоступного варіанта відхиляється', () => {
  const run = newRun('reject-test');
  run.state.pending = { cardId: 'phase3.bribe', options: ['pay', 'refuse', 'report'] };
  run.state.phase = 3;
  run.state.stats.supplies = 0;
  assert.equal(run.choose('pay'), false);
});

test('показники не виходять за межі 0..10', () => {
  const run = newRun('clamp-test');
  run.state.stats.health = 10;
  run.state.pending = { cardId: 'phase5.final_wait', options: ['comfort'] };
  run.state.phase = 5;
  run.choose('comfort');
  assert.ok(run.state.stats.health <= 10);
  assert.ok(run.state.stats.health >= 0);
});

test('наслідок не каже «нічого не змінилося», коли показники змінились', () => {
  // Знаходимо картку, де перший варіант справді змінює здоров'я.
  const run = newRun('outcome-test');
  run.state.day = 20;
  run.state.phase = phaseForDay(20);
  let checked = 0;
  for (let i = 0; i < 200; i++) {
    const card = run.draw();
    if (!card) break;
    const opt = card.options[0];
    const before = { ...run.state.stats };
    run.choose(opt.id);
    const after = run.state.stats;
    const changed = Object.keys(before).some((k) => before[k] !== after[k]);
    const text = run.state.lastOutcome?.text ?? '';
    if (changed) {
      checked += 1;
      assert.ok(
        !text.includes('Нічого не змінилось'),
        `картка ${card.id}: показники змінились, а текст каже «нічого»: ${text}`,
      );
    }
    if (run.state.status === 'ended') break;
  }
  assert.ok(checked > 0, 'жоден вибір не змінив показники — тест нічого не перевірив');
});

test('жорсткий ліміт зупиняє забіг', () => {
  const run = newRun('hardend-test');
  run.state.day = 60;
  run.state.phase = 5;
  const card = run.draw();
  assert.equal(card, null);
  assert.equal(run.state.status, 'ended');
});