// domain.js — مجال الخلايا الممكنة لشخصية واحدة.
//
// المستنتج لا يبحث ولا يخمّن؛ كل ما يفعله هو تضييق هذه المجالات بقواعد
// استنتاج صريحة حتى ينكمش كل مجال إلى خلية واحدة (أو يفرغ فتظهر المتناقضة).
// التمثيل: مجموعة أعداد؛ الاستعلامات لا تنسخ ولا ترتّب إلا عند الطلب الصريح.

export class Domain {
  /** @param {Iterable<number>} cells */
  constructor(cells) {
    this._cells = new Set(cells);
  }

  get size() {
    return this._cells.size;
  }

  has(cell) {
    return this._cells.has(cell);
  }

  /** الخلية الوحيدة إن كان المجال محسومًا، وإلا -1. */
  get fixed() {
    return this._cells.size === 1 ? this._cells.values().next().value : -1;
  }

  get isFixed() {
    return this._cells.size === 1;
  }

  get isEmpty() {
    return this._cells.size === 0;
  }

  /** نسخة كمصفوفة مرتبة (للأثر والعرض). */
  cells() {
    return [...this._cells].sort((a, b) => a - b);
  }

  some(pred) {
    for (const cell of this._cells) if (pred(cell)) return true;
    return false;
  }

  every(pred) {
    for (const cell of this._cells) if (!pred(cell)) return false;
    return true;
  }

  /**
   * يحذف الخلايا التي تحقّق الشرط. يعيد الخلايا المحذوفة فعليًا (مرتبة).
   * @param {(cell:number)=>boolean} shouldRemove
   */
  removeWhere(shouldRemove) {
    const removed = [];
    for (const cell of this._cells) {
      if (shouldRemove(cell)) removed.push(cell);
    }
    for (const cell of removed) this._cells.delete(cell);
    return removed.sort((a, b) => a - b);
  }

  /** يبقي الخلايا التي تحقّق الشرط فقط. يعيد المحذوف. */
  keepWhere(shouldKeep) {
    return this.removeWhere((cell) => !shouldKeep(cell));
  }

  /** الغرف التي ما زال المجال يطلّ عليها. */
  rooms(roomOfCell) {
    const out = new Set();
    for (const cell of this._cells) out.add(roomOfCell[cell]);
    return out;
  }

  /** إن كانت كل خلايا المجال في غرفة واحدة يعيد رقمها، وإلا -1. */
  determinedRoom(roomOfCell) {
    let room = -1;
    for (const cell of this._cells) {
      const r = roomOfCell[cell];
      if (room === -1) room = r;
      else if (room !== r) return -1;
    }
    return room;
  }

  clone() {
    return new Domain(this._cells);
  }

  [Symbol.iterator]() {
    return this._cells.values();
  }
}
