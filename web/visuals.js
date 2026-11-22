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

// ─────────────── Візуалізації на картці ───────────────

const CH = {
  event: { accent: '#e0b04a', glow: 'rgba(224,176,74,.16)' },
  routine: { accent: '#8d8977', glow: 'rgba(141,137,119,.12)' },
  person: { accent: '#a8728f', glow: 'rgba(168,114,143,.16)' },
  system: { accent: '#c9563f', glow: 'rgba(201,86,63,.14)' },
  final: { accent: '#e6e2d4', glow: 'rgba(230,226,212,.14)' },
};

/** Стабільне число з рядка — щоб випадкова на вигляд алея була однакова для тієї самої картки. */
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Лінія горизонту для картки: силуети того, що навколо — дерева, стовпи, дахи.
 * Детерміновано від id картки й типу: та сама сцена має той самий краєвид.
 */
export function cardScenerySvg(cardId, kind, day = 1) {
  const r = seedOf(cardId);
  const c = CH[kind] ?? CH.event;
  const W = 600, H = 86, BASE = H - 10;
  const shapes = [];
  const count = 9 + Math.floor(r * 6);
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const jitter = seedOf(cardId + ':' + i);
    const x = t * W + (jitter - 0.5) * 26;
    const tall = 10 + jitter * 30;
    const wide = 3 + jitter * 7;
    if (jitter > 0.62) {
      // дерево: стовп і кілька гілок
      shapes.push(`<path d="M${x.toFixed(1)},${BASE} L${x.toFixed(1)},${(BASE - tall).toFixed(1)}" stroke="${c.accent}" stroke-width="1.1" opacity=".5"/>`);
      for (let b = 0; b < 3; b += 1) {
        const hh = BASE - tall * (0.45 + b * 0.18);
        const dir = b % 2 ? 1 : -1;
        shapes.push(`<path d="M${x.toFixed(1)},${hh.toFixed(1)} l${(dir * (wide + 3)).toFixed(1)},${(-4 - b).toFixed(1)}" stroke="${c.accent}" stroke-width=".9" opacity=".38"/>`);
      }
    } else if (jitter > 0.34) {
      // стовп або щогла
      shapes.push(`<rect x="${(x - wide / 6).toFixed(1)}" y="${(BASE - tall * 0.9).toFixed(1)}" width="${(wide / 3).toFixed(1)}" height="${(tall * 0.9).toFixed(1)}" fill="${c.accent}" opacity=".32"/>`);
    } else {
      // низька хата або брила
      const h = 6 + jitter * 12;
      shapes.push(`<path d="M${(x - wide).toFixed(1)},${BASE} L${(x - wide).toFixed(1)},${(BASE - h).toFixed(1)} L${x.toFixed(1)},${(BASE - h - 4).toFixed(1)} L${(x + wide).toFixed(1)},${(BASE - h).toFixed(1)} L${(x + wide).toFixed(1)},${BASE} Z" fill="${c.accent}" opacity=".26"/>`);
    }
  }
  const ground = `<path d="M0,${BASE} L${W},${BASE}" stroke="${c.accent}" stroke-width="1" opacity=".45"/>`;
  // Розриви: чим довше триває забіг, тим більше видно «того, що не наше».
  const stars = [];
  const n = 6 + Math.floor(seedOf(cardId + 'stars') * 8);
  for (let i = 0; i < n; i += 1) {
    const s = seedOf(cardId + 's' + i);
    stars.push(`<circle cx="${(s * W).toFixed(1)}" cy="${(6 + s * 24).toFixed(1)}" r="${(s * 1.1 + 0.3).toFixed(2)}" fill="#e6e2d4" opacity="${(0.10 + s * 0.18).toFixed(2)}"/>`);
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" width="100%" aria-hidden="true" class="scenery" style="display:block">
<defs><radialGradient id="glow-${esc(kind)}" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="${c.glow}"/><stop offset="1" stop-color="transparent"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#glow-${esc(kind)})"/>
${stars.join('')}
${shapes.join('')}
${ground}
</svg>`;
}

/**
 * Туман навколо вибраного варіанта: що робить цей вибір із показниками.
 * Показує напрямок, не числа: «стане холодніше», «будеш ближче до людей».
 */
export function optionWeatherSvg(cardId, optionId, stats) {
  const s = stats ?? {};
  const W = 120, H = 18;
  const bars = [];
  const keys = ['health', 'energy', 'supplies', 'trust', 'understanding', 'bonds'];
  const colors = {
    health: '#c9563f', energy: '#6f8fa8', supplies: '#8d8977',
    trust: '#e0b04a', understanding: '#7e9b62', bonds: '#a8728f',
  };
  keys.forEach((k, i) => {
    const v = s[k] ?? 0;
    const x = 4 + i * 19;
    const h = Math.min(12, Math.abs(v) * 3.4 + 1.5);
    const y = v >= 0 ? H - 4 - h : H - 4;
    bars.push(`<rect x="${x}" y="${y.toFixed(1)}" width="12" height="${h.toFixed(1)}" rx="1" fill="${colors[k]}" opacity="${v === 0 ? 0.18 : 0.75}"><title>${esc(STAT_NAMES[k])} ${v > 0 ? '+' : ''}${v}</title></rect>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" class="weather" data-card="${esc(cardId)}" data-opt="${esc(optionId)}">${bars.join('')}</svg>`;
}
