// Типи ядра забігу «Новобранець». Без UI, без залежностей.

export type StatKey = 'health' | 'energy' | 'supplies' | 'trust' | 'understanding' | 'bonds';

export const STAT_KEYS: readonly StatKey[] = [
  'health',
  'energy',
  'supplies',
  'trust',
  'understanding',
  'bonds',
] as const;

export interface StatRange {
  min: number;
  max: number;
}

/** Показники за замовчуванням: 0–10, «пастка» Муштра працює через trust. */
export const STAT_RANGE: StatRange = { min: 0, max: 10 };

export type SkillKey = 'survival' | 'system' | 'people' | 'drill';

export const SKILL_KEYS: readonly SkillKey[] = ['survival', 'system', 'people', 'drill'] as const;

export interface Skills {
  survival: number;
  system: number;
  people: number;
  drill: number;
}

export interface Stats {
  health: number;
  energy: number;
  supplies: number;
  trust: number;
  understanding: number;
  bonds: number;
}

export type Phase = 1 | 2 | 3 | 4 | 5;

/** Ефект рішення. Усі поля опційні; застосовуються по порядку. */
export interface Effect {
  stats?: Partial<Stats>;
  skills?: Partial<Skills>;
  /** Прапорці сюжету: рядок -> true/false. */
  flags?: Record<string, boolean>;
  /** Запис у щоденник гравця (короткий, один рядок). */
  journal?: string;
}

/** Умова для показу варіанта рішення або картки. */
export interface Condition {
  /** Усі умови нижче мають виконатися (AND). */
  statAtLeast?: Partial<Stats>;
  statAtMost?: Partial<Stats>;
  skillAtLeast?: Partial<Skills>;
  flagTrue?: string[];
  flagFalse?: string[];
  phaseAtLeast?: Phase;
  phaseAtMost?: Phase;
  dayAtLeast?: number;
  dayAtMost?: number;
  /** Хоча б одна з навичок >= рівня (для «м'яких» перевірок). */
  anySkillAtLeast?: { key: SkillKey; level: number }[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  /** Чому цей варіант недоступний (для UI). Не впливає на логіку. */
  lockedHint?: string;
  requires?: Condition;
  effects?: Effect;
  /** Додаткова «ціна»: якщо умова виконана — ефект застосовується замість звичайного? Ні, обидва. */
  /** Наслідки, що спрацьовують лише за певних умов. */
  conditionalEffects?: { when: Condition; then: Effect }[];
}

export type CardKind = 'event' | 'routine' | 'person' | 'system' | 'final';

export interface Card {
  id: string;
  kind: CardKind;
  phase: Phase[];
  /** Текст картки. Може містити {name} для підстановки імені героя. */
  text: string;
  /** Варіанти; 2–4. */
  options: ChoiceOption[];
  /** Умови показу картки. */
  requires?: Condition;
  /** Вага для випадкового вибору (за замовчуванням 1). */
  weight?: number;
  /** Картка не повториться в цьому забігу. */
  once?: boolean;
  /** Персонаж, до якого прив'язана картка (для «Тіней-попередників»). */
  character?: string;
  /** Теги для аналітики й підбору. */
  tags?: string[];
}

export type EndingKind = 'accident' | 'system' | 'sacrifice' | 'escape' | 'quiet';

export interface Ending {
  id: string;
  kind: EndingKind;
  title: string;
  epilogue: string;
  /** Епітафія за замовчуванням (гравець може обрати зі списку). */
  defaultEpitaph: string;
  requires?: Condition;
  /** Вага при виборі серед доступних. */
  weight?: number;
}

/** «Директор долі»: параметри неминучості. */
export interface DirectorConfig {
  /** До цього дня смерть лише від явних помилок. */
  safeUntilDay: number;
  /** Після цього дня лічильник неминучості зростає щодня. */
  inevitabilityStartsDay: number;
  /** Жорсткий тригер фіналу. */
  hardEndDay: number;
  /** Базовий шанс фатальної події на день, коли лічильник > 0. */
  baseFatalChance: number;
  /** Приріст шансу за кожен день після inevitabilityStartsDay. */
  rampPerDay: number;
  /** Максимальний шанс за день. */
  maxFatalChance: number;
}

export const DEFAULT_DIRECTOR: DirectorConfig = {
  safeUntilDay: 20,
  inevitabilityStartsDay: 30,
  hardEndDay: 60,
  baseFatalChance: 0.012,
  rampPerDay: 0.010,
  maxFatalChance: 0.32,
};

export interface RunConfig {
  seed: string;
  content: { cards: Card[]; endings: Ending[] };
  director?: Partial<DirectorConfig>;
  statRange?: StatRange;
  startStats?: Partial<Stats>;
  startSkills?: Partial<Skills>;
  /** Скільки карток за день (мінімум/максимум). */
  cardsPerDay?: { min: number; max: number };
}

export interface JournalEntry {
  day: number;
  cardId: string;
  optionId: string;
  text: string;
}

export type RunStatus = 'running' | 'ended';

export interface RunState {
  seed: string;
  rngState: number;
  status: RunStatus;
  day: number;
  phase: Phase;
  stats: Stats;
  skills: Skills;
  flags: Record<string, boolean>;
  seenCards: Record<string, number>;
  journal: JournalEntry[];
  /** Лічильник неминучості (днів «понад норму»). */
  inevitability: number;
  endingId?: string;
  decisions: number;
  /** Скільки рішень у забігу били по здоров'ю (для вибору фіналу-поранення). */
  recentHurt?: number;
  /** Поточна картка, якщо є. */
  pending?: { cardId: string; options: string[] };
}