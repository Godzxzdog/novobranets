// Валідатор контенту: ловить помилки до того, як їх побачить гравець.

import type { Card, Ending, Phase } from '../src/types.ts';
import { ENGINE_FLAGS, SKILL_KEYS, STAT_KEYS } from '../src/types.ts';

export interface ValidationIssue {
  level: 'error' | 'warn';
  where: string;
  message: string;
}

const PHASES: Phase[] = [1, 2, 3, 4, 5];

export function validateContent(cards: Card[], endings: Ending[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const chainRefs: { card: string; from: string }[] = [];
  const flagWrites = new Set<string>();
  const flagReads = new Set<string>();

  const readFlags = (obj: unknown, where: string): void => {
    if (!obj || typeof obj !== 'object') return;
    const c = obj as { flagTrue?: string[]; flagFalse?: string[]; requires?: unknown };
    for (const f of c.flagTrue ?? []) flagReads.add(f);
    for (const f of c.flagFalse ?? []) flagReads.add(f);
    readFlags(c.requires, where);
  };

  for (const card of cards) {
    const where = `card ${card.id}`;
    if (ids.has(card.id)) issues.push({ level: 'error', where, message: 'дубль id' });
    ids.add(card.id);

    for (const from of [...(card.follows ?? []), ...(card.after ?? [])]) {
      chainRefs.push({ card: card.id, from });
    }

    if (!card.phase.length) issues.push({ level: 'error', where, message: 'порожній phase' });
    for (const p of card.phase) {
      if (!PHASES.includes(p)) issues.push({ level: 'error', where, message: `невідома фаза ${p}` });
    }
    if (card.options.length < 2) {
      issues.push({ level: 'error', where, message: `варіантів менше 2 (${card.options.length})` });
    }
    if (card.options.length > 4) {
      issues.push({ level: 'warn', where, message: `варіантів більше 4 (${card.options.length})` });
    }
    if (!card.text.trim()) issues.push({ level: 'error', where, message: 'порожній текст' });

    const optIds = new Set<string>();
    for (const opt of card.options) {
      if (optIds.has(opt.id)) {
        issues.push({ level: 'error', where, message: `дубль варіанта ${opt.id}` });
      }
      optIds.add(opt.id);
      if (!opt.text.trim()) issues.push({ level: 'error', where: `${where}/${opt.id}`, message: 'порожній текст варіанта' });

      for (const [k, v] of Object.entries(opt.effects?.stats ?? {})) {
        if (!STAT_KEYS.includes(k as never)) {
          issues.push({ level: 'error', where: `${where}/${opt.id}`, message: `невідомий показник ${k}` });
        }
        if (Math.abs(v as number) > 5) {
          issues.push({ level: 'warn', where: `${where}/${opt.id}`, message: `великий ефект ${k}: ${v}` });
        }
      }
      for (const k of Object.keys(opt.effects?.skills ?? {})) {
        if (!SKILL_KEYS.includes(k as never)) {
          issues.push({ level: 'error', where: `${where}/${opt.id}`, message: `невідома навичка ${k}` });
        }
      }
      for (const f of Object.keys(opt.effects?.flags ?? {})) flagWrites.add(f);
      readFlags(opt.requires, `${where}/${opt.id}`);
      for (const ce of opt.conditionalEffects ?? []) {
        readFlags(ce.when, `${where}/${opt.id}`);
        for (const f of Object.keys(ce.then.flags ?? {})) flagWrites.add(f);
      }
    }

    readFlags(card.requires, where);
    // Якщо всі варіанти закриті умовами — картка може стати недосяжною; це не помилка, але варто знати.
    if (card.options.every((o) => o.requires)) {
      issues.push({ level: 'warn', where, message: 'усі варіанти умовні — картка може «зникнути»' });
    }
  }

  // Фінали
  const endingIds = new Set<string>();
  for (const e of endings) {
    const where = `ending ${e.id}`;
    if (endingIds.has(e.id)) issues.push({ level: 'error', where, message: 'дубль id' });
    endingIds.add(e.id);
    if (!e.title.trim()) issues.push({ level: 'error', where, message: 'порожній title' });
    if (!e.epilogue.trim()) issues.push({ level: 'error', where, message: 'порожній epilogue' });
    if (e.epilogue.length < 80) {
      issues.push({ level: 'warn', where, message: `короткий епілог (${e.epilogue.length} символів)` });
    }
    readFlags(e.requires, where);
  }

  // Дерево: next має вести на існуючу картку; наслідок, чий requires ніхто не виконує, — мертва гілка.
  for (const card of cards) {
    for (const opt of card.options) {
      const list = opt.next ? (Array.isArray(opt.next) ? opt.next : [opt.next]) : [];
      for (const n of list) {
        const target = typeof n === 'string' ? n : n.card;
        if (!ids.has(target)) {
          issues.push({ level: 'error', where: `card ${card.id}/${opt.id}`, message: `next веде на неіснуючу картку: ${target}` });
        }
      }
    }
  }

  // Echo теж читає прапорці: рядок-спогад про вчинок, якого гра ніде не фіксує, — мертвий рядок.
  for (const card of cards) {
    const echoes = card.echo ? (Array.isArray(card.echo) ? card.echo : [card.echo]) : [];
    for (const e of echoes) {
      if (!flagWrites.has(e.flag) && !ENGINE_FLAGS.includes(e.flag)) {
        issues.push({ level: 'error', where: `card ${card.id}`, message: `echo читає прапорець, який ніде не ставиться: ${e.flag}` });
      }
    }
  }

  // Навички: якщо варіанти вимагають навичку, її має бути звідки взяти БЕЗ цієї ж навички.
  // Інакше виходить замкнене коло («Люди» давались лише тим, у кого «Люди» вже є).
  for (const sk of SKILL_KEYS) {
    const gated = cards.flatMap((c) =>
      c.options.filter((o) => (o.requires?.skillAtLeast?.[sk] ?? 0) > 0).map((o) => ({ c, o })),
    );
    if (gated.length === 0) continue;
    const roots = cards.flatMap((c) =>
      c.options
        .filter((o) => (o.effects?.skills?.[sk] ?? 0) > 0 && !(o.requires?.skillAtLeast?.[sk] ?? 0))
        .map((o) => ({ c, o })),
    );
    if (roots.length === 0) {
      issues.push({ level: 'error', where: `skill ${sk}`, message: `${gated.length} варіантів вимагають навичку, але її ніде не отримати без неї самої` });
      continue;
    }
    const firstRoot = Math.min(...roots.flatMap((r) => r.c.phase));
    const early = gated.filter((g) => Math.max(...g.c.phase) < firstRoot);
    for (const g of early) {
      issues.push({
        level: 'warn',
        where: `card ${g.c.id}/${g.o.id}`,
        message: `вимагає «${sk}», але перше джерело цієї навички лише з фази ${firstRoot}`,
      });
    }
  }

  // Прапорці: читання без запису — мертва умова.
  for (const f of flagReads) {
    if (!flagWrites.has(f) && !ENGINE_FLAGS.includes(f)) {
      issues.push({ level: 'error', where: `flag ${f}`, message: 'читається, але ніде не встановлюється' });
    }
  }

  // Покриття фаз: у кожній фазі має бути хоч кілька карток.
  for (const p of PHASES) {
    const count = cards.filter((c) => c.phase.includes(p)).length;
    if (count < 4) issues.push({ level: 'warn', where: `phase ${p}`, message: `лише ${count} карток` });
  }

  // Ланцюги: посилання на неіснуючу картку ламає зв'язність непомітно.
  for (const ref of chainRefs) {
    if (!ids.has(ref.from)) {
      issues.push({ level: 'error', where: `card ${ref.card}`, message: `ланцюг веде на неіснуючу картку: ${ref.from}` });
    }
  }
  // Картка-продовження без жодного зв'язку — просто шум у пулі.
  const chained = new Set<string>();
  for (const c of cards) for (const f of c.follows ?? []) chained.add(f);
  for (const c of cards) {
    if ((c.follows ?? []).length === 0 && (c.after ?? []).length === 0 && !chained.has(c.id) && c.kind !== 'final') {
      issues.push({ level: 'warn', where: `card ${c.id}`, message: 'картка не має зв\'язків з іншими' });
    }
  }

  return issues;
}

export function printIssues(issues: ValidationIssue[]): boolean {
  if (issues.length === 0) {
    console.log('✅ Контент валідний');
    return true;
  }
  for (const i of issues) {
    console.log(`${i.level === 'error' ? '❌' : '⚠️ '} [${i.where}] ${i.message}`);
  }
  const errors = issues.filter((i) => i.level === 'error').length;
  console.log(`\n${issues.length} зауважень, з них помилок: ${errors}`);
  return errors === 0;
}