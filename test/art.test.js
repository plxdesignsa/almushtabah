// اختبارات نظام الفن: كل أرضية وكل قطعة أثاث وكل أفاتار تُنتج SVG صالحًا ومتّسقًا.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OBJECTS, THEMES } from '../src/generator/content.js';
import { avatarSVG } from '../web/art/avatar.js';
import { FLOOR_PALETTE, floorBackground } from '../web/art/floors.js';
import { PROPS, hasProp, propSymbolSheet } from '../web/art/props.js';

test('كل نوع أرضية له ثلاث صيغ مختلفة وصالحة', () => {
  for (const floor of Object.keys(FLOOR_PALETTE)) {
    const v = [0, 1, 2].map((i) => floorBackground(floor, i));
    v.forEach((css) => assert.ok(css.startsWith('url("data:image/svg+xml,') && css.includes('%3Csvg'), floor));
    assert.ok(new Set(v).size >= 2, `${floor}: الصيغ متطابقة`);
  }
});

test('كل غرفة في البيئات لها أرضية معروفة', () => {
  for (const theme of Object.values(THEMES)) for (const r of theme.rooms) assert.ok(r.floor in FLOOR_PALETTE, `${theme.key}/${r.key}: ${r.floor}`);
});

test('كل شيء في الكتالوج له رمز مرسوم، وورقة الرموز واحدة صالحة', () => {
  const missing = Object.keys(OBJECTS).filter((k) => !hasProp(k));
  assert.deepEqual(missing, []);
  const sheet = propSymbolSheet();
  assert.equal((sheet.match(/<symbol /g) ?? []).length, Object.keys(PROPS).length);
  assert.ok(sheet.includes("id='prop-well'"));
});

test('الأفاتار الإجرائي: أرقام مختلفة تعطي رسومًا مختلفة، والجنس يغيّر الزيّ', () => {
  const base = { gender: 'm', avatar: { body: 1, skin: 1, hair: 1, hairColor: 1, facial: 0, clothes: 1, clothesColor: 1, hat: 0 } };
  const a = avatarSVG(base);
  const b = avatarSVG({ ...base, avatar: { ...base.avatar, hat: 1, facial: 2, skin: 4 } });
  const f = avatarSVG({ ...base, gender: 'f' });
  for (const s of [a, b, f]) assert.ok(s.startsWith('<svg') && s.endsWith('</svg>'));
  assert.notEqual(a, b);
  assert.notEqual(a, f);
  assert.ok(avatarSVG(base, { ring: '#f00' }).includes("stroke='#f00'"));
});
