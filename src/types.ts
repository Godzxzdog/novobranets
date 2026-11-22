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

/**
 * Ребро дерева подій: вибір веде до конкретної картки.
 * `inDays` — через скільки діб вона має з'явитись (0 — наступною).
 * Картка з черги ігнорує фазу, але не свої `requires` і не правило «раз за забіг».
 */
export type NextEvent = string | { card: string; inDays?: number };

export interface ChoiceOption {
  id: string;
  /** Гілка історії: після цього вибору гарантовано (або з відстрочкою) настане ця подія. */
  next?: NextEvent | NextEvent[];
  text: string;
  /** Чому цей варіант недоступний (для UI). Не впливає на логіку. */
  lockedHint?: string;
  requires?: Condition;
  effects?: Effect;
  /** Додаткова «ціна»: якщо умова виконана — ефект застосовується замість звичайного? Ні, обидва. */
  /** Наслідки, що спрацьовують лише за певних умов. */
  conditionalEffects?: { when: Condition; then: Effect }[];
  /**
   * Сцена-наслідок: показується окремим екраном після вибору, перш ніж
   * гра піде далі. Тут описується, що саме сталося, і що це змінило.
   */
  outcome?: OutcomeScene;
}

/** Окрема сцена після рішення: «ось що з цього вийшло». */
export interface OutcomeScene {
  /** 1–3 речення конкретного наслідку, не переказ вибору. */
  text: string;
  /** Необов'язковий рядок-«голос» — думка героя або чужа фраза. */
  voice?: string;
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
  /**
   * Картки, після яких ця має сенс. Якщо вказано, ефективна вага множиться
   * на chainBonus (за замовчуванням ×3.5) — гравець частіше бачить продовження.
   */
  follows?: string[];
  /** Пряме продовження історії. Поки є такі картки, вони йдуть першими. */
  after?: string[];
  /** Короткий опис ситуації, що веде до картки (для UI-підказки «що було раніше»). */
  lead?: string;
  /**
   * Пам'ять рішень: картка згадує те, що гравець зробив раніше.
   * `flag` — прапорець, який ставив той вибір; `line` — що саме згадати.
   * Якщо прапорця немає, картка показується без цього рядка.
   */
  echo?: CardEcho | CardEcho[];
}

/** Рядок-спогад у картці: «ти колись сказав про коліно…». */
export interface CardEcho {
  /** Прапорець або id картки, після якої лишився слід. */
  flag: string;
  /** Текст спогаду. Може містити {name}. */
  line: string;
  /** Показувати лише якщо це останній такий слід (для кількох гілок). */
  weight?: number;
}

export type EndingKind = 'accident' | 'system' | 'sacrifice' | 'escape' | 'quiet';

/** Чому забіг завершується: від цього залежить, які фінали взагалі можливі. */
export type EndReason = 'accident' | 'wounds' | 'hardend' | 'exhausted';

/** Прапорці, які ставить сам двигун (а не картки): їх можна читати в умовах і echo. */
export const ENGINE_FLAGS: readonly string[] = ['carried_out'] as const;

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
  /**
   * За яких причин завершення фінал можливий. Якщо не задано — за видом (kind):
   * accident → усі, окрім hardend; sacrifice/quiet → accident, hardend; system → accident, hardend, exhausted.
   */
  reasons?: EndReason[];
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
  /**
   * Перший раз, коли здоров'я падає до 0, героя «виносять» (здоров'я 2, прапорець carried_out),
   * і лише вдруге це кінець. За замовчуванням увімкнено: смерть має бути не помилкою шкали, а сценою.
   */
  reprieve?: boolean;
  /**
   * За замовчуванням `false`: кожна картка показується не більше одного разу за забіг.
   * Якщо контенту не вистачає, час просто йде далі (минають дні), а не повторюються сцени.
   */
  allowRepeats?: boolean;
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
  /** Черга подій-наслідків, запланованих виборами (дерево подій). */
  queue?: { cardId: string; dueDay: number; from: string; fromOption: string }[];
  /** Знімок показників після кожного рішення — для графіка на екрані фіналу. */
  history?: { day: number; decision: number; stats: Stats }[];
  /** Гілки, що справді спрацювали в цьому забігу: «рішення → його наслідок». */
  tree?: { from: string; fromOption: string; to: string; fromDay: number; day: number }[];
  /** Останні показані картки: щоб одна й та сама не поверталась за кілька кроків. */
  recent?: string[];
  /** Остання показана картка — для ланцюгів продовження. */
  lastCardId?: string;
  /** Остання сцена-наслідок (для екрана після вибору). */
  lastOutcome?: OutcomeScene & { optionId: string; cardId: string };
  /** Поточна картка, якщо є. */
  pending?: { cardId: string; options: string[] };
}