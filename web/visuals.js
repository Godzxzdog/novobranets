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
