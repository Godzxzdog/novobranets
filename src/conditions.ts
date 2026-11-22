// Перевірка умов (Condition) і застосування ефектів.

import type { Condition, Effect, Skills, Stats } from './types.ts';
import { SKILL_KEYS, STAT_KEYS, STAT_RANGE, type StatRange } from './types.ts';

export function meetsCondition(
  cond: Condition | undefined,
  stats: Stats,
  skills: Skills,
  flags: Record<string, boolean>,
  phase: number,
  day: number,
): boolean {
  if (!cond) return true;

  if (cond.statAtLeast) {
    for (const [k, v] of Object.entries(cond.statAtLeast) as [keyof Stats, number][]) {
      if (stats[k] < v) return false;
    }
  }
  if (cond.statAtMost) {
    for (const [k, v] of Object.entries(cond.statAtMost) as [keyof Stats, number][]) {
      if (stats[k] > v) return false;
    }
  }
  if (cond.skillAtLeast) {
    for (const [k, v] of Object.entries(cond.skillAtLeast) as [keyof Skills, number][]) {
      if (skills[k] < v) return false;
    }
  }
  if (cond.flagTrue) {
    for (const f of cond.flagTrue) if (flags[f] !== true) return false;
  }
  if (cond.flagFalse) {
    for (const f of cond.flagFalse) if (flags[f] === true) return false;
  }
  if (cond.phaseAtLeast !== undefined && phase < cond.phaseAtLeast) return false;
  if (cond.phaseAtMost !== undefined && phase > cond.phaseAtMost) return false;
  if (cond.dayAtLeast !== undefined && day < cond.dayAtLeast) return false;
  if (cond.dayAtMost !== undefined && day > cond.dayAtMost) return false;
  if (cond.anySkillAtLeast) {
    const ok = cond.anySkillAtLeast.some((c) => skills[c.key] >= c.level);
    if (!ok) return false;
  }
  return true;
}

export function clampStats(stats: Stats, range: StatRange = STAT_RANGE): Stats {
  const out = { ...stats };
  for (const k of STAT_KEYS) {
    out[k] = Math.max(range.min, Math.min(range.max, out[k]));
  }
  return out;
}

export function applyEffect(
  effect: Effect | undefined,
  stats: Stats,
  skills: Skills,
  flags: Record<string, boolean>,
  range: StatRange = STAT_RANGE,
): { stats: Stats; skills: Skills; flags: Record<string, boolean> } {
  if (!effect) return { stats, skills, flags };

  const nextStats = { ...stats };
  if (effect.stats) {
    for (const [k, v] of Object.entries(effect.stats) as [keyof Stats, number][]) {
      nextStats[k] += v;
    }
  }
  const nextSkills = { ...skills };
  if (effect.skills) {
    for (const [k, v] of Object.entries(effect.skills) as [keyof Skills, number][]) {
      nextSkills[k] = Math.max(0, Math.min(3, nextSkills[k] + v));
    }
  }
  const nextFlags = { ...flags };
  if (effect.flags) {
    for (const [k, v] of Object.entries(effect.flags)) nextFlags[k] = v;
  }
  return { stats: clampStats(nextStats, range), skills: nextSkills, flags: nextFlags };
}

export { SKILL_KEYS, STAT_KEYS };