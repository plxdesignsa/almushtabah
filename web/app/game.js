// game.js — حالة اللعب: وضع، تعليم بالقلم، استبعاد، تراجع/إعادة، تلميحات، حفظ تلقائي.
//
// نموذج التفاعل (القسم 08): معنى النقرة يقرّره شيء واحد — هل هناك شخصية محدّدة؟
//   لا شخصية محدّدة → النقرة تبدّل علامة ✗ على الخلية.
//   شخصية محدّدة   → النقرة تدوّر الخلية: قلم ← مثبّت ← فارغ.
// التثبيت يعلّم ✗ على صفه وعموده تلقائيًا (auto-eliminate). الحركة المخالفة لا تُمنع أبدًا.

const MAX_HISTORY = 200;

export class Game {
  /**
   * @param {import('../../src/engine/scene.js').Scene} scene
   * @param {string} saveKey
   */
  constructor(scene, saveKey) {
    this.scene = scene;
    this.saveKey = saveKey;
    this.n = scene.size;
    this.reset();
    this.load();
  }

  reset() {
    this.placed = new Array(this.scene.characters.length).fill(-1); // خلية كل شخصية
    this.pencil = new Map(); // خلية → شخصية
    this.marks = new Set(); // خلايا ✗
    this.struck = new Set(); // بطاقات شطبها اللاعب
    this.doubted = new Set(); // شهود كذّبهم اللاعب (نمط الشاهد الكاذب): بطاقاتهم لا تدخل فحص التناقض
    this.hintsUsed = 0;
    this.selected = null;
    this.history = [];
    this.future = [];
    this.finished = null; // نتيجة التسليم
    this.autoEliminate = true;
  }

  // ---------- حفظ ----------
  snapshot() {
    return {
      placed: [...this.placed],
      pencil: [...this.pencil],
      marks: [...this.marks],
      struck: [...this.struck],
      doubted: [...this.doubted],
      hintsUsed: this.hintsUsed,
      finished: this.finished,
    };
  }

  restore(s) {
    this.placed = [...s.placed];
    this.pencil = new Map(s.pencil);
    this.marks = new Set(s.marks);
    this.struck = new Set(s.struck ?? []);
    this.doubted = new Set(s.doubted ?? []);
    this.hintsUsed = s.hintsUsed ?? 0;
    this.finished = s.finished ?? null;
  }

  save() {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(this.snapshot()));
    } catch { /* التخزين غير متاح — لا بأس */ }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (raw) this.restore(JSON.parse(raw));
    } catch { /* تجاهل */ }
  }

  clearSave() {
    try { localStorage.removeItem(this.saveKey); } catch { /* تجاهل */ }
  }

  // ---------- التاريخ ----------
  #mutate(fn) {
    this.history.push(this.snapshot());
    if (this.history.length > MAX_HISTORY) this.history.shift();
    this.future = [];
    fn();
    this.save();
  }

  undo() {
    if (!this.history.length) return false;
    this.future.push(this.snapshot());
    this.restore(this.history.pop());
    this.save();
    return true;
  }

  redo() {
    if (!this.future.length) return false;
    this.history.push(this.snapshot());
    this.restore(this.future.pop());
    this.save();
    return true;
  }

  // ---------- استعلامات ----------
  charAt(cell) {
    return this.placed.indexOf(cell);
  }

  rowOf(cell) { return Math.floor(cell / this.n); }
  colOf(cell) { return cell % this.n; }

  get allPlaced() {
    return this.placed.every((c) => c >= 0);
  }

  // ---------- أفعال ----------
  select(charId) {
    this.selected = this.selected === charId ? null : charId;
  }

  deselect() {
    this.selected = null;
  }

  /** النقرة على خلية. يعيد وصفًا لما حدث (للتغذية الراجعة). */
  tap(cell) {
    if (this.finished?.correct) return 'locked';
    const occupant = this.charAt(cell);

    if (this.selected === null) {
      if (occupant >= 0) { this.selected = occupant; return 'select'; }
      this.#mutate(() => {
        if (this.marks.has(cell)) this.marks.delete(cell);
        else { this.marks.add(cell); this.pencil.delete(cell); }
      });
      return 'mark';
    }

    const s = this.selected;
    if (occupant === s) { this.#mutate(() => { this.placed[s] = -1; }); return 'unplace'; }
    if (occupant >= 0) return 'occupied';
    if (this.pencil.get(cell) === s) { this.#mutate(() => this.#commit(s, cell)); return 'commit'; }
    this.#mutate(() => { this.marks.delete(cell); this.pencil.set(cell, s); });
    return 'pencil';
  }

  /** تثبيت مباشر (للخبراء ولوحة المفاتيح). */
  commitDirect(charId, cell) {
    if (this.charAt(cell) >= 0 && this.charAt(cell) !== charId) return false;
    this.#mutate(() => this.#commit(charId, cell));
    return true;
  }

  #commit(charId, cell) {
    this.placed[charId] = cell;
    this.pencil.delete(cell);
    this.marks.delete(cell);
    if (!this.autoEliminate) return;
    const r = this.rowOf(cell);
    const c = this.colOf(cell);
    for (let x = 0; x < this.n * this.n; x++) {
      if (x === cell) continue;
      if ((this.rowOf(x) === r || this.colOf(x) === c) && this.charAt(x) < 0) {
        this.marks.add(x);
        if (this.pencil.get(x) === charId) this.pencil.delete(x);
      }
    }
  }

  toggleStrike(clueIndex) {
    this.#mutate(() => {
      if (this.struck.has(clueIndex)) this.struck.delete(clueIndex);
      else this.struck.add(clueIndex);
    });
  }

  toggleDoubt(charId) {
    this.#mutate(() => {
      if (this.doubted.has(charId)) this.doubted.delete(charId);
      else this.doubted.add(charId);
    });
  }

  clearMarks() {
    this.#mutate(() => { this.marks.clear(); this.pencil.clear(); });
  }

  useHint(total) {
    if (this.hintsUsed >= total) return false;
    this.#mutate(() => { this.hintsUsed++; });
    return true;
  }

  /** التسليم: يقارن بالحل. لا يكشف أي موقع خاطئ بعينه. */
  submit(solution, killer) {
    const wrong = this.placed.filter((cell, id) => cell !== solution[id]).length;
    const result = { correct: wrong === 0, wrong, killer: wrong === 0 ? killer : null, at: Date.now() };
    this.#mutate(() => { this.finished = result; });
    return result;
  }

  restart() {
    const key = this.saveKey;
    this.reset();
    this.saveKey = key;
    this.clearSave();
  }
}
