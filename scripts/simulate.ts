// Симулятор: проганяє тисячі забігів різними «стилями гравця» й показує баланс.
// Запуск: npm run sim
import { Run } from '../src/run.ts';
import { TEST_CARDS, TEST_ENDINGS } from '../data/test-content.ts';
import type { ChoiceOption } from '../src/types.ts';

type Strategy = {
  name: string;
  pick: (options: ChoiceOption[], run: Run) => ChoiceOption;
  /** Вибір, коли варіант не покращує нічого — просто перший. */
};

const score = (o: ChoiceOption, run: Run): number => {
  const s = o.effects?.stats ?? {};
  const before = run.state.stats;
  let v = 0;
  // Цінність показників: обізнаність і зв'язки — головні, виживання — умова.
  v += (s.understanding ?? 0) * 1.4;
  v += (s.bonds ?? 0) * 1.1;
  v += (s.health ?? 0) * (before.health < 4 ? 2.2 : 1.0);
  v += (s.energy ?? 0) * (before.energy < 3 ? 1.6 : 0.8);
  v += (s.supplies ?? 0) * (before.supplies < 3 ? 1.4 : 0.6);
  v -= (s.trust ?? 0) * 0.35;
  return v;
};

const STRATEGIES: Strategy[] = [
  {
    name: 'обізнаний (understanding+bonds)',
    pick: (options, run) =>
      [...options].sort((a, b) => score(b, run) - score(a, run))[0]!,
  },
  {
    name: 'конформіст (trust)',
    pick: (options, run) => {
      const s = (o: ChoiceOption) => (o.effects?.stats?.trust ?? 0) * 2 - (o.effects?.stats?.understanding ?? 0);
      return [...options].sort((a, b) => s(b) - s(a))[0]!;
    },
  },
  {
    name: 'виживальник (health+supplies)',
    pick: (options) => {
      const s = (o: ChoiceOption) =>
        (o.effects?.stats?.health ?? 0) * 2 + (o.effects?.stats?.supplies ?? 0) + (o.effects?.stats?.energy ?? 0);
      return [...options].sort((a, b) => s(b) - s(a))[0]!;
    },
  },
  {
    name: 'випадковий',
    pick: (options, run) => {
      const idx = Math.floor(Math.abs(Math.sin(run.state.decisions + run.state.day)) * options.length);
      return options[idx % options.length]!;
    },
  },
];

function simulate(strategy: Strategy, runs: number) {
  const days: number[] = [];
  const endings = new Map<string, number>();
  const decisions: number[] = [];
  let healthZeroDeaths = 0;

  for (let i = 0; i < runs; i += 1) {
    const run = new Run({
      seed: `${strategy.name}:${i}`,
      content: { cards: TEST_CARDS, endings: TEST_ENDINGS },
      cardsPerDay: { min: 2, max: 3 },
    });
    let guard = 0;
    while (run.state.status === 'running' && guard < 400) {
      guard += 1;
      const card = run.draw();
      if (!card) break;
      const options = run.availableOptions();
      if (options.length === 0) break;
      run.choose(strategy.pick(options, run).id);
    }
    days.push(run.state.day);
    decisions.push(run.state.decisions);
    const e = run.ending();
    endings.set(e?.title ?? '—', (endings.get(e?.title ?? '—') ?? 0) + 1);
    if (e?.id === 'ending.wounds' || e?.id === 'ending.morkva') healthZeroDeaths += 1;
  }

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const pct = (xs: number[], p: number) => {
    const sorted = [...xs].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;
  };

  console.log(`\n=== ${strategy.name} ===`);
  console.log(`днів: сер ${avg(days).toFixed(1)} | медіана ${pct(days, 0.5)} | p10 ${pct(days, 0.1)} | p90 ${pct(days, 0.9)}`);
  console.log(`рішень: сер ${avg(decisions).toFixed(0)} | макс ${Math.max(...decisions)}`);
  console.log(`«швидка смерть» (здоров'я 0 / морква): ${((healthZeroDeaths / runs) * 100).toFixed(1)}%`);
  const total = [...endings.values()].reduce((a, b) => a + b, 0);
  const sorted = [...endings.entries()].sort((a, b) => b[1] - a[1]);
  for (const [title, count] of sorted) {
    console.log(`  ${title.padEnd(32)} ${((count / total) * 100).toFixed(1)}%`);
  }
  return { avgDays: avg(days), avgDecisions: avg(decisions), endings };
}

const RUNS = 2000;
const results = STRATEGIES.map((s) => simulate(s, RUNS));

console.log('\n=== Висновки ===');
for (const [i, r] of results.entries()) {
  console.log(
    `${STRATEGIES[i]!.name}: ${r.avgDays.toFixed(1)} днів, ${r.avgDecisions.toFixed(0)} рішень, ${r.endings.size} різних фіналів`,
  );
}