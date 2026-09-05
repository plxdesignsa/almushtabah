// main.js — تطبيق اللعب (المرحلة 2): قائمة القضايا، اللوحة، البطاقات، الأدوات.
//
// المحرّك نفسه يعمل في المتصفح بلا أي تعديل: نحمّل ملف القضية، نبني المشهد،
// نحلّه مرة واحدة لاستخراج سلّم التلميحات والقاتل، ثم لا نستشير الحل إلا عند التسليم.

import { CLUE_TYPES } from '../../src/engine/clues.js';
import { arNum, describeGlobalRule, describeRung } from '../../src/engine/describe.js';
import { Scene } from '../../src/engine/scene.js';
import { hintLadder, solve } from '../../src/engine/solver.js';
import { Game } from './game.js';
import { iconFor } from './icons.js';
import { partialViolations } from './partial.js';

const app = document.getElementById('app');
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
};
const TIER_AR = { easy: 'سهل', medium: 'متوسط', hard: 'صعب', expert: 'خبير' };

// ---------- التوجيه ----------
window.addEventListener('hashchange', route);
route();

async function route() {
  const m = /^#\/case\/([\w-]+)/.exec(location.hash);
  try {
    if (m) await openCase(m[1]);
    else await showList();
  } catch (e) {
    app.replaceChildren(h('div', { class: 'error' }, `تعذّر التحميل: ${e.message}`));
    console.error(e);
  }
}

async function fetchJSON(path) {
  const r = await fetch(path, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

// ---------- قائمة القضايا ----------
async function showList() {
  document.title = 'المشتبه';
  const catalog = await fetchJSON('/cases/catalog.json');
  const groups = ['easy', 'medium', 'hard', 'expert'].map((tier) => ({ tier, items: catalog.filter((c) => c.difficulty === tier) }));
  app.replaceChildren(
    h('header', { class: 'mast' }, h('h1', {}, 'المشتبه'), h('p', { class: 'lead' }, 'خريطة مسرح الجريمة أمامك. ضع الشهود في أماكنهم من كلامهم، ومن ينتهي في غرفة الضحية هو القاتل.')),
    h('main', { class: 'list' },
      groups.map((g) => g.items.length && h('section', {},
        h('h2', {}, TIER_AR[g.tier]),
        h('div', { class: 'cases' }, g.items.map((c) => {
          const saved = localStorage.getItem(`mushtabah:${c.id}`);
          const done = saved && JSON.parse(saved).finished?.correct;
          return h('a', { class: `case-card ${done ? 'done' : ''}`, href: `#/case/${c.id}` },
            h('div', { class: 'case-title' }, c.title_ar ?? c.id),
            h('div', { class: 'case-meta' }, `${arNum(c.size)}×${arNum(c.size)} · ${arNum(c.suspects)} مشتبه · ${arNum(c.rooms)} غرف`),
            done ? h('div', { class: 'badge' }, 'حُلّت ✓') : saved ? h('div', { class: 'badge soft' }, 'جارية') : null,
          );
        })),
      )),
    ),
  );
}

// ---------- القضية ----------
async function openCase(id) {
  const [raw, overlay] = await Promise.all([fetchJSON(`/cases/${id}.json`), fetchJSON(`/cases/i18n/ar/${id}.json`).catch(() => ({}))]);
  const scene = new Scene(raw);
  const solved = solve(scene);
  const ladder = hintLadder(solved.trace);
  const game = new Game(scene, `mushtabah:${id}`);
  const N = {
    char: (i) => overlay.chars?.[scene.char(i).key] ?? scene.char(i).key,
    room: (i) => overlay.rooms?.[scene.room(i).key] ?? scene.room(i).key,
    object: (k) => overlay.objects?.[k] ?? k,
    cls: (c) => overlay.classes?.[c] ?? c,
  };
  document.title = `${overlay.title ?? id} — المشتبه`;

  const ui = { focusRoom: null, linked: new Set(), linkedChars: new Set(), toast: null, shake: new Set(), hint: null, hintShown: 0 };
  const classes = [...new Set(scene.characters.map((c) => c.class))];
  const classIdx = (c) => classes.indexOf(c);

  // ---- اللوحة ----
  const cellSize = () => {
    const avail = Math.min(window.innerWidth, 1100) - 40;
    return Math.max(30, Math.min(58, Math.floor(avail / (scene.size + 1))));
  };

  function render() {
    const viol = partialViolations(scene, game.placed);
    const cs = cellSize();
    app.style.setProperty('--cell', `${cs}px`);
    app.replaceChildren(...[
      renderTop(viol),
      h('div', { class: 'stage' },
        renderCards(viol),
        renderBoard(viol),
      ),
      renderRules(viol),
      renderFooter(),
      ui.hint ? h('div', { class: 'sheet' },
        h('div', { class: 'sheet-head' }, h('strong', {}, `تلميح ${arNum(ui.hint.step)} من ${arNum(ladder.length)}`), h('button', { class: 'btn ghost', onclick: () => { ui.hint = null; ui.linked.clear(); render(); } }, 'إغلاق ✕')),
        h('div', { class: 'sheet-body' }, ui.hint.text),
      ) : null,
      ui.toast ? h('div', { class: `toast ${ui.toast.kind ?? ''}` }, ui.toast.text) : null,
    ].filter(Boolean));
    ui.shake = new Set();
  }

  function renderTop() {
    const placedCount = game.placed.filter((c) => c >= 0).length;
    return h('header', { class: 'topbar' },
      h('a', { class: 'btn ghost', href: '#/' }, '‹ القضايا'),
      h('div', { class: 'title' }, h('strong', {}, overlay.title ?? id), h('span', { class: 'muted' }, ` · ${TIER_AR[scene.difficulty] ?? ''} · ${arNum(scene.size)}×${arNum(scene.size)}`)),
      h('div', { class: 'tools' },
        h('button', { class: 'btn', onclick: () => { game.undo(); render(); }, disabled: !game.history.length, title: 'تراجع (Ctrl+Z)' }, '↶'),
        h('button', { class: 'btn', onclick: () => { game.redo(); render(); }, disabled: !game.future.length, title: 'إعادة (Ctrl+Y)' }, '↷'),
        h('button', { class: 'btn', onclick: showHint, title: 'تلميح' }, `💡 ${arNum(game.hintsUsed)}/${arNum(ladder.length)}`),
        h('button', { class: 'btn', onclick: () => { if (confirm('تمسح كل علامات ✗ والقلم؟ (المثبَّت يبقى)')) { game.clearMarks(); render(); } } }, 'مسح العلامات'),
        h('button', { class: `btn primary`, disabled: !game.allPlaced || game.finished?.correct, onclick: submit }, game.finished?.correct ? 'حُلّت ✓' : `تسليم ${arNum(placedCount)}/${arNum(scene.size)}`),
      ),
    );
  }

  function renderCards(viol) {
    const cards = [];
    if (scene.victim) {
      cards.push(h('div', { class: 'card victim' },
        h('div', { class: 'avatar victim' }, '✝'),
        h('div', { class: 'card-body' }, h('div', { class: 'name' }, `${N.char(scene.victim.id)} — الضحية`), h('div', { class: 'text' }, overlay.victimCard ?? 'وُجد وحده مع القاتل.')),
      ));
    }
    for (const ch of scene.characters) {
      if (ch.victim) continue;
      const myClues = scene.clues.filter((c) => c.char === ch.id && !c.implicit);
      const fallback = myClues.map((c) => overlay.clues?.[String(c.index)] ?? overlay.machineClues?.[String(c.index)] ?? c.type).join('، و');
      const text = overlay.cards?.[ch.key] ?? (fallback || 'ما عندي شي أقوله.');
      const alert = myClues.some((c) => viol.clues.has(c.index));
      const struck = myClues.length && myClues.every((c) => game.struck.has(c.index));
      const placed = game.placed[ch.id] >= 0;
      cards.push(h('div', {
        class: `card ${game.selected === ch.id ? 'active' : ''} ${alert ? 'alert' : ''} ${struck ? 'struck' : ''} ${placed ? 'placed' : ''} ${ui.linkedChars.has(ch.id) ? 'linked' : ''}`,
        dataset: { char: ch.id },
        onclick: () => { game.select(ch.id); linkClues(); render(); },
      },
        h('div', { class: `avatar c${classIdx(ch.class)}` }, N.char(ch.id).slice(0, 1)),
        h('div', { class: 'card-body' },
          h('div', { class: 'name' }, N.char(ch.id), h('span', { class: 'muted small' }, ` · ${N.cls(ch.class)}`), placed ? h('span', { class: 'pin' }, ' 📍') : null),
          h('div', { class: 'text' }, text),
        ),
        myClues.length ? h('button', { class: 'strike', title: 'شطب البطاقة (استعملتها)', onclick: (e) => { e.stopPropagation(); myClues.forEach((c) => game.toggleStrike(c.index)); render(); } }, struck ? '↺' : '✓') : null,
      ));
    }
    return h('aside', { class: 'cards' }, cards);
  }

  function renderBoard(viol) {
    const n = scene.size;
    const grid = h('div', { class: 'grid', style: `grid-template-columns: var(--hdr) repeat(${n}, var(--cell)); grid-template-rows: var(--hdr) repeat(${n}, var(--cell));` });
    grid.append(h('div', { class: 'hdr corner' }));
    for (let c = 0; c < n; c++) grid.append(h('div', { class: 'hdr col' }, arNum(c + 1)));
    const labelCell = roomLabelCells();
    for (let r = 0; r < n; r++) {
      grid.append(h('div', { class: 'hdr row' }, arNum(r + 1)));
      for (let c = 0; c < n; c++) {
        const cell = r * n + c;
        const room = scene.roomOfCell[cell];
        const roomObj = scene.room(room);
        const cls = ['cell', `room${room % 12}`];
        if (roomObj.restricted) cls.push('restricted');
        if (scene.blockedCells.has(cell)) cls.push('blocked');
        if (c === 0 || scene.roomOfCell[cell - 1] !== room) cls.push('wl');
        if (c === n - 1 || scene.roomOfCell[cell + 1] !== room) cls.push('wr');
        if (r === 0 || scene.roomOfCell[cell - n] !== room) cls.push('wt');
        if (r === n - 1 || scene.roomOfCell[cell + n] !== room) cls.push('wb');
        if (ui.focusRoom !== null && ui.focusRoom !== room) cls.push('dim');
        if (ui.linked.has(cell)) cls.push('linked');
        if (viol.cells.has(cell)) cls.push('bad');
        if (ui.shake.has(cell)) cls.push('shake');
        const occupant = game.charAt(cell);
        const pencil = game.pencil.get(cell);
        const el = h('div', { class: cls.join(' '), dataset: { cell }, onclick: () => onCell(cell), role: 'button', tabindex: -1,
          'aria-label': `صف ${r + 1} عمود ${c + 1}، ${N.room(room)}${occupant >= 0 ? '، ' + N.char(occupant) : ''}` });
        const obj = scene.objects.find((o) => o.cell === cell);
        if (obj) el.append(h('span', { class: 'obj', title: N.object(obj.key) }, iconFor(obj.key)));
        if (labelCell.get(room) === cell) el.append(h('span', { class: 'room-label', onclick: (e) => { e.stopPropagation(); ui.focusRoom = ui.focusRoom === room ? null : room; render(); } }, N.room(room)));
        if (occupant >= 0) el.append(h('span', { class: `token c${classIdx(scene.char(occupant).class)} ${game.selected === occupant ? 'sel' : ''} ${scene.char(occupant).victim ? 'victim' : ''}` }, N.char(occupant).slice(0, 2)));
        else if (pencil !== undefined) el.append(h('span', { class: 'pencil' }, N.char(pencil).slice(0, 2)));
        else if (game.marks.has(cell)) el.append(h('span', { class: 'mark' }, '✗'));
        grid.append(el);
      }
    }
    return h('div', { class: 'board-wrap', dir: 'ltr' }, grid);
  }

  function roomLabelCells() {
    // خلية التسمية: أقرب خلية لمركز الغرفة (بلا شيء إن أمكن).
    const map = new Map();
    for (const room of scene.rooms) {
      const cells = scene.cellsOfRoom[room.id];
      const cr = cells.reduce((s, c) => s + scene.rowOf(c), 0) / cells.length;
      const cc = cells.reduce((s, c) => s + scene.colOf(c), 0) / cells.length;
      const objCells = new Set(scene.objects.map((o) => o.cell));
      // نفضّل خلية بلا شيء، وليست على حافة اللوحة (حتى لا تُقطع التسمية)، وأقرب للمركز.
      const edge = (c) => (scene.colOf(c) === 0 || scene.colOf(c) === scene.size - 1 ? 1 : 0);
      const dist = (c) => Math.hypot(scene.rowOf(c) - cr, scene.colOf(c) - cc);
      const best = [...cells].sort((a, b) => (objCells.has(a) - objCells.has(b)) || (edge(a) - edge(b)) || (dist(a) - dist(b)))[0];
      map.set(room.id, best);
    }
    return map;
  }

  function renderRules(viol) {
    return h('section', { class: 'rules' },
      h('h3', {}, 'القواعد العامة'),
      h('ul', {}, scene.globalRules.map((g) => h('li', { class: viol.rules.has(g.index) ? 'alert' : '' }, describeGlobalRule(scene, g, overlay)))),
      h('p', { class: 'muted small' }, 'كل صف وكل عمود فيه شخص واحد فقط. «بجانب» تعني يمين أو يسار أو فوق أو تحت مباشرة وفي الغرفة نفسها. اضغط اسم غرفة لتركّز عليها، واضغط بطاقة لتحديد صاحبها وإظهار ما تشير إليه.'),
    );
  }

  function renderFooter() {
    if (!game.finished) return null;
    const f = game.finished;
    return h('section', { class: `result ${f.correct ? 'good' : 'bad'}` },
      f.correct
        ? h('div', {}, h('h3', {}, 'أحسنت، القضية حُلّت.'), h('p', {}, `القاتل: ${N.char(f.killer)} — ${f.killer !== null ? N.room(scene.roomOfCell[game.placed[f.killer]]) : ''}.`), h('p', { class: 'muted small' }, `استعملت ${arNum(game.hintsUsed)} تلميحًا.`), h('button', { class: 'btn', onclick: () => { game.restart(); render(); } }, 'إعادة من البداية'))
        : h('div', {}, h('h3', {}, 'ليس بعد.'), h('p', {}, `${arNum(f.wrong)} ${f.wrong === 1 ? 'شخصية في غير مكانها' : f.wrong === 2 ? 'شخصيتان في غير مكانهما' : 'شخصيات في غير أماكنها'}. راجع البطاقات المحمرّة.`)),
    );
  }

  // ---- أفعال ----
  function onCell(cell) {
    const what = game.tap(cell);
    if (what === 'occupied') { ui.shake.add(cell); toast('الخلية مشغولة'); }
    if (what === 'commit') ui.linked.clear();
    render();
  }

  function linkClues() {
    ui.linked = new Set();
    ui.linkedChars = new Set();
    if (game.selected === null) return;
    for (const clue of scene.clues) {
      if (clue.char !== game.selected) continue;
      const def = CLUE_TYPES[clue.type];
      if (def.kind === 'unary') {
        const pred = def.cellPredicate(scene, clue);
        for (let x = 0; x < scene.cellCount; x++) if (pred(x)) ui.linked.add(x);
      } else if (clue.other !== undefined) {
        ui.linkedChars.add(clue.other);
        if (game.placed[clue.other] >= 0) ui.linked.add(game.placed[clue.other]);
      }
    }
  }

  function showHint() {
    // إن كان آخر تلميح مفتوحًا، نعرض التالي؛ وإلا نعيد عرض آخر تلميح مستعمل بلا احتساب.
    const showLast = ui.hint === null && game.hintsUsed > 0 && ui.hintShown !== game.hintsUsed;
    if (!showLast) {
      if (game.hintsUsed >= ladder.length) { toast('لا تلميحات أكثر — الباقي حجب صفوف وأعمدة.'); render(); return; }
      game.useHint(ladder.length);
    }
    const rung = ladder[game.hintsUsed - 1];
    ui.hintShown = game.hintsUsed;
    ui.hint = { step: rung.step, text: describeRung(scene, rung, overlay).replace(/^[٠-٩]+\. /, '') };
    ui.linked = new Set([rung.cell]);
    render();
  }

  function submit() {
    const res = game.submit(scene.solution, solved.killer);
    toast(res.correct ? 'صحيح!' : 'فيه خطأ في مكان ما.', res.correct ? 'good' : 'bad');
    render();
  }

  let toastTimer = null;
  function toast(text, kind = '', ms = 2500) {
    ui.toast = { text, kind };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast = null; render(); }, ms);
  }

  // ---- لوحة المفاتيح ----
  const onKey = (e) => {
    if (e.key === 'Escape') { game.deselect(); ui.linked.clear(); ui.linkedChars.clear(); render(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) game.redo(); else game.undo(); render(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); game.redo(); render(); }
  };
  window.removeEventListener('keydown', window.__mushtabahKey);
  window.__mushtabahKey = onKey;
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => render(), { passive: true });

  render();
}
