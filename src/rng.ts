// Детермінований PRNG (mulberry32) — щоб забіг можна було відтворити за seed.

export function nextRandom(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) | 0;
  let x = t;
  x = Math.imul(x ^ (x >>> 15), 1 | x);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return { value, state: t };
}

export function seedToState(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  float(): number;
  int(minInclusive: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
  chance(p: number): boolean;
  state(): number;
}

export function createRng(seed: string): Rng {
  let state = seedToState(seed);
  const float = (): number => {
    const r = nextRandom(state);
    state = r.state;
    return r.value;
  };
  return {
    float,
    int: (min, max) => min + Math.floor(float() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() from empty array');
      return items[Math.floor(float() * items.length)]!;
    },
    chance: (p) => float() < p,
    state: () => state,
  };
}