// avatar.js — شخصيات مولّدة من أرقام (القسم 05: «ثلاثة عشر رقمًا تجمّع شخصًا عند الرسم»).
//
// لا شخصية مرسومة يدويًا. الأرقام في avatar تختار: هيئة الجسم، لون البشرة، تسريحة الشعر ولونه،
// شعر الوجه (للرجال)، الملابس ولونها، وغطاء الرأس (غترة/شماغ/طاقية للرجال، شيلة/حجاب للنساء).
// المخرَج: SVG رأس وكتفان (بطاقة) أو قرص صغير (رمز اللوحة). الزيّ سعودي بخط بسيط.

const SKIN = ['#f3d9c4', '#e8c3a2', '#d3a67e', '#b57c55', '#8d5a3b'];
const HAIR = ['#1f1a17', '#3d2a1e', '#6b4a2f', '#8c8c8c'];
const THOBE = ['#ffffff', '#f4efe3', '#e8e6e1', '#dfe8f2', '#e6dccb', '#cfd8e6', '#f1ece0', '#e3e9e3', '#ffffff', '#f6f1e7', '#e9e2d2', '#dcdcdc'];
const ABAYA = ['#1a1a1a', '#262230', '#2c2c2c', '#3a2a3a', '#1e2530', '#2a2a2a', '#332a22', '#242424', '#1a1a1a', '#2b2b35', '#301f24', '#202a2a'];
const SHAYLA = ['#1a1a1a', '#3d2f4a', '#2a3a4a', '#4a2f2f', '#2f4a3a', '#1a1a1a', '#5a4a3a', '#2c2c2c', '#3a3a5a', '#1a1a1a', '#4a3a2a', '#2a2a2a'];
const GHUTRA = ['#ffffff', '#c8392b', '#ffffff', '#c8392b'];

const pick = (arr, n) => arr[Math.abs(Number(n) || 0) % arr.length];

/**
 * @param {object} character  {gender, avatar:{body,skin,hair,hairColor,facial,clothes,clothesColor,hat}}
 * @param {{size?:number, ring?:string, bust?:boolean}} [opts]
 * @returns {string} SVG
 */
export function avatarSVG(character, { size = 64, ring = null, bust = true } = {}) {
  const a = character.avatar ?? {};
  const g = character.gender === 'f' ? 'f' : 'm';
  const skin = pick(SKIN, a.skin ?? 1);
  const hair = pick(HAIR, a.hairColor ?? 1);
  const bodyW = 18 + (((a.body ?? 1) - 1) % 3) * 3;
  const hat = (a.hat ?? 0) % 4;
  const hairStyle = (a.hair ?? 0) % 4;
  const facial = g === 'm' ? (a.facial ?? 0) % 4 : 0;
  const ink = '#2a251f';
  const parts = [];

  // الكتفان والزيّ
  if (bust) {
    const cloth = g === 'm' ? pick(THOBE, a.clothesColor ?? 1) : pick(ABAYA, a.clothesColor ?? 1);
    parts.push(`<path d='M${32 - bodyW} 64 Q${32 - bodyW} 44 32 42 Q${32 + bodyW} 44 ${32 + bodyW} 64 Z' fill='${cloth}' stroke='${ink}' stroke-width='1.6'/>`);
    if (g === 'm') parts.push(`<path d='M32 42 V64 M28 46 L32 50 L36 46' fill='none' stroke='${ink}' stroke-width='1.2' opacity='.6'/>`);
  }

  // العنق والرأس
  parts.push(`<rect x='28' y='34' width='8' height='10' fill='${skin}' stroke='${ink}' stroke-width='1.2'/>`);
  parts.push(`<ellipse cx='32' cy='26' rx='11' ry='13' fill='${skin}' stroke='${ink}' stroke-width='1.6'/>`);

  // الشعر أو غطاء الرأس
  if (g === 'f') {
    const sh = pick(SHAYLA, (a.clothesColor ?? 1) + hat);
    if (hat === 0 && hairStyle !== 3) {
      // شعر ظاهر
      parts.push(`<path d='M21 26 Q20 8 32 10 Q44 8 43 26 L43 40 Q38 34 36 22 Q32 16 28 22 Q26 34 21 40 Z' fill='${hair}' stroke='${ink}' stroke-width='1.4'/>`);
    } else {
      // شيلة/حجاب
      parts.push(`<path d='M19 30 Q18 6 32 8 Q46 6 45 30 L46 52 Q40 44 40 30 Q32 12 24 30 Q24 44 18 52 Z' fill='${sh}' stroke='${ink}' stroke-width='1.4'/>`);
      parts.push(`<path d='M24 30 Q32 16 40 30' fill='none' stroke='${ink}' stroke-width='1' opacity='.4'/>`);
    }
  } else if (hat === 1 || hat === 2) {
    // غترة (بيضاء) أو شماغ (أحمر) بعقال
    const gh = pick(GHUTRA, hat);
    parts.push(`<path d='M19 24 Q19 8 32 8 Q45 8 45 24 L47 50 Q42 40 40 24 Q36 16 32 18 Q28 16 24 24 Q22 40 17 50 Z' fill='${gh}' stroke='${ink}' stroke-width='1.4'/>`);
    if (hat === 2) parts.push(`<path d='M22 14 L42 14 M20 20 L44 20' stroke='#ffffff' stroke-width='1' opacity='.7'/>`);
    parts.push(`<path d='M21 16 Q32 11 43 16' fill='none' stroke='#111' stroke-width='3.2' stroke-linecap='round'/>`);
  } else if (hat === 3) {
    // طاقية
    parts.push(`<path d='M21 20 Q22 9 32 9 Q42 9 43 20 Z' fill='#ffffff' stroke='${ink}' stroke-width='1.4'/>`);
    parts.push(`<path d='M24 14 H40 M26 18 H38' stroke='${ink}' stroke-width='.8' opacity='.4'/>`);
  } else {
    // شعر قصير بأشكال
    const d = ['M21 22 Q22 8 32 9 Q42 8 43 22 Q38 16 32 16 Q26 16 21 22 Z', 'M21 20 Q24 6 32 7 Q40 6 43 20 Q38 12 32 13 Q26 12 21 20 Z', 'M21 24 Q20 10 32 10 Q44 10 43 24 Q36 18 32 19 Q28 18 21 24 Z', 'M22 18 Q28 8 42 14 Q38 12 32 14 Q26 12 22 18 Z'][hairStyle];
    parts.push(`<path d='${d}' fill='${hair}' stroke='${ink}' stroke-width='1.4'/>`);
  }

  // الوجه
  parts.push(`<circle cx='27.5' cy='25' r='1.3' fill='${ink}'/><circle cx='36.5' cy='25' r='1.3' fill='${ink}'/>`);
  parts.push(`<path d='M32 27 L31 31 H33' fill='none' stroke='${ink}' stroke-width='1' opacity='.7'/>`);
  if (facial === 1) parts.push(`<path d='M27 33 Q32 36 37 33' fill='none' stroke='${hair}' stroke-width='2.2' stroke-linecap='round'/>`); // شارب
  else if (facial === 2) parts.push(`<path d='M23 30 Q24 40 32 41 Q40 40 41 30 Q37 36 32 36 Q27 36 23 30 Z' fill='${hair}' stroke='${ink}' stroke-width='1'/>`); // لحية
  else if (facial === 3) parts.push(`<path d='M25 34 Q32 40 39 34' fill='none' stroke='${hair}' stroke-width='2' stroke-linecap='round'/><path d='M27 33 Q32 35 37 33' fill='none' stroke='${hair}' stroke-width='1.6'/>`); // لحية خفيفة وشارب
  else parts.push(`<path d='M29 34 Q32 36 35 34' fill='none' stroke='${ink}' stroke-width='1' opacity='.8'/>`);

  const ringSvg = ring ? `<circle cx='32' cy='32' r='30' fill='none' stroke='${ring}' stroke-width='4'/>` : '';
  const clip = `<clipPath id='c'><circle cx='32' cy='32' r='29'/></clipPath>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='${size}' height='${size}' role='img'><defs>${clip}</defs><circle cx='32' cy='32' r='29' fill='#f6f1e7'/><g clip-path='url(#c)'>${parts.join('')}</g>${ringSvg}</svg>`;
}
