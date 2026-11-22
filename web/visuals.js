// Візуалізації як чисті функції «дані → SVG-рядок». Без DOM: тестуються в Node.

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const STAT_COLORS = {
  trust: '#e0b04a',
  understanding: '#7e9b62',
  health: '#c9563f',
  energy: '#6f8fa8',
  supplies: '#8d8977',
  bonds: '#a8728f',
};
export const STAT_NAMES = {
  trust: 'Довіра',
  understanding: 'Розуміння',
  health: 'Здоров’я',
  energy: 'Бадьорість',
  supplies: 'Запаси',
  bonds: 'Зв’язки',
};

/**
 * Смуга шляху: безпечні дні, зона долі, жорсткий кінець; пройдене; спрацьовані гілки (золото)
 * і посіяні, але ще не дозрілі наслідки (пунктир): гравець бачить, що світ щось готує.
 */
export function routeStripSvg(state, dir = {}) {
  const safe = dir.safeUntilDay ?? 20;
  const inev = dir.inevitabilityStartsDay ?? 30;
  const hard = dir.hardEndDay ?? 60;
  const W = 600, H = 52, L = 10, R = 10, Y = 34;
  const x = (d) => L + ((W - L - R) * Math.min(d, hard)) / hard;
  const day = Math.min(state.day, hard);

  const arcs = [];
  for (const t of state.tree ?? []) {
    const a = x(t.fromDay), b = x(t.day), m = (a + b) / 2, h = 8 + Math.min(14, (b - a) / 8);
    arcs.push(`<path d="M${a},${Y} Q${m},${Y - h * 2} ${b},${Y}" fill="none" stroke="#e0b04a" stroke-width="1.6" opacity=".9"/>`);
  }
  for (const q of state.queue ?? []) {
    const from = [...(state.journal ?? [])].reverse().find((j) => j.cardId === q.from)?.day ?? day;
    const a = x(from), b = x(Math.max(q.dueDay, from + 1)), m = (a + b) / 2, h = 8 + Math.min(14, (b - a) / 8);
    arcs.push(`<path d="M${a},${Y} Q${m},${Y - h * 2} ${b},${Y}" fill="none" stroke="#8d8977" stroke-width="1.2" stroke-dasharray="3 3" opacity=".8"><title>наслідок, що дозріває</title></path>`);
  }

  const ticks = [];
  for (let d = 0; d <= hard; d += 10) {
    ticks.push(`<line x1="${x(d)}" y1="${Y - 3}" x2="${x(d)}" y2="${Y + 3}" stroke="#55523f"/>`);
    ticks.push(`<text x="${x(d)}" y="${H - 2}" font-size="11" fill="#6f6b58" text-anchor="middle">${d}</text>`);
  }

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Шлях: день ${day} з ${hard}" xmlns="http://www.w3.org/2000/svg" style="display:block">
<defs><linearGradient id="fate" x1="0" x2="1"><stop offset="0" stop-color="#3a1f19" stop-opacity=".15"/><stop offset="1" stop-color="#c9563f" stop-opacity=".55"/></linearGradient></defs>
<rect x="${x(0)}" y="${Y - 3}" width="${x(safe) - x(0)}" height="6" fill="#7e9b62" opacity=".22"><title>безпечні дні</title></rect>
<rect x="${x(safe)}" y="${Y - 3}" width="${x(inev) - x(safe)}" height="6" fill="#e0b04a" opacity=".2"><title>доля прислухається</title></rect>
<rect x="${x(inev)}" y="${Y - 3}" width="${x(hard) - x(inev)}" height="6" fill="url(#fate)"><title>неминучість росте щодня</title></rect>
${arcs.join('')}
<line x1="${x(0)}" y1="${Y}" x2="${x(day)}" y2="${Y}" stroke="#e6e2d4" stroke-width="2"/>
${ticks.join('')}
<circle cx="${x(day)}" cy="${Y}" r="4.5" fill="#e6e2d4" stroke="#14140f" stroke-width="2"/>
<text x="${x(hard)}" y="9" font-size="11" fill="#c9563f" text-anchor="end">кінець</text>
</svg>`;
}

/**
 * Перший момент, коли розуміння стало вищим за довіру після того, як було нижчим (або з початку),
 * якщо воно потім не втрачено. Це «ножиці» гри: чим більше розумієш, тим менше віриш.
 */
export function scissorsPoint(history) {
  if (!history || history.length < 2) return null;
  for (let i = 0; i < history.length; i += 1) {
    const h = history[i].stats;
    if (h.understanding > h.trust && history.slice(i).every((x) => x.stats.understanding >= x.stats.trust - 0)) {
      return { index: i, decision: history[i].decision, day: history[i].day };
    }
  }
  return null;
}

/** Графік показників за рішеннями; довіра й розуміння виділені, решта тонкі. */
export function statsChartSvg(history) {
  if (!history || history.length < 2) return '';
  const W = 600, H = 215, L = 28, R = 10, T = 12, B = 52;
  const n = history.length;
  const x = (i) => L + ((W - L - R) * i) / (n - 1);
  const y = (v) => T + ((H - T - B) * (10 - v)) / 10;

  const grid = [0, 5, 10].map((v) =>
    `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="#33332a" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 3}" font-size="13" fill="#6f6b58" text-anchor="end">${v}</text>`).join('');

  const line = (key, width, opacity) => {
    const pts = history.map((h, i) => `${x(i).toFixed(1)},${y(h.stats[key]).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${STAT_COLORS[key]}" stroke-width="${width}" opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"><title>${esc(STAT_NAMES[key])}</title></polyline>`;
  };
  const thin = ['health', 'energy', 'supplies', 'bonds'].map((k) => line(k, 1.1, 0.55)).join('');
  const bold = line('trust', 2.6, 1) + line('understanding', 2.6, 1);

  // «Ножиці»: заливка між довірою й розумінням там, де розуміння вище.
  const sc = scissorsPoint(history);
  let mark = '';
  if (sc) {
    const cx = x(sc.index);
    mark = `<line x1="${cx}" y1="${T}" x2="${cx}" y2="${H - B}" stroke="#7e9b62" stroke-dasharray="3 3" opacity=".7"/>
<text x="${Math.min(cx + 5, W - 120)}" y="${T + 9}" font-size="13" fill="#7e9b62">розуміння обігнало довіру · день ${sc.day}</text>`;
  }

  // Мітки днів по осі: початок, середина, кінець.
  const dayLabels = [0, Math.floor((n - 1) / 2), n - 1].map((i) =>
    `<text x="${x(i)}" y="${H - 34}" font-size="13" fill="#6f6b58" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">день ${history[i].day}</text>`).join('');

  const legend = ['trust', 'understanding', 'health', 'energy', 'supplies', 'bonds'].map((k, i) =>
    `<g transform="translate(${L + (i % 3) * 190},${H - 18 + Math.floor(i / 3) * 16})"><rect width="8" height="3" y="-3" fill="${STAT_COLORS[k]}"/><text x="12" y="0" font-size="12" fill="#8d8977">${esc(STAT_NAMES[k])}</text></g>`).join('');

  return `<svg viewBox="0 0 ${W} ${H + 12}" width="100%" role="img" aria-label="Показники за час" xmlns="http://www.w3.org/2000/svg" style="display:block">
${grid}${thin}${bold}${mark}${dayLabels}${legend}</svg>`;
}

/** Один рядок-підсумок до графіка: що показує форма кривих. */
export function chartCaption(history) {
  const sc = scissorsPoint(history);
  if (!history || history.length < 2) return '';
  const last = history[history.length - 1].stats;
  if (sc) return `Розуміння перевищило довіру на рішенні №${sc.decision}. Відтоді ти бачив більше, ніж тобі дозволяли вірити.`;
  if (last.trust >= last.understanding) return 'Довіра так і лишилась вищою за розуміння: ти дійшов до кінця, не розвіявши мряку.';
  return 'Розуміння й довіра йшли поруч, але розходились не в твою користь.';
}

// ─────────────── Кольори, час доби, сцена картки ───────────────

/** Палітра за фазою: небо (верх/низ), акцент інтерфейсу, колір туману, силуети. */
export const PHASE_THEME = {
  1: { name: 'дім', sky: ['#3d3a2c', '#c49a52'], accent: '#e0b04a', fog: '176,160,120', far: '#5b5238', near: '#2c2819' },
  2: { name: 'навчання', sky: ['#243428', '#8aa05a'], accent: '#9cc15f', fog: '140,160,120', far: '#3f5232', near: '#1d281a' },
  3: { name: 'дорога', sky: ['#3a2e24', '#b0803f'], accent: '#d49a45', fog: '170,140,100', far: '#5a4328', near: '#2a1f14' },
  4: { name: 'позиція', sky: ['#1d2833', '#6a8499'], accent: '#78a7cf', fog: '130,150,168', far: '#34485a', near: '#141c24' },
  5: { name: 'кінець', sky: ['#2b1616', '#a8402f'], accent: '#e0603f', fog: '170,110,100', far: '#5a2822', near: '#1c0e0d' },
};
export const themeFor = (phase) => PHASE_THEME[Math.min(5, Math.max(1, phase || 1))];

/** Час доби крутиться від кількості прийнятих рішень: світанок, день, смерк, ніч. */
export function timeOfDay(decisions = 0) {
  const t = decisions % 8;
  if (t < 2) return 'dawn';
  if (t < 5) return 'day';
  if (t < 6) return 'dusk';
  return 'night';
}
export const TIME_LABEL = { dawn: 'світанок', day: 'день', dusk: 'смерк', night: 'ніч' };

const KIND_ACCENT = {
  event: '#e0b04a', routine: '#8d8977', person: '#a8728f', system: '#c9563f', final: '#e6e2d4',
};
export const kindAccent = (kind) => KIND_ACCENT[kind] ?? KIND_ACCENT.event;

/** Стабільне число з рядка: та сама картка завжди має той самий краєвид. */
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
const f = (n) => n.toFixed(1);

function hillPath(id, W, base, amp, step) {
  const pts = [];
  for (let x = 0; x <= W + step; x += step) {
    const y = base - amp * (0.35 + 0.65 * seedOf(`${id}:${Math.round(x)}`)) * (0.6 + 0.4 * Math.sin(x / 90 + seedOf(id) * 6));
    pts.push([x, y]);
  }
  let d = `M0,130 L${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    d += ` Q${f(x0)},${f(y0)} ${f((x0 + x1) / 2)},${f((y0 + y1) / 2)}`;
  }
  return `${d} L${W},130 Z`;
}

/**
 * Шапка картки: небо фази, сонце або місяць за часом доби, два шари пагорбів,
 * силуети (сосни, стовпи з дротами, хати з вогником уночі) і смуга туману.
 * Детерміновано від id картки; барви від фази й часу доби.
 * @param {{phase?:number, decisions?:number}} [ctx]
 */
export function cardScenerySvg(cardId, kind, ctx = {}) {
  const phase = ctx.phase ?? 1;
  const th = themeFor(phase);
  const tod = timeOfDay(ctx.decisions ?? 0);
  const uid = `sc${Math.floor(seedOf(cardId) * 1e6)}`;
  const W = 600, H = 120, BASE = 104;
  const dim = { dawn: 0.12, day: 0, dusk: 0.3, night: 0.58 }[tod];
  const ka = kindAccent(kind);

  // небесне світило
  const sx = 70 + seedOf(cardId + 'sun') * 460;
  const sy = tod === 'day' ? 26 : tod === 'night' ? 24 : 58;
  const body = tod === 'night'
    ? `<circle cx="${f(sx)}" cy="${sy}" r="9" fill="#e6e2d4" opacity=".85"/><circle cx="${f(sx + 4)}" cy="${sy - 2}" r="8" fill="${th.sky[0]}"/>`
    : `<circle cx="${f(sx)}" cy="${sy}" r="${tod === 'day' ? 8 : 13}" fill="#fff1c9" opacity="${tod === 'day' ? 0.8 : 0.7}"/><circle cx="${f(sx)}" cy="${sy}" r="${tod === 'day' ? 20 : 30}" fill="#fff1c9" opacity=".12"/>`;

  const stars = [];
  if (tod === 'night' || tod === 'dusk') {
    const n = tod === 'night' ? 26 : 8;
    for (let i = 0; i < n; i += 1) {
      const a = seedOf(`${cardId}s${i}`), b = seedOf(`${cardId}t${i}`);
      stars.push(`<circle cx="${f(a * W)}" cy="${f(4 + b * 52)}" r="${f(0.4 + a * 0.9)}" fill="#e6e2d4" opacity="${f(0.25 + b * 0.5)}"/>`);
    }
  }

  const shapes = [];
  const count = 9 + Math.floor(seedOf(cardId) * 6);
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const j = seedOf(`${cardId}:${i}`);
    const x = t * W + (j - 0.5) * 24;
    const tall = 16 + j * 34;
    if (j > 0.6) {
      // сосна: три ярусів-трикутників
      for (let k = 0; k < 3; k += 1) {
        const w = 5 + (3 - k) * 3 + j * 3, top = BASE - tall + k * (tall * 0.26), bot = top + tall * 0.42;
        shapes.push(`<path d="M${f(x)},${f(top)} L${f(x - w)},${f(bot)} L${f(x + w)},${f(bot)} Z" fill="${th.near}"/>`);
      }
      shapes.push(`<rect x="${f(x - 1)}" y="${BASE - 4}" width="2" height="6" fill="${th.near}"/>`);
    } else if (j > 0.34) {
      // стовп із дротами
      shapes.push(`<rect x="${f(x - 0.9)}" y="${f(BASE - tall)}" width="1.8" height="${f(tall)}" fill="${th.near}"/>`);
      shapes.push(`<rect x="${f(x - 7)}" y="${f(BASE - tall + 4)}" width="14" height="1.4" fill="${th.near}"/>`);
      shapes.push(`<path d="M${f(x + 7)},${f(BASE - tall + 5)} Q${f(x + 30)},${f(BASE - tall + 14)} ${f(x + 56)},${f(BASE - tall + 5)}" stroke="${th.near}" stroke-width=".8" fill="none" opacity=".8"/>`);
    } else {
      // хата, уночі з вогником
      const w = 9 + j * 14, h = 9 + j * 12;
      shapes.push(`<path d="M${f(x - w)},${BASE} L${f(x - w)},${f(BASE - h)} L${f(x)},${f(BASE - h - 8)} L${f(x + w)},${f(BASE - h)} L${f(x + w)},${BASE} Z" fill="${th.near}"/>`);
      if (tod === 'night' || tod === 'dusk') shapes.push(`<rect x="${f(x - 2)}" y="${f(BASE - h * 0.6)}" width="4" height="4" fill="#ffd27a" opacity=".9"/>`);
    }
  }

  const accentGround = `<rect x="0" y="${BASE}" width="${W}" height="${H - BASE}" fill="${th.near}"/><rect x="0" y="${BASE}" width="${W}" height="1.5" fill="${ka}" opacity=".7"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="100%" aria-hidden="true" class="scenery" data-phase="${phase}" data-tod="${tod}" style="display:block">
<defs>
<linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${th.sky[0]}"/><stop offset="1" stop-color="${th.sky[1]}"/></linearGradient>
<linearGradient id="${uid}-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(${th.fog})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${th.fog})" stop-opacity=".55"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#${uid}-sky)"/>
<rect width="${W}" height="${H}" fill="#05060a" opacity="${dim}"/>
${stars.join('')}${body}
<path d="${hillPath(cardId + 'far', W, 80, 30, 40)}" fill="${th.far}"/>
<path d="${hillPath(cardId + 'near', W, 96, 22, 30)}" fill="${th.near}" opacity=".85"/>
<rect x="0" y="58" width="${W}" height="48" fill="url(#${uid}-mist)"/>
${shapes.join('')}
${accentGround}
</svg>`;
}

/**
 * «Погода» варіанта: куди зсунуться показники. Бачиш лише те, що розумієш:
 * тіло (здоров'я, бадьорість, запаси) видно завжди; зв'язки відкриваються з розумінням 3,
 * довіра й розуміння — з розумінням 6. Решта — порожні слоти. Числа не показуються.
 */
export function optionWeatherSvg(cardId, optionId, stats, understanding = 0) {
  const s = stats ?? {};
  const W = 120, H = 18;
  const keys = ['health', 'energy', 'supplies', 'bonds', 'trust', 'understanding'];
  const need = { health: 0, energy: 0, supplies: 0, bonds: 3, trust: 6, understanding: 6 };
  const bars = [];
  keys.forEach((k, i) => {
    const x = 4 + i * 19;
    if (understanding < need[k]) {
      bars.push(`<rect x="${x}" y="${H - 6}" width="12" height="2" rx="1" fill="#55523f" opacity=".5"><title>не видно, поки не розумієш більше</title></rect>`);
      return;
    }
    const v = s[k] ?? 0;
    const h = Math.min(12, Math.abs(v) * 3.4 + 1.5);
    const y = v >= 0 ? H - 4 - h : H - 4;
    const word = v > 0 ? 'зросте' : v < 0 ? 'впаде' : 'не зміниться';
    bars.push(`<rect x="${x}" y="${f(y)}" width="12" height="${f(h)}" rx="1" fill="${STAT_COLORS[k]}" opacity="${v === 0 ? 0.18 : 0.8}"><title>${esc(STAT_NAMES[k])}: ${word}</title></rect>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" class="weather" data-card="${esc(cardId)}" data-opt="${esc(optionId)}">${bars.join('')}</svg>`;
}
