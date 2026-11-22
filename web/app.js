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
const STAT_NAMES = {
  health: 'Здоров’я',
  energy: 'Бадьорість',
  supplies: 'Запаси',
  trust: 'Довіра',
  understanding: 'Розуміння',
  bonds: 'Зв’язки',
};
const SKILL_NAMES = {
  survival: 'Виживання',
  system: 'Система',
  people: 'Люди',
  drill: 'Муштра',
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

// Останній вибір: для «реакції на вибір» і підсвітки у щоденнику.
let lastChoice = null;
// true, поки показуємо реакцію — кнопки заблоковані.
let reactionOpen = false;
// «Привид» минулого шляху: коли граєш той самий seed, видно, де рішення розійшлися.
let ghost = null;

function pathOf(r) {
  return r.state.journal
    .filter((j) => j.optionId !== '__carried_out')
    .map((j) => ({ cardId: j.cardId, optionId: j.optionId, day: j.day }));
}

function ghostFor(card) {
  const g = ghost?.[run.state.decisions];
  return g && g.cardId === card.id ? g : null;
}

/** Гілки дерева, що спрацювали: «рішення → його наслідок». Показує, що світ відповідав на вибір. */
function branchesHtml() {
  const tree = run.state.tree ?? [];
  if (!tree.length) return '';
  const byId = new Map(TEST_CARDS.map((c) => [c.id, c]));
  const rows = tree.map((t) => {
    const from = byId.get(t.from);
    const opt = from?.options.find((o) => o.id === t.fromOption);
    const to = byId.get(t.to);
    return `<div class="branch"><span>д${t.fromDay} · ${escapeHtml(opt?.text ?? t.fromOption)}</span>`
      + `<span class="arrow">↓ через ${t.day - t.fromDay} дн.</span>`
      + `<span>д${t.day} · ${escapeHtml((to?.lead ?? to?.text ?? t.to).slice(0, 90))}</span></div>`;
  }).join('');
  return `<div class="branches"><div class="meta">Гілки твого шляху: ${tree.length}</div>${rows}</div>`;
}

function divergence() {
  if (!ghost) return '';
  const now = pathOf(run);
  const n = Math.max(now.length, ghost.length);
  for (let i = 0; i < n; i += 1) {
    if (!now[i] || !ghost[i] || now[i].cardId !== ghost[i].cardId || now[i].optionId !== ghost[i].optionId) {
      const day = (now[i] ?? ghost[i]).day;
      return `Ти розійшовся зі своїм минулим шляхом на рішенні №${i + 1} (день ${day}).`;
    }
  }
  return 'Ти повторив той самий шлях до кінця.';
}

function newSeed() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderStats(highlight = {}) {
  const s = run.state.stats;
  elStats.innerHTML = Object.keys(STAT_LABELS).map((k) => {
    const v = s[k];
    const pct = (v / 10) * 100;
    const pair = k === 'trust' || k === 'understanding' ? ' pair' : '';
    const d = highlight[k] ?? 0;
    const cls = d > 0 ? ' up' : d < 0 ? ' down' : '';
    const delta = d === 0 ? '' : `<span class="delta">${d > 0 ? '+' : ''}${d}</span>`;
    return `<div class="stat${pair}${cls}" title="${STAT_NAMES[k]}: ${v}/10">
      <div class="bar"><div class="fill" style="height:${pct}%"></div></div>
      <div class="label">${STAT_LABELS[k]}</div>${delta}
    </div>`;
  }).join('');
}

function renderLog() {
  const last = run.state.journal.slice(-3).reverse();
  elLog.innerHTML = last.map((j) => `<div>д${j.day} · ${escapeHtml(j.text)}</div>`).join('');
}

function render() {
  elDay.textContent = `День ${run.state.day} · фаза ${run.state.phase}`;
  renderStats();
  renderLog();

  if (run.state.status === 'ended') return renderEnding();

  const card = run.draw();
  if (!card) return renderEnding();

  const available = new Set(run.availableOptions().map((o) => o.id));
  const ghostPick = ghostFor(card);
  // Зв'язок з попереднім: рядок «звідки» показуємо лише тоді, коли картка
  // справді продовжує попередню сцену, а не просто має поле lead.
  const link = run.lastCard();
  const isContinuation = !!(link && card.id !== link.id
    && ((card.follows ?? []).includes(link.id) || (card.after ?? []).includes(link.id)));
  const lead = isContinuation ? (card.lead ?? `Після: ${link.text.slice(0, 60)}…`) : null;
  // Пам'ять рішень: картка може згадати те, що ти зробив раніше.
  const echoes = run.echoLines(card);

  elMain.innerHTML = `
    <div class="card">
      <span class="kind" style="top:10px;left:12px">${KIND_LABELS[card.kind] ?? ''}</span>
      ${lead ? `<div class="lead">${isContinuation ? '↳ ' : ''}${escapeHtml(lead)}</div>` : ''}
      ${echoes.map((l) => `<div class="echo">${escapeHtml(l)}</div>`).join('')}
      <div>${escapeHtml(card.text)}</div>
    </div>
    <div class="options">
      ${card.options.map((o) => {
        const tag = ghostPick && ghostPick.optionId === o.id ? '<span class="ghost-tag">↺ минулого разу ти обрав це</span>' : '';
        return available.has(o.id)
          ? `<button class="opt${tag ? ' ghost' : ''}" data-opt="${escapeHtml(o.id)}">${escapeHtml(o.text)}${tag}</button>`
          : `<button class="opt locked" disabled>${escapeHtml(o.text)}<span class="hint">${escapeHtml(run.lockedHint(o))}</span></button>`;
      }).join('')}
    </div>
  `;

  elMain.querySelectorAll('button.opt[data-opt]').forEach((btn) => {
    btn.addEventListener('click', () => onChoose(card, btn));
  });
}

/** Вибір картки: підсвітка натиснутого, решта гасне, далі реакція. */
function onChoose(card, btn) {
  if (reactionOpen) return;
  reactionOpen = true;

  const option = card.options.find((o) => o.id === btn.dataset.opt);
  if (!option) { reactionOpen = false; return; }

  const before = { ...run.state.stats, ...run.state.skills };
  if (!run.choose(option.id)) { reactionOpen = false; return; }
  const after = { ...run.state.stats, ...run.state.skills };

  btn.classList.add('chosen');
  elMain.querySelectorAll('button.opt').forEach((b) => {
    if (b !== btn) b.classList.add('faded');
    b.classList.add('locked');
    b.setAttribute('disabled', '');
  });

  const reaction = buildReaction(option, before, after);
  renderStats(reaction.statDelta);
  renderLog();

  // Сцена-наслідок замінює картку цілком: що саме сталося і що це змінило.
  const scene = run.state.lastOutcome ?? {};
  const box = document.createElement('div');
  box.className = 'outcome';
  box.innerHTML = `
    <div class="o-head">Що з цього вийшло</div>
    <p class="o-text">${escapeHtml(scene.text ?? reaction.line)}</p>
    ${scene.voice ? `<p class="o-voice">${escapeHtml(scene.voice)}</p>` : ''}
    <div class="o-choice">➜ ${escapeHtml(option.text)}</div>
    ${reaction.changes.length ? `<div class="r-changes">${reaction.changes.join(' · ')}</div>` : ''}
    <button class="r-next" id="next">Далі</button>
  `;
  elMain.innerHTML = '';
  elMain.appendChild(box);

  const next = document.getElementById('next');
  next.addEventListener('click', () => {
    reactionOpen = false;
    // Кнопка гасне одразу: без цього другий швидкий клік встигає викликати
    // обробник ще раз і картка застрягає.
    next.disabled = true;
    elMain.querySelectorAll('button.opt').forEach((b) => b.setAttribute('disabled', ''));
    lastChoice = null;
    render();
  });
}

function buildReaction(option, before, after) {
  const statDelta = {};
  const changes = [];
  for (const k of Object.keys(STAT_NAMES)) {
    const d = after[k] - before[k];
    if (d !== 0) {
      statDelta[k] = d;
      changes.push(`${STAT_NAMES[k]} ${d > 0 ? '+' : ''}${d}`);
    }
  }
  for (const k of Object.keys(SKILL_NAMES)) {
    const d = after[k] - before[k];
    if (d !== 0) changes.push(`${SKILL_NAMES[k]} +${d}`);
  }

  // Голос двигуна: пріоритет — те, що гравець сам написав/заклав у контент.
  let line = option.effects?.journal;
  if (!line) line = pickNeutralLine(option.id, changes);
  return { line, changes, statDelta };
}

function pickNeutralLine(id, changes) {
  const pool = changes.length ? NEUTRAL.with : NEUTRAL.none;
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return pool[h % pool.length];
}

const NEUTRAL = {
  none: [
    'Ти обрав. Нічого не змінилося — іноді це найкраще, що сталося за день.',
    'Нічого не відбулося. День пішов далі, як пішов би й без тебе.',
    'Рішення без наслідків. Поки що.',
  ],
  with: [
    'Вибір має ціну. Вона списана з тебе, а не з когось іншого.',
    'Щось змінилося. Не завжди в той бік, у який ти думав.',
    'Ти вирішив. Наслідки вирішуватимуть за тебе далі.',
    'Це якось відгукнеться. Не зараз, то пізніше.',
    'Військо не питає згодом — військо вже все записало.',
  ],
};

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
      ${branchesHtml()}
      ${ghost ? `<div class="meta">${escapeHtml(divergence())}</div>` : ''}
      <div class="meta">
        Розуміння ${st.stats.understanding}/10 · Зв'язки ${st.stats.bonds}/10 ·
        Виживання ${st.skills.survival} · Система ${st.skills.system} ·
        Люди ${st.skills.people} · Муштра ${st.skills.drill}
      </div>
      <button class="btn" id="again">Прожити ще раз</button>
      <button class="btn second" id="same">Той самий світ — інші рішення (seed ${escapeHtml(st.seed)})</button>
    </div>
  `;
  document.getElementById('again').addEventListener('click', () => {
    ghost = null;
    run = new Run({ seed: newSeed(), content: { cards: TEST_CARDS, endings: TEST_ENDINGS } });
    render();
  });
  document.getElementById('same').addEventListener('click', () => {
    ghost = pathOf(run);
    run = new Run({ seed: st.seed, content: { cards: TEST_CARDS, endings: TEST_ENDINGS } });
    render();
  });
}

render();
