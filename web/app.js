import { Run } from '../src/run.ts';
import { TEST_CARDS, TEST_ENDINGS } from '../data/test-content.ts';

const STAT_LABELS = {
  health: 'Здор',
  energy: 'Бадь',
  supplies: 'Зап',
  trust: 'Дов',
  understanding: 'Роз',
  bonds: "Зв'яз",
};
const KIND_LABELS = {
  event: 'подія', routine: 'побут', person: 'людина', system: 'система', final: 'фінал',
};

const elDay = document.getElementById('day');
const elStats = document.getElementById('stats');
const elMain = document.getElementById('main');
const elLog = document.getElementById('log');

let run = new Run({
  seed: newSeed(),
  content: { cards: TEST_CARDS, endings: TEST_ENDINGS },
});

function newSeed() {
  return Math.random().toString(36).slice(2, 10);
}

function renderStats() {
  const s = run.state.stats;
  elStats.innerHTML = Object.keys(STAT_LABELS).map((k) => {
    const v = s[k];
    const pct = (v / 10) * 100;
    const pair = k === 'trust' || k === 'understanding' ? ' pair' : '';
    return `<div class="stat${pair}">
      <div class="bar"><div class="fill" style="height:${pct}%"></div></div>
      <div class="label">${STAT_LABELS[k]}</div>
    </div>`;
  }).join('');
}

function renderLog() {
  const last = run.state.journal.slice(-3).reverse();
  elLog.innerHTML = last.map((j) => `<div>д${j.day} · ${escapeHtml(j.text)}</div>`).join('');
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function render() {
  elDay.textContent = `День ${run.state.day} · фаза ${run.state.phase}`;
  renderStats();
  renderLog();

  if (run.state.status === 'ended') return renderEnding();

  const card = run.draw();
  if (!card) return renderEnding();

  const available = new Set(run.availableOptions().map((o) => o.id));

  elMain.innerHTML = `
    <div class="card" style="position:relative">
      <span class="kind" style="top:10px;left:12px">${KIND_LABELS[card.kind] ?? ''}</span>
      <div>${escapeHtml(card.text)}</div>
    </div>
    <div class="options">
      ${card.options.map((o) => available.has(o.id)
        ? `<button class="opt" data-opt="${escapeHtml(o.id)}">${escapeHtml(o.text)}</button>`
        : `<button class="opt locked" disabled>${escapeHtml(o.text)}<span class="hint">${escapeHtml(o.lockedHint ?? 'недоступно')}</span></button>`
      ).join('')}
    </div>
  `;

  elMain.querySelectorAll('button.opt[data-opt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (run.choose(btn.dataset.opt)) render();
    });
  });
}

function renderEnding() {
  const e = run.ending();
  const st = run.state;
  const title = e?.title ?? 'Кінець';
  const epilogue = e?.epilogue ?? 'Забіг обірвався без записаного фіналу.';
  const epitaph = e?.defaultEpitaph ?? '';

  elMain.innerHTML = `
    <div class="ending">
      <div class="meta">${title} · день ${st.day} · ${st.decisions} рішень</div>
      <h1>${escapeHtml(title)}</h1>
      <p class="ep">${escapeHtml(epitaph)}</p>
      <p>${escapeHtml(epilogue)}</p>
      <div class="meta">
        Розуміння ${st.stats.understanding}/10 · Зв'язки ${st.stats.bonds}/10 ·
        Виживання ${st.skills.survival} · Система ${st.skills.system} ·
        Люди ${st.skills.people} · Муштра ${st.skills.drill}
      </div>
      <button class="btn" id="again">Прожити ще раз</button>
      <button class="btn second" id="same">Той самий шлях (seed ${escapeHtml(st.seed)})</button>
    </div>
  `;
  document.getElementById('again').addEventListener('click', () => {
    run = new Run({ seed: newSeed(), content: { cards: TEST_CARDS, endings: TEST_ENDINGS } });
    render();
  });
  document.getElementById('same').addEventListener('click', () => {
    run = new Run({ seed: st.seed, content: { cards: TEST_CARDS, endings: TEST_ENDINGS } });
    render();
  });
}

render();
