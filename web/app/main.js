// main.js — تطبيق اللعب: قائمة القضايا (ملفات التحقيق)، اللوحة بعرضين، البطاقات، الأدوات.
//
// المحرّك نفسه يعمل في المتصفح بلا أي تعديل: نحمّل ملف القضية، نبني المشهد،
// نحلّه مرة واحدة لاستخراج سلّم التلميحات والقاتل، ثم لا نستشير الحل إلا عند التسليم.
// الرسم: عقد الراسم سطر واحد — «أعطني خلية، أرسم». الأرضيات والأثاث والشخصيات من web/art/.

import { CLUE_TYPES } from '../../src/engine/clues.js';
import { arNum, describeGlobalRule, describeRung } from '../../src/engine/describe.js';
import { Scene } from '../../src/engine/scene.js';
import { hintLadder, solve, withClues } from '../../src/engine/solver.js';
import { avatarSVG } from '../art/avatar.js';
import { floorBackground, floorOf } from '../art/floors.js';
import { hasProp, propSymbolSheet } from '../art/props.js';
import { Game } from './game.js';
import { partialViolations } from './partial.js';

const app = document.getElementById('app');
document.body.insertAdjacentHTML('afterbegin', propSymbolSheet());

// عامل الخدمة (عمل بلا إنترنت) في النشر فقط؛ أثناء التطوير نريد أحدث الملفات دائمًا.
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  navigator.serviceWorker.register('/sw.js').catch(() => { /* اختياري */ });
}

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
};
const svgEl = (markup) => { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; };
const TIER_AR = { easy: 'سهل', medium: 'متوسط', hard: 'صعب', expert: 'خبير' };
const THEME_AR = { house: 'بيت', farm: 'مزرعة', market: 'سوق' };
const GRADES = [['day', 'نهار'], ['dusk', 'غروب'], ['night', 'ليل']];
const pref = {
  get: (k, d) => { try { return localStorage.getItem(`mushtabah:${k}`) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(`mushtabah:${k}`, v); } catch { /* تجاهل */ } },
};
const caseNumber = (id) => arNum(String(Number(id.replace(/\D/g, '')) || 0).padStart(3, '0'));

const LOGO = `<svg viewBox='0 0 64 64' class='logo' aria-hidden='true'><rect width='64' height='64' rx='12' fill='var(--ink)'/><path d='M14 14h36v36H14z M14 26h36 M14 38h36 M26 14v36 M38 14v36' fill='none' stroke='var(--paper)' stroke-width='2.5'/><circle cx='38' cy='26' r='11' fill='var(--ink)' stroke='var(--wax)' stroke-width='4'/><path d='M46 34l9 9' stroke='var(--wax)' stroke-width='5' stroke-linecap='round'/></svg>`;

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
  const solvedCount = catalog.filter((c) => { try { return JSON.parse(localStorage.getItem(`mushtabah:${c.id}`))?.finished?.correct; } catch { return false; } }).length;
  const groups = ['easy', 'medium', 'hard', 'expert'].map((tier) => ({ tier, items: catalog.filter((c) => c.difficulty === tier) }));
  app.replaceChildren(
    h('header', { class: 'hero' },
      h('div', { class: 'hero-inner' },
        svgEl(LOGO),
        h('div', {},
          h('h1', {}, 'المشتبه'),
          h('p', { class: 'lead' }, 'خريطة مسرح الجريمة أمامك، وبطاقات الشهود في يدك. ضعهم في أماكنهم من كلامهم — ومن ينتهي في غرفة الضحية هو القاتل.'),
          h('p', { class: 'stat' }, `${arNum(catalog.length)} قضية · حُلّت ${arNum(solvedCount)}`),
        ),
      ),
    ),
    h('main', { class: 'list' },
      groups.map((g) => g.items.length && h('section', {},
        h('h2', {}, h('span', { class: `chip ${g.tier}` }, TIER_AR[g.tier]), h('span', { class: 'muted small' }, ` ${arNum(g.items.length)} قضايا`)),
        h('div', { class: 'cases' }, g.items.map((c) => {
          let saved = null;
          try { saved = JSON.parse(localStorage.getItem(`mushtabah:${c.id}`)); } catch { /* تجاهل */ }
          const done = saved?.finished?.correct;
          return h('a', { class: `dossier ${done ? 'done' : ''}`, href: `#/case/${c.id}` },
            h('div', { class: 'dossier-tab' }, `ملف ${caseNumber(c.id)}`),
            h('div', { class: 'dossier-title' }, c.title_ar ?? c.id),
            h('div', { class: 'dossier-meta' }, `${THEME_AR[c.theme] ?? ''} · ${arNum(c.size)}×${arNum(c.size)} · ${arNum(c.suspects)} مشتبه · ${arNum(c.rooms)} غرف`, c.mode === 'lyingWitness' ? h('span', { class: 'chip lying' }, '🤥 شاهد كاذب') : null),
            done ? h('div', { class: 'stamp small-stamp' }, 'أُغلقت') : saved ? h('div', { class: 'badge soft' }, 'قيد التحقيق') : null,
          );
        })),
      )),
    ),
    h('footer', { class: 'foot' }, 'المشتبه — كل لغز يُحل بالاستنتاج وحده. لا تخمين.'),
  );
}

// ---------- القضية ----------
async function openCase(id) {
  const [raw, overlay] = await Promise.all([fetchJSON(`/cases/${id}.json`), fetchJSON(`/cases/i18n/ar/${id}.json`).catch(() => ({}))]);
  const scene = new Scene(raw);
  const solved = solve(scene); // في نمط الشاهد الكاذب يُحلّ على البطاقات الصادقة
  const lying = scene.mode === 'lyingWitness';
  // في نمط الكذب تُسبَق الدرجات بتلميح افتتاحي يشرح المبدأ بلا كشف الكاذب.
  const ladder = [...(lying ? [{ step: 0, intro: true }] : []), ...hintLadder(solved.trace)];
  const game = new Game(scene, `mushtabah:${id}`);
  const N = {
    char: (i) => overlay.chars?.[scene.char(i).key] ?? scene.char(i).key,
    room: (i) => overlay.rooms?.[scene.room(i).key] ?? scene.room(i).key,
    object: (k) => overlay.objects?.[k] ?? k,
    cls: (c) => overlay.classes?.[c] ?? c,
  };
  document.title = `${overlay.title ?? id} — المشتبه`;

  const ui = {
    focusRoom: null, linked: new Set(), linkedChars: new Set(), toast: null, shake: new Set(), hint: null, hintShown: 0,
    view: pref.get('view', 'scene'), grade: pref.get('grade', 'day'),
    tutorial: pref.get('tutorialDone', null) ? null : 0,
  };
  // صنفا الشخصيات: الممنوع من الغرف المقيّدة (الضيوف/الزبائن/الزوّار) والمسموح (أهل البيت/العاملون/العمّال).
  const forbiddenClass = scene.globalRules.find((g) => g.type === 'classRestriction')?.class ?? null;
  const classKind = (c) => (c === forbiddenClass ? 'forbidden' : 'allowed');
  const ringColor = (c) => (classKind(c) === 'forbidden' ? '#8a5a00' : '#1f4fb8');
  const avatarCache = new Map();
  const avatar = (ch, size) => {
    const key = `${ch.id}:${size}`;
    if (!avatarCache.has(key)) avatarCache.set(key, avatarSVG(ch, { size, ring: ch.victim ? '#2a251f' : ringColor(ch.class) }));
    return svgEl(avatarCache.get(key));
  };

  const cellSize = () => {
    const avail = Math.min(window.innerWidth, 1180) - (window.innerWidth >= 900 ? 320 + 16 + 40 + 6 : 24);
    return Math.max(30, Math.min(60, Math.floor((avail - 26) / scene.size)));
  };

  function render() {
    const viol = partialViolations(scene, game.placed, game.doubted);
    app.style.setProperty('--cell', `${cellSize()}px`);
    app.replaceChildren(...[
      renderDossierBar(),
      renderTop(),
      lying ? h('div', { class: 'banner lying' }, h('strong', {}, 'شاهد كاذب: '), 'بطاقة واحدة كاذبة، وهي بطاقة القاتل. الباقون صادقون. إذا صدّقت الجميع وصلت إلى تناقض؛ اضغط «كذّب» على بطاقة لتستثنيها من الفحص.') : null,
      h('div', { class: 'stage' }, renderCards(viol), h('div', { class: 'board-col' }, renderOrient(), renderBoard(viol))),
      renderRules(viol),
      renderFooter(),
      ui.hint ? h('div', { class: 'sheet' },
        h('div', { class: 'sheet-head' }, h('strong', {}, `تلميح ${arNum(ui.hint.step)} من ${arNum(ladder.length)}`), h('button', { class: 'btn', onclick: () => { ui.hint = null; ui.linked.clear(); render(); } }, 'إغلاق')),
        h('div', { class: 'sheet-body' }, ui.hint.text),
      ) : null,
      ui.toast ? h('div', { class: `toast ${ui.toast.kind ?? ''}` }, ui.toast.text) : null,
      renderTutorial(),
    ].filter(Boolean));
    ui.shake = new Set();
  }

  /** السطر الأول: هوية الملف (الملفات › · رقم الملف · العنوان · ختم الدرجة · العدّ). */
  function renderDossierBar() {
    const closed = game.finished?.correct;
    return h('header', { class: 'dossier-bar' },
      h('a', { class: 'btn ghost', href: '#/' }, 'الملفات ›'),
      h('span', { class: 'file-no' }, `ملف ${caseNumber(id)} · ${THEME_AR[raw.meta?.theme] ?? ''} · ${arNum(scene.size)}×${arNum(scene.size)}`),
      h('h1', { class: 'file-title' }, overlay.title ?? id),
      h('span', { class: `stamp tier-${scene.difficulty}` }, closed ? 'أُغلقت القضية' : TIER_AR[scene.difficulty] ?? ''),
      h('div', { class: 'spacer' }),
      h('span', { class: 'count' }, `${arNum(scene.characters.length)} مشتبهًا · ${arNum(scene.rooms.length)} غرف`),
    );
  }

  /** السطر الثاني، ثابت: الأدوات في عناقيد بفواصل — (مشهد/مخطط) · (الإضاءة) · (تراجع/إعادة) · (تلميح/مسح) · (تسليم). */
  function renderTop() {
    const placedCount = game.placed.filter((c) => c >= 0).length;
    const closed = game.finished?.correct;
    const sep = () => h('div', { class: 'sep' });
    return h('div', { class: `topbar light-${ui.grade}`, role: 'toolbar' },
      h('div', { class: 'seg', role: 'group', 'aria-label': 'العرض' },
        h('button', { class: `btn ${ui.view === 'scene' ? 'on' : ''}`, onclick: () => setView('scene'), title: 'عرض المشهد' }, 'مشهد'),
        h('button', { class: `btn ${ui.view === 'plan' ? 'on' : ''}`, onclick: () => setView('plan'), title: 'عرض المخطط (للاستنتاج والطباعة)' }, 'مخطط'),
      ),
      sep(),
      h('button', { class: 'btn', onclick: cycleGrade, title: 'الإضاءة', disabled: ui.view !== 'scene' }, h('span', { class: 'light-dot' }), GRADES.find(([k]) => k === ui.grade)?.[1] ?? 'نهار'),
      sep(),
      h('button', { class: 'btn', onclick: () => { game.undo(); render(); }, disabled: !game.history.length, title: 'تراجع (Ctrl+Z)' }, 'تراجع'),
      h('button', { class: 'btn', onclick: () => { game.redo(); render(); }, disabled: !game.future.length, title: 'إعادة (Ctrl+Y)' }, 'إعادة'),
      sep(),
      h('button', { class: 'btn hintbtn', onclick: showHint, title: 'تلميح' }, 'تلميح', h('span', { class: 'counter' }, `${arNum(game.hintsUsed)}/${arNum(ladder.length)}`)),
      h('button', { class: 'btn ghost', onclick: () => { if (confirm('تمسح كل علامات ✗ والقلم؟ (المثبَّت يبقى)')) { game.clearMarks(); render(); } }, title: 'مسح العلامات' }, 'مسح العلامات'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', disabled: !game.allPlaced || closed, onclick: submit }, closed ? 'حُلّت ✓' : 'تسليم', closed ? null : h('span', { class: 'counter' }, `${arNum(placedCount)}/${arNum(scene.size)}`)),
    );
  }

  /** شريط الاتجاه فوق الخريطة: كل الأدلة تتكلم بالجهات. */
  function renderOrient() {
    return h('div', { class: 'orient' },
      h('span', { class: 'north' }, h('span', { class: 'arrow' }, '↑'), 'الشمال'),
      h('span', { class: 'note' }, 'العمود ١ أقصى اليمين · الصف ١ أعلى · الشرق يمين الشاشة'),
    );
  }

  function renderCards(viol) {
    const cards = [];
    if (scene.victim) {
      // الضحية تُوضع على الخريطة أيضًا (بطاقتها ثابتة: «وُجد وحده مع القاتل»).
      const v = scene.victim;
      const placed = game.placed[v.id] >= 0;
      cards.push(h('div', {
        class: `card victim ${game.selected === v.id ? 'active' : ''} ${placed ? 'placed' : ''} ${ui.linkedChars.has(v.id) ? 'linked' : ''}`,
        dataset: { char: v.id },
        onclick: () => { game.select(v.id); linkClues(); render(); },
      },
        h('div', { class: 'avatar' }, avatar(v, 46)),
        h('div', { class: 'card-body' }, h('div', { class: 'name' }, N.char(v.id), h('span', { class: 'tag victim' }, 'الضحية'), placed ? h('span', { class: 'pin', title: 'موضوعة على الخريطة' }, 'مثبّتة') : null), h('div', { class: 'text' }, overlay.victimCard ?? 'وُجد وحده مع القاتل.')),
      ));
    }
    for (const ch of scene.characters) {
      if (ch.victim) continue;
      const myClues = scene.clues.filter((c) => c.char === ch.id && !c.implicit);
      const fallback = myClues.map((c) => overlay.clues?.[String(c.index)] ?? overlay.machineClues?.[String(c.index)] ?? c.type).join('، و');
      const text = overlay.cards?.[ch.key] ?? (fallback || 'ما عندي شي أقوله.');
      const alert = myClues.some((c) => viol.clues.has(c.index));
      const struck = myClues.length && myClues.every((c) => game.struck.has(c.index));
      const doubted = game.doubted.has(ch.id);
      const placed = game.placed[ch.id] >= 0;
      cards.push(h('div', {
        class: `card ${game.selected === ch.id ? 'active' : ''} ${alert ? 'alert' : ''} ${struck ? 'struck' : ''} ${doubted ? 'doubted' : ''} ${placed ? 'placed' : ''} ${ui.linkedChars.has(ch.id) ? 'linked' : ''}`,
        dataset: { char: ch.id },
        onclick: () => { game.select(ch.id); linkClues(); render(); },
      },
        h('div', { class: 'avatar' }, avatar(ch, 46)),
        h('div', { class: 'card-body' },
          h('div', { class: 'name' }, N.char(ch.id), h('span', { class: `tag ${classKind(ch.class)}` }, N.cls(ch.class)), placed ? h('span', { class: 'pin', title: 'موضوعة على الخريطة' }, 'مثبّتة') : null, doubted ? h('span', { class: 'tag doubt' }, 'مكذَّب') : null),
          h('div', { class: 'text' }, text),
        ),
        h('div', { class: 'card-actions' },
          myClues.length ? h('button', { class: 'strike', title: 'شطب البطاقة (استعملتها)', onclick: (e) => { e.stopPropagation(); myClues.forEach((c) => game.toggleStrike(c.index)); render(); } }, struck ? '↺' : '✓') : null,
          lying && myClues.length ? h('button', { class: `strike doubt ${doubted ? 'on' : ''}`, title: 'تكذيب هذا الشاهد (لا تدخل بطاقته في فحص التناقض)', onclick: (e) => { e.stopPropagation(); game.toggleDoubt(ch.id); render(); } }, doubted ? 'صدّق' : 'كذّب') : null,
        ),
      ));
    }
    return h('aside', { class: 'cards' }, cards);
  }

  function renderBoard(viol) {
    const n = scene.size;
    const grid = h('div', { class: 'grid', style: `grid-template-columns: var(--hdr) repeat(${n}, var(--cell)); grid-template-rows: var(--hdr) repeat(${n}, var(--cell));` });
    grid.append(h('div', { class: 'hdr corner' }));
    for (let c = 0; c < n; c++) grid.append(h('div', { class: `hdr col ${(c + 1) % 5 === 0 ? 'five' : ''}` }, arNum(c + 1)));
    const labelCell = roomLabelCells();
    const objAt = new Map(scene.objects.map((o) => [o.cell, o]));
    for (let r = 0; r < n; r++) {
      grid.append(h('div', { class: `hdr row ${(r + 1) % 5 === 0 ? 'five' : ''}` }, arNum(r + 1)));
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
        if (occupant >= 0) cls.push('occupied');
        const style = ui.view === 'scene' && !scene.blockedCells.has(cell) ? `background-image:${floorBackground(floorOf(roomObj), (r * 7 + c * 13 + room) % 3)}` : '';
        const el = h('div', { class: cls.join(' '), style, dataset: { cell }, onclick: () => onCell(cell), role: 'button', tabindex: -1,
          'aria-label': `صف ${r + 1} عمود ${c + 1}، ${N.room(room)}${occupant >= 0 ? '، ' + N.char(occupant) : ''}` });
        const obj = objAt.get(cell);
        if (obj) {
          el.append(hasProp(obj.key)
            ? svgEl(`<svg class='prop' viewBox='0 0 40 40' aria-label='${N.object(obj.key)}'><title>${N.object(obj.key)}</title><use href='#prop-${obj.key}'/></svg>`)
            : h('span', { class: 'prop-text' }, N.object(obj.key)));
        }
        if (labelCell.get(room) === cell) el.append(h('span', { class: 'room-label', onclick: (e) => { e.stopPropagation(); ui.focusRoom = ui.focusRoom === room ? null : room; render(); } }, N.room(room)));
        if (occupant >= 0) {
          const ch = scene.char(occupant);
          el.append(h('span', { class: `token ${game.selected === occupant ? 'sel' : ''} ${ch.victim ? 'victim' : ''}`, title: N.char(occupant) }, avatar(ch, 40), h('span', { class: 'token-name' }, N.char(occupant))));
        } else if (pencil !== undefined) el.append(h('span', { class: 'pencil' }, N.char(pencil).slice(0, 2)));
        else if (game.marks.has(cell)) el.append(h('span', { class: 'mark' }, '✗'));
        grid.append(el);
      }
    }
    // الخريطة عربية: العمود ١ أقصى اليمين (اتجاه القراءة)، والصف ١ أعلى. الشرق يمين الشاشة.
    return h('div', { class: `board-wrap view-${ui.view} grade-${ui.grade}`, dir: 'rtl' }, grid);
  }

  function roomLabelCells() {
    const map = new Map();
    const objCells = new Set(scene.objects.map((o) => o.cell));
    for (const room of scene.rooms) {
      const cells = scene.cellsOfRoom[room.id];
      const cr = cells.reduce((s, c) => s + scene.rowOf(c), 0) / cells.length;
      const cc = cells.reduce((s, c) => s + scene.colOf(c), 0) / cells.length;
      const edge = (c) => (scene.colOf(c) === 0 || scene.colOf(c) === scene.size - 1 ? 1 : 0);
      // خلية داخلية أفقيًا (جاراها من الغرفة نفسها) حتى لا تتداخل التسمية مع تسمية غرفة مجاورة.
      const sameRoom = (c, d) => c >= 0 && c < scene.cellCount && scene.roomOfCell[c] === room.id && scene.colOf(c) === scene.colOf(d) + Math.sign(c - d);
      const interior = (c) => (sameRoom(c - 1, c) ? 0 : 1) + (sameRoom(c + 1, c) ? 0 : 1);
      const dist = (c) => Math.hypot(scene.rowOf(c) - cr, scene.colOf(c) - cc);
      map.set(room.id, [...cells].sort((a, b) => (objCells.has(a) - objCells.has(b)) || (interior(a) - interior(b)) || (edge(a) - edge(b)) || (dist(a) - dist(b)))[0]);
    }
    return map;
  }

  function renderRules(viol) {
    return h('section', { class: 'rules' },
      h('div', { class: 'rules-row' },
        h('div', { class: 'rules-box' },
          h('h3', {}, 'القواعد العامة'),
          h('ul', {},
            h('li', {}, 'كل صف وكل عمود فيه شخص واحد فقط.'),
            scene.globalRules.map((g) => h('li', { class: viol.rules.has(g.index) ? 'alert' : '' }, describeGlobalRule(scene, g, overlay))),
          ),
          h('div', { class: 'rules-hint' }, '«بجانب» تعني يمين أو يسار أو فوق أو تحت مباشرة وفي الغرفة نفسها. الغرف المظلّلة مقيّدة. اضغط اسم غرفة لتركّز عليها، واضغط بطاقة لتحديد صاحبها وإظهار ما تشير إليه.'),
        ),
        h('button', { class: 'btn howto', onclick: () => { ui.tutorial = 0; render(); } }, 'كيف ألعب؟'),
      ),
    );
  }

  const TUTORIAL = [
    ['🔍', 'مرحبًا أيها المحقق', 'وقعت جريمة قتل. أحد هؤلاء الشهود هو القاتل. بطاقاتهم تخبرك أين كان كل واحد منهم، والخريطة أمامك هي مسرح الجريمة.'],
    ['🕯️', 'كيف تُحل القضية', 'الضحية وُجدت وحدها مع القاتل. حدّد مكان كل شخصية بالضبط على الخريطة. من ينتهي في غرفة الضحية هو القاتل — لا يُسأل عنه أبدًا، الخريطة تكشفه.'],
    ['✗', 'واحد لكل صف وعمود', 'كل صف وكل عمود فيه شخص واحد فقط. حين تثبّت شخصية، تمتلئ علامات ✗ في صفها وعمودها تلقائيًا. آخر شخصية غالبًا لن يبقى لها إلا خلية واحدة.'],
    ['🧭', 'ماذا تعني «بجانب»', 'يمين أو يسار أو فوق أو تحت مباشرة، وفي الغرفة نفسها. الجدار السميك يقطع الجوار. الشمال أعلى الخريطة، والشرق يمينها، والعمود ١ أقصى اليمين.'],
    ['👆', 'ضع الشخصيات', 'اضغط بطاقة لتحديد صاحبها. ثم اضغط خلية مرة تضع قلمًا (تخمين)، ومرة ثانية تثبّت. بلا تحديد، الضغط على خلية يضع ✗. البطاقة تحمرّ إن خالفتها.'],
    ['🏆', 'احلل القضية', 'بعد وضع الجميع اضغط «تسليم». إن علقت، التلميحات تشرح الاستنتاج خطوة خطوة. لا تخمين في المشتبه: كل قضية تُحل بالمنطق وحده.'],
  ];

  function renderTutorial() {
    if (ui.tutorial === null) return null;
    const i = ui.tutorial;
    const [icon, title, text] = TUTORIAL[i];
    const close = () => { ui.tutorial = null; pref.set('tutorialDone', '1'); render(); };
    return h('div', { class: 'modal-back', onclick: (e) => { if (e.target === e.currentTarget) close(); } },
      h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
        h('div', { class: 'modal-head' }, h('span', { class: 'muted small' }, `${arNum(i + 1)} / ${arNum(TUTORIAL.length)}`), h('button', { class: 'btn ghost', onclick: close }, '✕')),
        h('div', { class: 'modal-icon' }, icon),
        h('h3', {}, title),
        h('p', {}, text),
        h('div', { class: 'modal-actions' },
          i > 0 ? h('button', { class: 'btn', onclick: () => { ui.tutorial = i - 1; render(); } }, 'رجوع') : h('button', { class: 'btn ghost', onclick: close }, 'تخطٍّ'),
          i < TUTORIAL.length - 1
            ? h('button', { class: 'btn primary', onclick: () => { ui.tutorial = i + 1; render(); } }, 'التالي')
            : h('button', { class: 'btn primary', onclick: close }, 'هيا نحقق!'),
        ),
      ),
    );
  }

  function renderFooter() {
    if (!game.finished) return null;
    const f = game.finished;
    return h('section', { class: `result ${f.correct ? 'good' : 'bad'}` },
      f.correct
        ? h('div', {}, h('h3', {}, 'أُغلقت القضية.'), h('p', {}, (() => {
          const fem = scene.char(f.killer).gender === 'f';
          return `${fem ? 'القاتلة' : 'القاتل'}: ${N.char(f.killer)} — ${fem ? 'كانت' : 'كان'} في ${N.room(scene.roomOfCell[game.placed[f.killer]])} مع ${N.char(scene.victim.id)}${lying ? (fem ? '، وكانت تكذب في بطاقتها' : '، وكان يكذب في بطاقته') : ''}.`;
        })()), h('p', { class: 'muted small' }, `استعملت ${arNum(game.hintsUsed)} ${game.hintsUsed === 1 ? 'تلميحًا واحدًا' : game.hintsUsed === 2 ? 'تلميحين' : game.hintsUsed <= 10 ? 'تلميحات' : 'تلميحًا'}.`), h('button', { class: 'btn', onclick: () => { game.restart(); render(); } }, 'إعادة من البداية'))
        : h('div', {}, h('h3', {}, 'ليس بعد.'), h('p', {}, `${arNum(f.wrong)} ${f.wrong === 1 ? 'شخصية في غير مكانها' : f.wrong === 2 ? 'شخصيتان في غير مكانهما' : 'شخصيات في غير أماكنها'}. راجع البطاقات المحمرّة.`)),
    );
  }

  // ---- أفعال ----
  function setView(v) { ui.view = v; pref.set('view', v); render(); }
  function cycleGrade() {
    const i = GRADES.findIndex(([k]) => k === ui.grade);
    ui.grade = GRADES[(i + 1) % GRADES.length][0];
    pref.set('grade', ui.grade);
    render();
  }

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
    const showLast = ui.hint === null && game.hintsUsed > 0 && ui.hintShown !== game.hintsUsed;
    if (!showLast) {
      if (game.hintsUsed >= ladder.length) { toast('لا تلميحات أكثر — الباقي حجب صفوف وأعمدة.'); render(); return; }
      game.useHint(ladder.length);
    }
    const rung = ladder[game.hintsUsed - 1];
    ui.hintShown = game.hintsUsed;
    if (rung.intro) {
      ui.hint = { step: game.hintsUsed, text: overlay.lyingIntro ?? 'أحد الشهود يكذب، وهو القاتل. صدّق الجميع أولًا وستصل إلى تناقض؛ البطاقة التي إذا استبعدتها زال التناقض هي بطاقة القاتل.' };
      ui.linked = new Set();
    } else {
      const truthScene = scene.liar === null ? scene : withClues(scene, scene.truthfulClues);
      ui.hint = { step: game.hintsUsed, text: describeRung(truthScene, rung, overlay).replace(/^[٠-٩]+\. /, '') };
      ui.linked = new Set([rung.cell]);
    }
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

  const onKey = (e) => {
    if (e.key === 'Escape') { game.deselect(); ui.linked.clear(); ui.linkedChars.clear(); ui.hint = null; ui.tutorial = null; render(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) game.redo(); else game.undo(); render(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); game.redo(); render(); }
    else if (e.key.toLowerCase() === 'v' && !e.ctrlKey) setView(ui.view === 'scene' ? 'plan' : 'scene');
  };
  window.removeEventListener('keydown', window.__mushtabahKey);
  window.__mushtabahKey = onKey;
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => render(), { passive: true });

  render();
}
