// voice.js — صوت الشهود: تحويل الأدلة الآلية إلى كلام باللهجة بشخصية لكل شاهد.
//
// القاعدة الذهبية (القسم 10، الخطوة 5): المعنى لا يتغير — الصوت فقط.
// كل قالب هنا يقول بالضبط ما يقوله الدليل الآلي، لا أكثر ولا أقل.
// الطبع (persona) يضيف افتتاحية أو خاتمة لا تحمل أي معلومة عن اللغز.
//
// ملاحظة لغوية: ضمير المتكلم في اللهجة («كنت»، «لحالي»، «جنب») محايد الجنس غالبًا،
// أما الحديث عن الآخرين فيُصرَّف (كان/كانت، لاصق/لاصقة).

import { colDirectionWord } from '../engine/geometry.js';

const PERSONAS = {
  calm: { ar: 'هادئ', open: ['', '', 'بكل بساطة: ', 'اللي أعرفه إن '], close: ['', '', '.', '، هذا كل شي.'] },
  chatty: { ar: 'ثرثار', open: ['والله يا محقق، ', 'أقول لك من البداية: ', 'اسمع، ', 'شوف، '], close: ['، صدقني.', '، والله العظيم.', '، اسأل أي أحد.', '.'] },
  grumpy: { ar: 'عصبي', open: ['وش تبغى مني؟ ', 'كم مرة أقول لك؟ ', 'خلاص، ', ''], close: ['. خلاص.', '. انتهينا.', '، وما لي دخل بشي.', '.'] },
  nervous: { ar: 'متوتر', open: ['أ... ', 'والله ما أدري وش أقول، بس ', 'يعني... ', ''], close: ['، أقسم لك.', '، ما أكذب عليك.', '... ما أذكر غير كذا.', '.'] },
  formal: { ar: 'رسمي', open: ['للتوضيح، ', 'إجابةً على سؤالكم، ', 'أفيدكم بأني ', ''], close: ['.', '، وهذا ما لديّ.', '، شكرًا.', '.'] },
};
export const PERSONA_KEYS = Object.keys(PERSONAS);

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const ar = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]);

/** صرف بسيط للحديث عن شخص آخر. */
const other3 = (g) => ({ kan: g === 'f' ? 'كانت' : 'كان', lasiq: g === 'f' ? 'لاصقة' : 'لاصق', ho: g === 'f' ? 'هي' : 'هو' });

const ordinalRow = (n) => `الصف ${ar(n)}`;
const ordinalCol = (n) => `العمود ${ar(n)}`;

/** قوالب كل نوع: دالة تعيد قائمة صياغات مكافئة المعنى. {room,obj,oth,g} جاهزة. */
const TEMPLATES = {
  inRoom: ({ room }) => [`كنت في ${room}`, `ما طلعت من ${room}`, `أنا؟ كنت في ${room} طول الوقت`, `مكاني كان ${room}`],
  notInRoom: ({ room }) => [`ما قربت ${room} أصلًا`, `ما دخلت ${room}`, `${room}؟ لا، ما كنت هناك`],
  onObject: ({ obj }) => [`كنت عند ${obj} بالضبط`, `واقف عند ${obj}`, `مكاني عند ${obj}، ما تحركت`],
  notOnObject: ({ obj }) => [`ما كنت عند ${obj}`, `${obj}؟ ما وقفت عنده`],
  besideObject: ({ obj }) => [`كنت جنب ${obj}`, `كنت واقف على طول جنب ${obj}`, `${obj} كان بجنبي مباشرة`],
  notBesideObject: ({ obj }) => [`ما كنت جنب ${obj}`, `كنت بعيد عن ${obj}`, `${obj} ما كان بجنبي`],
  inRow: ({ n }) => [`كنت في ${ordinalRow(n)}`, `مكاني في ${ordinalRow(n)} من الخريطة`],
  inCol: ({ n }) => [`كنت في ${ordinalCol(n)}`, `مكاني في ${ordinalCol(n)} من الخريطة`],
  besideChar: ({ oth, g }) => [`كنت جنب ${oth} مباشرة`, `${oth} ${other3(g).kan} ${other3(g).lasiq} فيني`, `أنا و${oth} جنب بعض بالضبط`],
  sameRoom: ({ oth }) => [`كنت مع ${oth} في نفس الغرفة`, `أنا و${oth} في غرفة وحدة`, `${oth} معي في نفس المكان`],
  diffRoom: ({ oth }) => [`ما كنت مع ${oth}، كل واحد في مكان`, `${oth} ما كان في غرفتي`, `أنا و${oth} في غرفتين مختلفتين`],
  rowOffset: ({ oth, n }) => {
    const k = Math.abs(n);
    if (n === -1) return [`كنت في الصف اللي فوق ${oth} مباشرة`, `فوق ${oth} بصف واحد بالضبط`];
    if (n === 1) return [`كنت في الصف اللي تحت ${oth} مباشرة`, `تحت ${oth} بصف واحد بالضبط`];
    const dir = n < 0 ? 'فوق' : 'تحت';
    return [`كنت ${dir} ${oth} ب${k === 2 ? 'صفين' : ar(k) + ' صفوف'} بالضبط`, `بيني وبين ${oth} ${k === 2 ? 'صفين' : ar(k) + ' صفوف'}، وأنا ${dir}`];
  },
  colOffset: ({ oth, n }) => {
    const k = Math.abs(n);
    const dir = colDirectionWord(n);
    if (k === 1) return [`كنت في العمود اللي ${dir} ${oth} مباشرة`, `${dir} ${oth} بعمود واحد بالضبط`];
    return [`كنت ${dir} ${oth} ب${k === 2 ? 'عمودين' : ar(k) + ' أعمدة'} بالضبط`, `بيني وبين ${oth} ${k === 2 ? 'عمودين' : ar(k) + ' أعمدة'}، وأنا ${dir}`];
  },
  aloneInRoom: () => ['كنت لحالي، ما عندي أحد', 'ما كان معي أحد في الغرفة', 'لحالي. لا أحد دخل ولا طلع'],
  aloneWith: ({ oth }) => [`كنت أنا و${oth} بس`, `ما كان معي إلا ${oth}`, `أنا و${oth} لحالنا في الغرفة`],
  roomOccupancy: ({ count }) => [`كنا ${ar(count)} في الغرفة، بالعدد`, `في غرفتي ${ar(count)} أشخاص، أنا منهم`],
};

/**
 * @param {import('../engine/scene.js').Scene} scene
 * @param {object} names  { rooms:{key:ar}, objects:{key:ar}, chars:{key:ar} }
 * @param {import('../engine/random.js').Rng} rng
 * @returns {{clues:Record<string,string>, cards:Record<string,string>, victimCard:string}}
 */
export function voiceClues(scene, names, rng) {
  const charName = (id) => names.chars[scene.char(id).key] ?? scene.char(id).key;
  const ctx = (clue) => ({
    room: clue.room !== undefined ? names.rooms[scene.room(clue.room).key] : undefined,
    obj: clue.object !== undefined ? names.objects[clue.object] ?? clue.object : undefined,
    oth: clue.other !== undefined ? charName(clue.other) : undefined,
    g: clue.other !== undefined ? scene.char(clue.other).gender : 'm',
    n: clue.n,
    count: clue.count,
  });

  const clues = {};
  const byChar = new Map();
  for (const clue of scene.clues) {
    if (clue.type === 'aloneWithKiller') continue;
    const variants = TEMPLATES[clue.type]?.(ctx(clue)) ?? [clue.type];
    const text = rng.pick(variants);
    clues[String(clue.index)] = text;
    if (!byChar.has(clue.char)) byChar.set(clue.char, []);
    byChar.get(clue.char).push(text);
  }

  // بطاقة كل شاهد: جملة أو جملتان بصوته.
  const cards = {};
  for (const ch of scene.characters) {
    if (ch.victim) continue;
    const persona = PERSONAS[ch.voice] ?? PERSONAS.calm;
    const lines = byChar.get(ch.id) ?? [];
    if (!lines.length) {
      cards[ch.key] = rng.pick(['ما عندي شي أقوله.', 'ما شفت شي وما سمعت شي.', 'اسأل غيري.', 'ما لي دخل.']);
      continue;
    }
    const body = lines.length === 1 ? lines[0] : `${lines[0]}، و${lines[1]}${lines.length > 2 ? `، و${lines.slice(2).join('، و')}` : ''}`;
    const open = rng.pick(persona.open);
    const close = rng.pick(persona.close);
    cards[ch.key] = `${open}${body}${close || '.'}`.replace(/\.\.$/, '.').replace(/،\./g, '.');
  }

  const victim = scene.victim;
  const victimCard = victim ? `${charName(victim.id)} ${victim.gender === 'f' ? 'وُجدت وحدها' : 'وُجد وحده'} مع القاتل.` : '';
  return { clues, cards, victimCard };
}

export function personaName(key) {
  return PERSONAS[key]?.ar ?? key;
}
