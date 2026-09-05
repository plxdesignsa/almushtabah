// scene.js — تحميل ملف القضية (القسم 05) والتحقق منه وتطبيعه إلى «مشهد» جاهز للمستنتج.
//
// المشهد يحلّ كل المراجع مبكرًا: الغرف والأشياء والشخصيات يمكن الإشارة إليها في JSON
// بالمفتاح النصي ("store") أو بالرقم، وبعد التطبيع تصير كلها أرقامًا داخلية.

import { CLUE_TYPES, GLOBAL_RULE_TYPES } from './clues.js';
import { cellIndex, colOf, isBeside, orthogonalNeighbours, rowOf } from './geometry.js';

export class CaseFormatError extends Error {
  constructor(message) {
    super(`ملف القضية غير صالح: ${message}`);
    this.name = 'CaseFormatError';
  }
}

const assert = (cond, msg) => {
  if (!cond) throw new CaseFormatError(msg);
};

export class Scene {
  /** @param {object} raw  محتوى ملف القضية كما هو في JSON */
  constructor(raw) {
    assert(raw && typeof raw === 'object', 'المحتوى ليس كائن JSON');
    assert(Number.isInteger(raw.size) && raw.size >= 3 && raw.size <= 16, 'size يجب أن يكون عددًا بين 3 و16');

    this.id = raw.id ?? 'untitled';
    this.size = raw.size;
    this.cellCount = raw.size * raw.size;
    this.difficulty = raw.difficulty ?? null;

    this.#loadRooms(raw);
    this.#loadObjects(raw);
    this.#loadCharacters(raw);
    this.#loadBlocked(raw);
    this.#loadSolution(raw);
    this.#loadGlobalRules(raw);
    this.#loadClues(raw);
  }

  // ---------- تحميل ----------

  #loadRooms(raw) {
    assert(Array.isArray(raw.rooms) && raw.rooms.length > 0, 'rooms مطلوبة');
    assert(Array.isArray(raw.roomMap) && raw.roomMap.length === this.cellCount,
      `roomMap يجب أن تحتوي ${this.cellCount} عنصرًا`);

    this.rooms = raw.rooms.map((r, i) => {
      assert(r.id === i, `rooms[${i}].id يجب أن يساوي ${i}`);
      assert(typeof r.key === 'string' && r.key, `rooms[${i}].key مطلوب`);
      return { id: i, key: r.key, restricted: Boolean(r.restricted) };
    });
    this.roomByKey = new Map(this.rooms.map((r) => [r.key, r]));
    assert(this.roomByKey.size === this.rooms.length, 'مفاتيح الغرف مكررة');

    this.roomOfCell = Int16Array.from(raw.roomMap, (id, i) => {
      assert(Number.isInteger(id) && id >= 0 && id < this.rooms.length, `roomMap[${i}] يشير لغرفة غير موجودة`);
      return id;
    });
    this.cellsOfRoom = this.rooms.map(() => []);
    this.roomOfCell.forEach((id, cell) => this.cellsOfRoom[id].push(cell));
    this.rooms.forEach((r) => assert(this.cellsOfRoom[r.id].length > 0, `الغرفة "${r.key}" بلا خلايا`));
  }

  #loadObjects(raw) {
    this.objects = (raw.objects ?? []).map((o, i) => {
      const cell = this.#resolveCell(o.cell, `objects[${i}].cell`);
      assert(typeof o.key === 'string' && o.key, `objects[${i}].key مطلوب`);
      return { ...o, cell };
    });
    // مفتاح الشيء → كل خلاياه. يسمح بأكثر من «طاولة» في المشهد: «كان بجانب طاولة».
    this.cellsByObjectKey = new Map();
    for (const o of this.objects) {
      if (!this.cellsByObjectKey.has(o.key)) this.cellsByObjectKey.set(o.key, new Set());
      this.cellsByObjectKey.get(o.key).add(o.cell);
    }
    // ذاكرة مؤقتة لخلايا «بجانب الشيء». حقل عادي (لا خاص) حتى تبقى نسخ المشهد الخفيفة صالحة.
    this.besideCache = new Map();
  }

  #loadCharacters(raw) {
    assert(Array.isArray(raw.characters) && raw.characters.length === this.size,
      `عدد الشخصيات يجب أن يساوي size (${this.size})`);
    this.characters = raw.characters.map((c, i) => {
      assert(c.id === i, `characters[${i}].id يجب أن يساوي ${i}`);
      assert(typeof c.key === 'string' && c.key, `characters[${i}].key مطلوب`);
      return { ...c, id: i, class: c.class ?? null, victim: Boolean(c.victim) };
    });
    this.charByKey = new Map(this.characters.map((c) => [c.key, c]));
    assert(this.charByKey.size === this.characters.length, 'مفاتيح الشخصيات مكررة');
    const victims = this.characters.filter((c) => c.victim);
    assert(victims.length <= 1, 'لا يجوز أكثر من ضحية واحدة');
    this.victim = victims[0] ?? null;
  }

  #loadBlocked(raw) {
    this.blockedCells = new Set((raw.blockedCells ?? []).map((b, i) => this.#resolveCell(b, `blockedCells[${i}]`)));
  }

  #loadSolution(raw) {
    this.solution = null;
    if (!raw.solution) return;
    assert(Array.isArray(raw.solution) && raw.solution.length === this.size, 'solution يجب أن تحتوي خلية لكل شخصية');
    const cells = raw.solution.map((s, i) => this.#resolveCell(s, `solution[${i}]`));
    const rows = new Set(cells.map((c) => rowOf(c, this.size)));
    const cols = new Set(cells.map((c) => colOf(c, this.size)));
    assert(rows.size === this.size && cols.size === this.size, 'solution يخالف قاعدة «واحد لكل صف وعمود»');
    cells.forEach((c) => assert(!this.blockedCells.has(c), 'solution يضع شخصية في خلية محجوبة'));
    this.solution = cells;
  }

  #loadGlobalRules(raw) {
    this.globalRules = (raw.globalRules ?? []).map((g, i) => {
      const where = `globalRules[${i}]`;
      assert(GLOBAL_RULE_TYPES[g.type], `${where}: نوع غير معروف "${g.type}"`);
      const rule = { ...g, index: i };
      switch (g.type) {
        case 'classRestriction': {
          assert(typeof g.class === 'string', `${where}.class مطلوب`);
          const forbidden = new Set();
          if (g.forbidRestricted) this.rooms.filter((r) => r.restricted).forEach((r) => forbidden.add(r.id));
          for (const key of g.rooms ?? []) forbidden.add(this.#resolveRoom(key, `${where}.rooms`));
          assert(forbidden.size > 0, `${where}: لا غرف ممنوعة (استخدم forbidRestricted أو rooms)`);
          rule.forbiddenRooms = forbidden;
          break;
        }
        case 'noEmptyRegion': {
          const scope = g.scope ?? 'restricted';
          const rooms = new Set();
          if (scope === 'restricted') this.rooms.filter((r) => r.restricted).forEach((r) => rooms.add(r.id));
          else if (scope === 'all') this.rooms.forEach((r) => rooms.add(r.id));
          else if (Array.isArray(scope)) scope.forEach((k) => rooms.add(this.#resolveRoom(k, `${where}.scope`)));
          else throw new CaseFormatError(`${where}.scope غير مفهوم`);
          rule.rooms = rooms;
          break;
        }
        case 'regionQuota':
          rule.room = this.#resolveRoom(g.room, `${where}.room`);
          assert(Number.isInteger(g.count) && g.count >= 0, `${where}.count مطلوب`);
          break;
        case 'pairwiseClass':
          assert(typeof g.class === 'string', `${where}.class مطلوب`);
          break;
      }
      return rule;
    });
  }

  #loadClues(raw) {
    assert(Array.isArray(raw.clues), 'clues مطلوبة');
    this.clues = raw.clues.map((c, i) => this.#normalizeClue(c, i));

    // بطاقة الضحية تُقرأ دائمًا «وحده مع القاتل». إن لم يكتبها المؤلف صراحةً، يضيفها المحرّك.
    if (this.victim && !this.clues.some((c) => c.type === 'aloneWithKiller' && c.char === this.victim.id)) {
      this.clues.push({
        type: 'aloneWithKiller',
        char: this.victim.id,
        index: this.clues.length,
        implicit: true,
      });
    }
  }

  #normalizeClue(c, i) {
    const where = `clues[${i}]`;
    const def = CLUE_TYPES[c.type];
    assert(def, `${where}: نوع غير معروف "${c.type}"`);
    const clue = { ...c, index: i, char: this.#resolveChar(c.char, `${where}.char`) };
    for (const arg of def.args) assert(c[arg] !== undefined, `${where}.${arg} مطلوب لنوع ${c.type}`);
    if ('room' in c) clue.room = this.#resolveRoom(c.room, `${where}.room`);
    if ('object' in c) {
      assert(this.cellsByObjectKey.has(c.object), `${where}.object: لا يوجد شيء بمفتاح "${c.object}"`);
    }
    if ('other' in c) {
      clue.other = this.#resolveChar(c.other, `${where}.other`);
      assert(clue.other !== clue.char, `${where}: الشخصية تشير إلى نفسها`);
    }
    if ('n' in c) assert(Number.isInteger(c.n), `${where}.n يجب أن يكون عددًا صحيحًا`);
    if ('count' in c) assert(Number.isInteger(c.count) && c.count >= 1, `${where}.count غير صالح`);
    return clue;
  }

  // ---------- حلّ المراجع ----------

  #resolveCell(v, where) {
    if (Array.isArray(v) && v.length === 2) {
      const [r, c] = v;
      assert(Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < this.size && c < this.size,
        `${where}: [صف, عمود] خارج الشبكة`);
      return cellIndex(r, c, this.size);
    }
    assert(Number.isInteger(v) && v >= 0 && v < this.cellCount, `${where}: خلية خارج الشبكة`);
    return v;
  }

  #resolveRoom(v, where) {
    if (typeof v === 'string') {
      assert(this.roomByKey.has(v), `${where}: لا توجد غرفة بمفتاح "${v}"`);
      return this.roomByKey.get(v).id;
    }
    assert(Number.isInteger(v) && v >= 0 && v < this.rooms.length, `${where}: غرفة غير موجودة`);
    return v;
  }

  #resolveChar(v, where) {
    if (typeof v === 'string') {
      assert(this.charByKey.has(v), `${where}: لا توجد شخصية بمفتاح "${v}"`);
      return this.charByKey.get(v).id;
    }
    assert(Number.isInteger(v) && v >= 0 && v < this.characters.length, `${where}: شخصية غير موجودة`);
    return v;
  }

  // ---------- استعلامات هندسية ----------

  rowOf(cell) {
    return rowOf(cell, this.size);
  }

  colOf(cell) {
    return colOf(cell, this.size);
  }

  isBeside(a, b) {
    return isBeside(a, b, this.size, this.roomOfCell);
  }

  /** خلايا كل الأشياء التي تحمل هذا المفتاح. */
  objectCells(key) {
    return this.cellsByObjectKey.get(key) ?? new Set();
  }

  /** الخلايا المجاورة (في الغرفة نفسها) لأي شيء بهذا المفتاح. الوقوف فوق الشيء ليس «بجانبه». */
  besideObjectCells(key) {
    if (this.besideCache.has(key)) return this.besideCache.get(key);
    const out = new Set();
    for (const cell of this.objectCells(key)) {
      for (const nb of orthogonalNeighbours(cell, this.size)) {
        if (this.roomOfCell[nb] === this.roomOfCell[cell]) out.add(nb);
      }
    }
    this.besideCache.set(key, out);
    return out;
  }

  char(id) {
    return this.characters[id];
  }

  room(id) {
    return this.rooms[id];
  }
}

/** يحمّل نص JSON إلى مشهد. */
export function sceneFromJSON(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new CaseFormatError(`JSON غير صالح — ${e.message}`);
  }
  return new Scene(raw);
}
