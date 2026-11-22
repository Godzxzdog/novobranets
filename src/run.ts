// Ядро забігу: стан, картки, вибір, «директор долі», фінали.

import { applyEffect, meetsCondition } from './conditions.ts';
import { createRng, type Rng } from './rng.ts';
import {
  DEFAULT_DIRECTOR,
  type Card,
  type DirectorConfig,
  type Ending,
  type Phase,
  type RunConfig,
  type RunState,
  type Stats,
  type StatRange,
  type ChoiceOption,
} from './types.ts';
import { SKILL_KEYS, STAT_RANGE } from './types.ts';

const PHASE_BY_DAY: { until: number; phase: Phase }[] = [
  { until: 3, phase: 1 },
  { until: 12, phase: 2 },
  { until: 24, phase: 3 },
  { until: 40, phase: 4 },
  { until: Number.MAX_SAFE_INTEGER, phase: 5 },
];

export function phaseForDay(day: number): Phase {
  for (const p of PHASE_BY_DAY) if (day <= p.until) return p.phase;
  return 5;
}

const DEFAULT_STATS: Stats = {
  health: 7,
  energy: 7,
  supplies: 5,
  trust: 6,
  understanding: 2,
  bonds: 4,
};

export class Run {
  readonly config: RunConfig;
  readonly director: DirectorConfig;
  readonly statRange: StatRange;
  readonly cardsPerDay: { min: number; max: number };
  private rng: Rng;
  private cardsById: Map<string, Card>;
  state: RunState;

  constructor(config: RunConfig) {
    this.config = config;
    this.director = { ...DEFAULT_DIRECTOR, ...config.director };
    this.statRange = config.statRange ?? STAT_RANGE;
    this.cardsPerDay = config.cardsPerDay ?? { min: 2, max: 3 };
    this.rng = createRng(config.seed);
    this.cardsById = new Map(config.content.cards.map((c) => [c.id, c]));

    const stats = { ...DEFAULT_STATS };
    if (config.startStats) Object.assign(stats, config.startStats);
    const skills = { survival: 0, system: 0, people: 0, drill: 0 };
    if (config.startSkills) Object.assign(skills, config.startSkills);

    this.state = {
      seed: config.seed,
      rngState: this.rng.state(),
      status: 'running',
      day: 1,
      phase: 1,
      stats,
      skills,
      flags: {},
      seenCards: {},
      journal: [],
      inevitability: 0,
      decisions: 0,
    };
  }

  /** Поточна картка (для UI) або null, якщо забіг завершено. */
  currentCard(): Card | null {
    if (!this.state.pending) return null;
    return this.cardsById.get(this.state.pending.cardId) ?? null;
  }

  /** Картка, показана останньою в цьому забігу (для ланцюгів і UI). */
  lastCard(): Card | null {
    const id = this.state.lastCardId;
    return id ? (this.cardsById.get(id) ?? null) : null;
  }

  /** Доступні варіанти поточної картки. */
  availableOptions(): ChoiceOption[] {
    const card = this.currentCard();
    if (!card) return [];
    const s = this.state;
    return card.options.filter((o) =>
      meetsCondition(o.requires, s.stats, s.skills, s.flags, s.phase, s.day),
    );
  }

  /**
   * Підтягнути наступну картку. Викликати, коли pending === undefined.
   * Повертає картку або завершує забіг, якщо подій більше немає.
   */
  draw(): Card | null {
    const s = this.state;
    if (s.status === 'ended') return null;
    if (s.pending) return this.currentCard();

    // Жорсткий тригер директора.
    if (s.day >= this.director.hardEndDay) {
      this.endWith('hardend');
      return null;
    }

    // Доля кидає кубик раз на добу — в advanceTime, не на кожну картку.
    const pool = this.config.content.cards.filter((c) => this.isEligible(c));
    if (pool.length === 0) {
      this.endWith('exhausted');
      return null;
    }

    const card = this.weightedPick(pool);
    s.pending = { cardId: card.id, options: card.options.map((o) => o.id) };
    s.seenCards[card.id] = (s.seenCards[card.id] ?? 0) + 1;
    return card;
  }

  /** Обрати варіант за id. Повертає true, якщо вибір прийнято. */
  choose(optionId: string): boolean {
    const s = this.state;
    const card = this.currentCard();
    if (!card || s.status === 'ended') return false;

    const option = card.options.find((o) => o.id === optionId);
    if (!option) return false;
    if (!meetsCondition(option.requires, s.stats, s.skills, s.flags, s.phase, s.day)) return false;

    const statsBefore = { ...s.stats };
    const applied = applyEffect(option.effects, s.stats, s.skills, s.flags, this.statRange);
    s.stats = applied.stats;
    s.skills = applied.skills;
    s.flags = applied.flags;

    if (option.conditionalEffects) {
      for (const cond of option.conditionalEffects) {
        if (meetsCondition(cond.when, s.stats, s.skills, s.flags, s.phase, s.day)) {
          const extra = applyEffect(cond.then, s.stats, s.skills, s.flags, this.statRange);
          s.stats = extra.stats;
          s.skills = extra.skills;
          s.flags = extra.flags;
        }
      }
    }

    // Власні рішення, що били по здоров'ю, пам'ятаємо: вони змінюють фінал.
    if ((option.effects?.stats?.health ?? 0) < 0) {
      s.recentHurt = (s.recentHurt ?? 0) + 1;
    }

    // Сцена-наслідок: конкретний текст «що з цього вийшло», а не переказ вибору.
    s.lastOutcome = {
      ...(option.outcome ?? {}),
      text:
        option.outcome?.text ?? describeOutcome(statsBefore, s.stats),
      optionId: option.id,
      cardId: card.id,
    } as RunState['lastOutcome'];

    s.journal.push({ day: s.day, cardId: card.id, optionId, text: option.text });
    s.decisions += 1;
    s.pending = undefined;
    // Показана картка стає «попередньою» лише після рішення — так продовження
    // справді чіпляються до попередньої сцени, а не до самої себе.
    s.lastCardId = card.id;

    // Смерть від показників: здоров'я 0 — явна помилка, не «доля».
    if (s.stats.health <= 0) {
      this.endWith('wounds');
      return true;
    }

    this.advanceTime();
    return true;
  }

  private advanceTime(): void {
    const s = this.state;
    const doneToday = s.journal.filter((j) => j.day === s.day).length;
    const target = this.targetCardsForDay(s.day);

    if (doneToday < target) return;

    s.day += 1;
    s.phase = phaseForDay(s.day);
    // Денна втома: енергія падає, запаси витрачаються.
    s.stats = {
      ...s.stats,
      energy: Math.max(this.statRange.min, s.stats.energy - 1),
      supplies: Math.max(this.statRange.min, s.stats.supplies - 1),
    };

    // Неминучість: вона не «лічильник для краси», а множник ризику.
    if (s.day > this.director.inevitabilityStartsDay) {
      s.inevitability = (s.inevitability ?? 0) + 1;
    }

    if (s.day >= this.director.hardEndDay) {
      this.endWith('hardend');
      return;
    }

    // Доля кидає кубик раз на добу — і це той самий день, що й у календарі.
    if (s.day > this.director.safeUntilDay) {
      let chance = this.fatalChance();
      if (this.rng.chance(chance)) {
        this.endWith('accident');
      }
    }
  }

  private targetCardsForDay(day: number): number {
    const { min, max } = this.cardsPerDay;
    if (max <= min) return min;
    // Стабільно в межах доби, без споживання RNG.
    return min + (day % (max - min + 1));
  }

  private fatalChance(): number {
    const s = this.state;
    const over = Math.max(0, s.day - this.director.inevitabilityStartsDay);
    const raw = this.director.baseFatalChance + over * this.director.rampPerDay;
    // Голод і виснаження підвищують шанс; обізнаність — ні.
    let mod = 1;
    if (s.stats.supplies <= 2) mod += 0.35;
    if (s.stats.energy <= 2) mod += 0.35;
    if (s.stats.health <= 3) mod += 0.5;
    // Кожен день після старту неминучості додає ваги долі — лічильник працює.
    const inevitabilityBoost = 1 + (s.inevitability ?? 0) * 0.012;
    return Math.min(this.director.maxFatalChance, raw * mod * inevitabilityBoost);
  }

  private isEligible(card: Card): boolean {
    const s = this.state;
    if (!card.phase.includes(s.phase)) return false;
    if (card.once && (s.seenCards[card.id] ?? 0) > 0) return false;
    if (!meetsCondition(card.requires, s.stats, s.skills, s.flags, s.phase, s.day)) return false;
    // Картка без жодного доступного варіанта — не показуємо.
    const any = card.options.some((o) =>
      meetsCondition(o.requires, s.stats, s.skills, s.flags, s.phase, s.day),
    );
    return any;
  }

  private weightedPick(pool: Card[]): Card {
    // Пряме продовження історії має пріоритет над усім іншим:
    // якщо після щойно показаної картки є «after», беремо його першим.
    const last = this.state.lastCardId;
    if (last) {
      const next = pool.filter((c) => (c.after ?? []).includes(last));
      if (next.length > 0) return this.pickWeighted(next);
    }

    // Зв'язність: продовження того, що сталося нещодавно, важить значно більше
    // за випадкову сцену. Інакше картки лишаються мозаїкою без історії.
    const weights = pool.map((c) => {
      const base = c.weight ?? 1;
      const seen = this.state.seenCards[c.id] ?? 0;
      const refs = c.follows ?? [];
      const recent = last !== undefined && refs.includes(last);
      const chained = refs.some((id) => (this.state.seenCards[id] ?? 0) > 0);
      const mult = recent ? 6 : chained ? 2.5 : 1;
      return (base * mult) / (1 + seen);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.rng.float() * total;
    for (let i = 0; i < pool.length; i += 1) {
      r -= weights[i]!;
      if (r <= 0) return pool[i]!;
    }
    return pool[pool.length - 1]!;
  }

  private endWith(reason: string): void {
    const s = this.state;
    const ending = this.pickEnding(reason);
    s.status = 'ended';
    s.pending = undefined;
    s.endingId = ending?.id ?? `fallback:${reason}`;
    (s as RunState & { endingReason?: string }).endingReason = reason;
  }

  private pickEnding(reason: string): Ending | undefined {
    const s = this.state;
    const all = this.config.content.endings;
    const eligible = all.filter((e) =>
      meetsCondition(e.requires, s.stats, s.skills, s.flags, s.phase, s.day),
    );
    // Фінал за замовчуванням — для своєї причини. Якщо такого немає,
    // беремо споріднені, і лише потім будь-який доступний.
    const byKind = eligible.filter((e) => {
      // Поранення від власних рішень: спершу accident, quiet — лише як запас.
      if (reason === 'wounds') return e.kind === 'accident';
      // Випадкова смерть: якщо в грі був вибір, що бив по здоров'ю, — це поранення,
      // інакше — «не наша» випадковість.
      if (reason === 'accident' && e.kind === 'accident') {
        return e.id === 'ending.wounds'
          ? hurtByOwnChoice(s)
          : true;
      }
      if (reason === 'hardend') return e.kind === 'system';
      if (reason === 'accident') return e.kind === 'accident';
      if (reason === 'exhausted') return e.kind === 'quiet' || e.kind === 'system';
      return true;
    });
    const pool = byKind.length > 0 ? byKind : eligible;
    if (pool.length === 0) return undefined;
    const total = pool.reduce((a, e) => a + (e.weight ?? 1), 0);
    let r = this.rng.float() * total;
    for (const e of pool) {
      r -= e.weight ?? 1;
      if (r <= 0) return e;
    }
    return pool[pool.length - 1];
  }

  ending(): Ending | undefined {
    const id = this.state.endingId;
    if (!id) return undefined;
    return this.config.content.endings.find((e) => e.id === id);
  }

  /** Знімок для збереження/тестів. */
  snapshot(): RunState {
    return JSON.parse(JSON.stringify(this.state)) as RunState;
  }

  /** Перевірка цілісності стану (для автотестів). */
  validate(): string[] {
    const errors: string[] = [];
    const s = this.state;
    for (const k of SKILL_KEYS) {
      if (s.skills[k] < 0 || s.skills[k] > 3) errors.push(`skill ${k} out of range: ${s.skills[k]}`);
    }
    for (const [k, v] of Object.entries(s.stats)) {
      if (v < this.statRange.min || v > this.statRange.max) errors.push(`stat ${k} out of range: ${v}`);
    }
    if (s.status === 'ended' && !s.endingId) errors.push('ended without endingId');
    if (s.status === 'running' && s.decisions > 500) errors.push('run too long');
    return errors;
  }
}

/**
 * Чи смерть «від долі» сталася після власного вибору, що бив по здоров'ю.
 * Тоді фінал — поранення, а не «не наша» випадковість.
 * recentHurt — лічильник рішень із від’ємним здоров’ям у поточному забігу.
 */
function hurtByOwnChoice(state: RunState): boolean {
  return (state.recentHurt ?? 0) > 0;
}

/**
 * Якщо в контенті для варіанта немає готової сцени — збираємо її з того,
 * що рішення справді змінило. Це завжди конкретно: показники й навички.
 */
function describeOutcome(before: Stats, after: Stats): string {
  const STAT_WORDS: Record<keyof Stats, [string, string]> = {
    health: ['Тіло тримається краще', 'Тіло відгукується болем'],
    energy: ['Сна побільшало', 'Сил поменшало'],
    supplies: ['У кишені додалось', 'Запасів поменшало'],
    trust: ['Начальство задоволене', 'Начальство це запам\'ятає'],
    understanding: ['Тепер ти розумієш більше', 'Щось у картині світу зсунулось'],
    bonds: ['Люди навколо ближчі', 'Хтось відійшов далі'],
  };
  const parts: string[] = [];
  for (const k of Object.keys(STAT_WORDS) as (keyof Stats)[]) {
    const d = after[k] - before[k];
    if (d === 0) continue;
    parts.push(STAT_WORDS[k][d > 0 ? 0 : 1]);
  }
  if (parts.length === 0) return 'Нічого не змінилось — принаймні зараз.';
  return `${parts.slice(0, 2).join('. ')}.`;
}