// Дерево подій: будується з контенту, а не малюється вручну, тож не застаріває.
// Запуск: npm run tree  →  docs/event-tree.html (картинка) і docs/EVENT_TREE.md (Mermaid).
import { writeFileSync } from 'node:fs';
import { TEST_CARDS } from '../data/test-content.ts';
import type { Card, NextEvent } from '../src/types.ts';

type EdgeKind = 'next' | 'flag' | 'echo' | 'gate';
interface Edge { from: string; to: string; kind: EdgeKind; label: string; days?: number }

const byId = new Map(TEST_CARDS.map((c) => [c.id, c]));
const short = (t: string, n = 38) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
const nextList = (n?: NextEvent | NextEvent[]) => (n ? (Array.isArray(n) ? n : [n]) : []);

// Хто ставить прапорець.
const setters = new Map<string, { card: string; option: string; text: string }[]>();
for (const c of TEST_CARDS) {
  for (const o of c.options) {
    const flags = [
      ...Object.keys(o.effects?.flags ?? {}),
      ...(o.conditionalEffects ?? []).flatMap((ce) => Object.keys(ce.then.flags ?? {})),
    ];
    for (const f of flags) {
      const arr = setters.get(f) ?? [];
      arr.push({ card: c.id, option: o.id, text: o.text });
      setters.set(f, arr);
    }
  }
}

const edges: Edge[] = [];
const seen = new Set<string>();
const add = (e: Edge) => {
  const key = `${e.from}>${e.to}:${e.kind}:${e.label}`;
  if (e.from !== e.to && !seen.has(key) && byId.has(e.from) && byId.has(e.to)) {
    seen.add(key);
    edges.push(e);
  }
};

for (const c of TEST_CARDS) {
  for (const o of c.options) {
    for (const n of nextList(o.next)) {
      const to = typeof n === 'string' ? n : n.card;
      add({ from: c.id, to, kind: 'next', label: short(o.text, 28), days: typeof n === 'string' ? 0 : n.inDays ?? 0 });
    }
  }
  // Жорстка залежність: картка існує лише після певного вчинку.
  for (const f of c.requires?.flagTrue ?? []) {
    for (const s of setters.get(f) ?? []) add({ from: s.card, to: c.id, kind: 'flag', label: short(s.text, 28) });
  }
  // Echo: картка пам'ятає вчинок (м'яка залежність — картка від цього не зникає).
  for (const e of c.echo ? (Array.isArray(c.echo) ? c.echo : [c.echo]) : []) {
    for (const s of setters.get(e.flag) ?? []) add({ from: s.card, to: c.id, kind: 'echo', label: short(s.text, 28) });
  }
  // Варіанти, відкриті вчинком.
  for (const o of c.options) {
    for (const f of o.requires?.flagTrue ?? []) {
      for (const s of setters.get(f) ?? []) add({ from: s.card, to: c.id, kind: 'gate', label: `відкриває: ${short(o.text, 22)}` });
    }
  }
}

// «flag» дублює «next», коли обидва ведуть з тієї ж пари карток: next важливіший.
const nextPairs = new Set(edges.filter((e) => e.kind === 'next').map((e) => `${e.from}>${e.to}`));
const finalEdges = edges.filter((e) => e.kind !== 'flag' || !nextPairs.has(`${e.from}>${e.to}`));

const linked = new Set<string>();
// Дерево — це жорсткі зв'язки; echo лише тло (м'які спогади), вони не роблять картку «деревною».
for (const e of finalEdges) if (e.kind !== 'echo') { linked.add(e.from); linked.add(e.to); }

// ---------- HTML + SVG
const COLW = 300, NODEW = 220, NODEH = 34, GAP = 14, TOP = 70, LEFT = 30;
const phases = [1, 2, 3, 4, 5] as const;
const colOf = (c: Card) => Math.min(...c.phase) - 1;
const cols: Card[][] = phases.map(() => []);
// Спершу пов'язані картки (вони — дерево), потім самотні.
for (const c of TEST_CARDS) if (linked.has(c.id)) cols[colOf(c)]!.push(c);
for (const c of TEST_CARDS) if (!linked.has(c.id)) cols[colOf(c)]!.push(c);
const pos = new Map<string, { x: number; y: number }>();
cols.forEach((col, ci) => col.forEach((c, ri) => pos.set(c.id, { x: LEFT + ci * COLW, y: TOP + ri * (NODEH + GAP) })));
const H = TOP + Math.max(...cols.map((c) => c.length)) * (NODEH + GAP) + 30;
const W = LEFT * 2 + COLW * 5;

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const STYLE: Record<EdgeKind, { color: string; dash: string; w: number }> = {
  next: { color: '#e0b04a', dash: '', w: 2.4 },
  flag: { color: '#7e9b62', dash: '', w: 1.6 },
  echo: { color: '#6f8fa8', dash: '2 4', w: 1.2 },
  gate: { color: '#a8728f', dash: '6 4', w: 1.2 },
};

const drawOrder: EdgeKind[] = ['echo', 'gate', 'flag', 'next'];
const edgeSvg = [...finalEdges].sort((a, b) => drawOrder.indexOf(a.kind) - drawOrder.indexOf(b.kind)).map((e) => {
  const a = pos.get(e.from)!, b = pos.get(e.to)!;
  const st = STYLE[e.kind];
  const x1 = a.x + NODEW, y1 = a.y + NODEH / 2;
  const forward = b.x > a.x;
  const x2 = forward ? b.x : b.x + NODEW, y2 = b.y + NODEH / 2;
  const dx = forward ? (x2 - x1) / 2 : 70;
  const c1x = x1 + (forward ? dx : 70), c2x = forward ? x2 - dx : x2 + 70;
  const title = `${byId.get(e.from)!.id} → ${byId.get(e.to)!.id}\n«${e.label}»${e.days ? `\nчерез ${e.days} дн.` : ''}`;
  return `<path d="M${x1},${y1} C${c1x},${y1} ${c2x},${y2} ${x2},${y2}" fill="none" stroke="${st.color}" stroke-width="${st.w}" ${st.dash ? `stroke-dasharray="${st.dash}"` : ''} opacity="${e.kind === 'echo' ? 0.28 : 0.9}" marker-end="url(#a-${e.kind})"><title>${esc(title)}</title></path>`;
}).join('\n');

const nodeSvg = TEST_CARDS.map((c) => {
  const p = pos.get(c.id)!;
  const on = linked.has(c.id);
  const range = c.phase.length > 1 ? `ф${Math.min(...c.phase)}–${Math.max(...c.phase)}` : `ф${c.phase[0]}`;
  return `<g transform="translate(${p.x},${p.y})" opacity="${on ? 1 : 0.42}"><title>${esc(c.id)}\n${esc(c.text)}</title>
<rect width="${NODEW}" height="${NODEH}" rx="4" fill="${on ? '#26261c' : '#1c1c16'}" stroke="${on ? '#8d8977' : '#33332a'}"/>
<text x="8" y="14" font-size="10" fill="#e6e2d4">${esc(short(c.id, 30))}</text>
<text x="8" y="27" font-size="9" fill="#8d8977">${esc(short(c.text, 34))}</text>
<text x="${NODEW - 6}" y="12" font-size="8" fill="#8d8977" text-anchor="end">${range}${c.once ? ' · раз' : ''}</text></g>`;
}).join('\n');

const colHeads = phases.map((p, i) => `<text x="${LEFT + i * COLW}" y="40" font-size="13" fill="#e6e2d4" font-weight="600">Фаза ${p}</text>`).join('');
const markers = (Object.keys(STYLE) as EdgeKind[]).map((k) =>
  `<marker id="a-${k}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${STYLE[k].color}"/></marker>`).join('');

const legend = [
  ['next', 'вибір гарантовано веде до події (`next`), іноді з відстрочкою'],
  ['flag', 'вчинок відкриває картку (`requires.flagTrue`)'],
  ['echo', 'картка згадує вчинок, але від нього не залежить'],
  ['gate', 'вчинок відкриває варіант на іншій картці'],
] as const;
const counts = Object.fromEntries((['next', 'flag', 'echo', 'gate'] as EdgeKind[]).map((k) => [k, finalEdges.filter((e) => e.kind === k).length]));

const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Дерево подій — Новобранець</title>
<style>body{margin:0;background:#14140f;color:#e6e2d4;font-family:Georgia,serif}
header{padding:16px 30px;border-bottom:1px solid #33332a}h1{margin:0 0 6px;font-size:20px}
.leg{display:flex;gap:22px;flex-wrap:wrap;font:12px ui-monospace,monospace;color:#8d8977}
.leg i{display:inline-block;width:26px;height:0;border-top:3px solid;vertical-align:middle;margin-right:6px}
.wrap{overflow:auto}svg{font-family:ui-monospace,monospace}</style></head><body>
<header><h1>Дерево подій</h1>
<div style="font:13px ui-monospace,monospace;color:#8d8977;margin-bottom:10px">${TEST_CARDS.length} карток, ${linked.size} у дереві (жорсткі зв’язки), ${finalEdges.length} ребер разом з м’якими спогадами. Наведи курсор на картку чи лінію — буде текст. Тьмяні картки не мають жорстких зв’язків: вони вільні в межах своїх фаз і з’являються раз за забіг.</div>
<div class="leg">${legend.filter(([k]) => counts[k]).map(([k, t]) => `<span><i style="border-color:${STYLE[k].color};border-top-style:${k === 'echo' ? 'dotted' : k === 'gate' ? 'dashed' : 'solid'}"></i>${t} (${counts[k]})</span>`).join('')}</div></header>
<div class="wrap"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${markers}</defs>${colHeads}${edgeSvg}${nodeSvg}</svg></div></body></html>`;
writeFileSync(new URL('../docs/event-tree.html', import.meta.url), html);

// ---------- Mermaid (рендериться на GitHub)
const mid = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');
const mm: string[] = ['```mermaid', 'flowchart LR'];
for (const p of phases) {
  const cs = TEST_CARDS.filter((c) => linked.has(c.id) && Math.min(...c.phase) === p);
  if (!cs.length) continue;
  mm.push(`  subgraph F${p}["Фаза ${p}"]`);
  for (const c of cs) mm.push(`    ${mid(c.id)}["${short(c.id, 30)}<br/><small>${short(c.text, 30).replace(/"/g, "'")}</small>"]`);
  mm.push('  end');
}
for (const e of finalEdges.filter((x) => x.kind !== 'echo')) {
  const arrow = e.kind === 'next' ? '==>' : e.kind === 'flag' ? '-->' : '-.->';
  const lbl = `${e.label.replace(/["|]/g, "'")}${e.days ? ` · +${e.days} дн.` : ''}`;
  mm.push(`  ${mid(e.from)} ${arrow}|"${lbl}"| ${mid(e.to)}`);
}
mm.push('```');
writeFileSync(new URL('../docs/EVENT_TREE.md', import.meta.url), `# Дерево подій

Генерується з контенту: \`npm run tree\`. Інтерактивна картинка з усіма ${TEST_CARDS.length} картками — [event-tree.html](event-tree.html).

- **Товста стрілка** — \`next\`: вибір гарантовано веде до події (іноді через N днів).
- **Тонка** — вчинок відкриває картку (\`requires.flagTrue\`).
- **Пунктир** — вчинок відкриває варіант на іншій картці.
- Echo-зв’язки (м’які спогади) показані лише на картинці.

Кожна картка показується **не більше одного разу за забіг**, тож дерево не повторюється, а гілка або спрацьовує, або ні.

${mm.join('\n')}
`);
console.log(`✅ дерево: ${TEST_CARDS.length} карток, ${linked.size} у зв’язках, ребра:`, counts);
