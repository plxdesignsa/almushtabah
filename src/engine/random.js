// random.js — مولّد أرقام عشوائية مُبذَّر (mulberry32) حتى تكون كل قضية قابلة لإعادة الإنتاج.
//
// نفس البذرة ⇒ نفس التخطيط ونفس الحل ونفس الأدلة، على أي جهاز.

export function createRng(seed = Date.now()) {
  let a = (Number(seed) >>> 0) || 0x9e3779b9;

  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng = {
    seed,
    /** عدد في [0, 1) */
    next,
    /** عدد صحيح في [0, n) */
    int: (n) => Math.floor(next() * n),
    /** عدد صحيح في [lo, hi] */
    between: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /** خلط في المكان (Fisher–Yates) ويعيد المصفوفة نفسها. */
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    /** n عناصر مختلفة من المصفوفة. */
    sample: (arr, n) => rng.shuffle([...arr]).slice(0, n),
    /** بذرة فرعية مستقلة (لتقسيم العشوائية بين مراحل المولّد). */
    fork: () => createRng(Math.floor(next() * 4294967296)),
  };
  return rng;
}
