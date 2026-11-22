// Атмосфера: чиста функція «стан героя → густота мряки». Без DOM, тож тестується в Node.
//
// Ідея: мряка — це незрозумілість. Фаза й виснаження її згущують, розуміння розвіює.
// Чим ближче кінець, тим темніші краї екрана. Гравець бачить свій стан, не читаючи цифр.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const PHASE_FOG = [0.16, 0.26, 0.38, 0.5, 0.6];
const PHASE_RAIN = [0.18, 0.3, 0.45, 0.6, 0.75];

/**
 * @param {{phase:number, day:number, stats:Record<string,number>, status?:string}} state
 * @param {{safeUntilDay?:number, hardEndDay?:number}} [dir]
 * @returns {{fog:number, rain:number, dark:number, clarity:number, label:string}}
 */
export function atmosphereFor(state, dir = {}) {
  const safe = dir.safeUntilDay ?? 20;
  const hard = dir.hardEndDay ?? 60;
  const st = state.stats;
  const p = clamp((state.phase ?? 1) - 1, 0, 4);

  // Розуміння розвіює мряку, але не повністю: ясність має стелю.
  const clarity = clamp(st.understanding * 0.035, 0, 0.3);
  const hardship = (10 - st.health) * 0.03 + (10 - st.energy) * 0.025 + (10 - st.supplies) * 0.012;

  const fog = clamp(PHASE_FOG[p] + hardship - clarity, 0.06, 0.92);
  const rain = clamp(PHASE_RAIN[p] + (10 - st.energy) * 0.02, 0.1, 0.95);
  // Краї темніють у міру наближення до жорсткого кінця; в безпечні дні — нуль.
  const dark = state.status === 'ended' ? 0.9 : clamp((state.day - safe) / (hard - safe), 0, 1) * 0.75;

  let label;
  if (clarity >= 0.2 && fog < 0.4) label = 'мряка рідшає: ти починаєш бачити';
  else if (fog > 0.7) label = 'мряка густа: майже нічого не видно';
  else if (fog > 0.45) label = 'мряка стоїть';
  else label = 'мряка легка';
  return { fog, rain, dark, clarity, label };
}

/** Плавний перехід значення до цілі (для інтерполяції між картками). */
export function approach(current, target, k = 0.06) {
  return Math.abs(target - current) < 0.002 ? target : current + (target - current) * k;
}
